import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import connectDB from "../../config/db.js";
import User from "../../models/User.js";
import Event from "../../models/Event.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";
import RecoveryAnalysis from "../../models/RecoveryAnalysis.js";

import processEvent from "../../services/processEvent.js";
import evaluatePolicy from "../../services/policyService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_FILE = path.join(
    __dirname,
    "data",
    "evaluation-dataset.json"
);

const RESULTS_DIR = path.join(
    __dirname,
    "results"
);

/*
|--------------------------------------------------------------------------
| CLEAN PREVIOUS EVALUATION DATA
|--------------------------------------------------------------------------
|
| Evaluation events are identified by eventId starting with EVAL_.
|
| This allows the evaluation runner to be executed repeatedly without
| manually cleaning MongoDB between runs.
|
|--------------------------------------------------------------------------
*/

const cleanupEvaluationData = async () => {
    const evaluationEvents = await Event.find({
        eventId: /^EVAL_/
    }).select("_id eventId");

    if (evaluationEvents.length === 0) {
        console.log(
            "[CLEANUP] No previous evaluation data found."
        );
        return;
    }

    const eventIds = evaluationEvents.map(
        (event) => event._id
    );

    const deletedAttempts =
        await RecoveryAttempt.deleteMany({
            event: { $in: eventIds }
        });

    const deletedAnalyses =
        await RecoveryAnalysis.deleteMany({
            event: { $in: eventIds }
        });

    const deletedEvents =
        await Event.deleteMany({
            _id: { $in: eventIds }
        });

    console.log(
        `[CLEANUP] Removed previous evaluation data: ` +
        `${deletedEvents.deletedCount} events, ` +
        `${deletedAnalyses.deletedCount} analyses, ` +
        `${deletedAttempts.deletedCount} recovery attempts.`
    );
};

/*
|--------------------------------------------------------------------------
| CONTROLLED EVALUATION ANALYSIS PROVIDER
|--------------------------------------------------------------------------
|
| We intentionally do NOT make 500 Gemini API calls.
|
| The objective here is to evaluate the actual Revenue Rescue pipeline:
|
| Event
| → Customer Context
| → Risk
| → Analysis
| → Policy
| → Recovery
|
| using deterministic recommendations.
|
|--------------------------------------------------------------------------
*/

const evaluationAnalysisProvider = async (
    event,
    context,
    risk
) => {
    let recommendation;

    switch (event.errorCode) {
        case "NETWORK_ERROR":
            recommendation = "RETRY_NOW";
            break;

        case "TIMEOUT":
            recommendation = "WAIT_AND_RETRY";
            break;

        case "GATEWAY_ERROR":
            recommendation = "WAIT_AND_RETRY";
            break;

        case "INSUFFICIENT_FUNDS":
            recommendation = "SEND_PAYMENT_LINK";
            break;

        case "CARD_DECLINED":
            recommendation =
                risk.riskBand === "HIGH"
                    ? "HUMAN_REVIEW"
                    : "SEND_PAYMENT_LINK";
            break;

        default:
            recommendation = "HUMAN_REVIEW";
    }

    return {
        recommendation,

        confidence: 0.90,

        reasoning:
            `Controlled evaluation recommendation: ${recommendation} ` +
            `for ${event.errorCode}.`,

        analysisSummary:
            `Evaluation recommendation generated for ${event.errorCode}.`,

        source: "DETERMINISTIC_FALLBACK"
    };
};

/*
|--------------------------------------------------------------------------
| SEED THREE PREVIOUS RECOVERY ATTEMPTS
|--------------------------------------------------------------------------
|
| Your policy checks:
|
|     recoveryAttemptNumber > 3
|
| It does NOT check event.attemptNumber.
|
| Therefore MAX_ATTEMPTS scenarios need three actual historical
| RecoveryAttempt documents before the fourth decision is evaluated.
|
|--------------------------------------------------------------------------
*/

const seedPreviousAttempts = async (
    event,
    analysis
) => {
    await RecoveryAttempt.create([
        {
            event: event._id,
            analysis: analysis._id,
            recoveryAttemptNumber: 1,
            action: "RETRY_NOW",
            outcome: "FAILED",
            outcomeDetails:
                "Evaluation seed: previous recovery attempt 1."
        },

        {
            event: event._id,
            analysis: analysis._id,
            recoveryAttemptNumber: 2,
            action: "RETRY_NOW",
            outcome: "FAILED",
            outcomeDetails:
                "Evaluation seed: previous recovery attempt 2."
        },

        {
            event: event._id,
            analysis: analysis._id,
            recoveryAttemptNumber: 3,
            action: "RETRY_NOW",
            outcome: "FAILED",
            outcomeDetails:
                "Evaluation seed: previous recovery attempt 3."
        }
    ]);
};

/*
|--------------------------------------------------------------------------
| RUN MAX-ATTEMPTS SCENARIO
|--------------------------------------------------------------------------
|
| Creates:
|
| Event
| Analysis
| Attempt #1
| Attempt #2
| Attempt #3
|
| Then evaluates the REAL policy with attempt #4.
|
|--------------------------------------------------------------------------
*/

const runMaxAttemptsScenario = async (
    eventData,
    user
) => {
    const event = await Event.create({
        user: user._id,

        eventId: eventData.eventId,

        eventType:
            eventData.eventType || "PAYMENT_FAILURE",

        customerId:
            eventData.customerId,

        paymentAmount:
            eventData.paymentAmount,

        status:
            eventData.status,

        errorCode:
            eventData.errorCode,

        attemptNumber:
            eventData.attemptNumber,

        timestamp:
            new Date(eventData.timestamp)
    });

    const analysis =
        await RecoveryAnalysis.create({
            event: event._id,

            analysisNumber: 1,

            recommendation: "RETRY_NOW",

            confidence: 0.90,

            reasoning:
                "Evaluation seed analysis for max-attempt policy.",

            analysisSummary:
                "Testing automatic recovery attempt limits.",

            source: "DETERMINISTIC_FALLBACK"
        });

    await seedPreviousAttempts(
        event,
        analysis
    );

    const existingAttempts =
        await RecoveryAttempt.countDocuments({
            event: event._id
        });

    const nextAttemptNumber =
        existingAttempts + 1;

    const policy = evaluatePolicy(
        0.30,
        "LOW",
        "RETRY_NOW",
        0.90,
        nextAttemptNumber,
        event.paymentAmount
    );

    return {
        event,
        analysis,
        existingAttempts,
        nextAttemptNumber,
        policy
    };
};

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

const main = async () => {
    let user = null;

    try {
        console.log(
            "=============================================="
        );

        console.log(
            "REVENUE RESCUE AI — EVALUATION RUNNER"
        );

        console.log(
            "=============================================="
        );

        console.log();

        /*
         * ----------------------------------------------------------
         * Load dataset
         * ----------------------------------------------------------
         */

        if (!fs.existsSync(DATASET_FILE)) {
            throw new Error(
                `Evaluation dataset not found:\n${DATASET_FILE}`
            );
        }

        const dataset = JSON.parse(
            fs.readFileSync(
                DATASET_FILE,
                "utf8"
            )
        );

        const datasetEvents =
            dataset.events || [];

        console.log(
            `Dataset records: ${datasetEvents.length}`
        );

        /*
         * ----------------------------------------------------------
         * Connect DB
         * ----------------------------------------------------------
         */

        await connectDB();

        /*
         * ----------------------------------------------------------
         * IMPORTANT:
         * Clean old EVAL data BEFORE processing.
         * ----------------------------------------------------------
         */

        await cleanupEvaluationData();

        /*
         * ----------------------------------------------------------
         * Find evaluation user
         * ----------------------------------------------------------
         */

        const userId =
            process.env.WEBHOOK_USER_ID;

        if (!userId) {
            throw new Error(
                "WEBHOOK_USER_ID is not configured in .env"
            );
        }

        user =
            await User.findById(userId);

        if (!user) {
            throw new Error(
                `Evaluation user not found: ${userId}`
            );
        }

        console.log(
            `Evaluation user: ${user.email}`
        );

        /*
         * ----------------------------------------------------------
         * Counters
         * ----------------------------------------------------------
         */

        const summary = {
            totalDatasetRecords:
                datasetEvents.length,

            uniqueDatasetEvents:
                dataset.configuration
                    ?.uniqueEvents || 0,

            processedSuccessfully: 0,

            duplicatesDetected: 0,

            processingFailures: 0,

            recovered: 0,

            recoveryFailed: 0,

            pending: 0,

            escalated: 0,

            blocked: 0,

            maxAttemptsBlocked: 0,

            highRiskEscalated: 0,

            highValueEscalated: 0,

            humanReviewEscalated: 0,

            lowConfidenceEscalated: 0
        };

        const results = [];

        console.log();

        console.log(
            "Starting evaluation..."
        );

        console.log();

        /*
         * ----------------------------------------------------------
         * Process all dataset events
         * ----------------------------------------------------------
         */

        for (
            let index = 0;
            index < datasetEvents.length;
            index += 1
        ) {
            const eventData =
                datasetEvents[index];

            /*
             * ------------------------------------------------------
             * MAX_ATTEMPTS
             * ------------------------------------------------------
             */

            if (
                eventData.evaluationScenario ===
                "MAX_ATTEMPTS"
            ) {
                try {
                    const evaluation =
                        await runMaxAttemptsScenario(
                            eventData,
                            user
                        );

                    summary.processedSuccessfully += 1;

                    /*
                     * Track created event so final cleanup removes it.
                     */
                    const eventId =
                        evaluation.event._id;

                    const policyDecision =
                        evaluation.policy.decision;

                    if (
                        policyDecision ===
                        "BLOCKED"
                    ) {
                        summary.blocked += 1;
                        summary.maxAttemptsBlocked += 1;
                    }

                    results.push({
                        eventId:
                            eventData.eventId,

                        scenario:
                            eventData.evaluationScenario,

                        customerId:
                            eventData.customerId,

                        paymentAmount:
                            eventData.paymentAmount,

                        errorCode:
                            eventData.errorCode,

                        eventAttemptNumber:
                            eventData.attemptNumber,

                        existingRecoveryAttempts:
                            evaluation.existingAttempts,

                        recoveryAttemptNumber:
                            evaluation.nextAttemptNumber,

                        recommendation:
                            "RETRY_NOW",

                        confidence:
                            0.90,

                        riskScore:
                            0.30,

                        riskBand:
                            "LOW",

                        policyDecision,

                        policyReason:
                            evaluation.policy.reason,

                        recoveryOutcome:
                            "BLOCKED",

                        evaluationEventMongoId:
                            eventId
                    });
                } catch (error) {
                    const message =
                        error?.message || "";

                    if (
                        message.includes("E11000") ||
                        message.includes("duplicate key")
                    ) {
                        summary.duplicatesDetected += 1;

                        results.push({
                            eventId:
                                eventData.eventId,

                            scenario:
                                eventData.evaluationScenario,

                            status:
                                "DUPLICATE"
                        });

                        continue;
                    }

                    summary.processingFailures += 1;

                    console.error(
                        `MAX_ATTEMPTS evaluation failed for ` +
                        `${eventData.eventId}: ${message}`
                    );
                }

                continue;
            }

            /*
             * ------------------------------------------------------
             * NORMAL EVENT
             * ------------------------------------------------------
             */

            try {
                const result =
                    await processEvent(
                        {
                            eventId:
                                eventData.eventId,

                            eventType:
                                eventData.eventType ||
                                "PAYMENT_FAILURE",

                            customerId:
                                eventData.customerId,

                            paymentAmount:
                                eventData.paymentAmount,

                            status:
                                eventData.status,

                            errorCode:
                                eventData.errorCode,

                            attemptNumber:
                                eventData.attemptNumber,

                            timestamp:
                                new Date(
                                    eventData.timestamp
                                )
                        },

                        user._id,

                        evaluationAnalysisProvider
                    );

                summary.processedSuccessfully += 1;

                const policyDecision =
                    result.policy?.decision;

                const recoveryOutcome =
                    result.recoveryAttempt?.outcome;

                /*
                 * Policy statistics
                 */

                if (
                    policyDecision ===
                    "ESCALATED"
                ) {
                    summary.escalated += 1;

                    const reason =
                        result.policy?.reason ||
                        "";

                    if (
                        reason.includes(
                            "High-risk"
                        )
                    ) {
                        summary.highRiskEscalated += 1;
                    }

                    if (
                        reason.includes(
                            "Confidence"
                        )
                    ) {
                        summary.lowConfidenceEscalated += 1;
                    }

                    if (
                        reason.includes(
                            "Transaction amount"
                        )
                    ) {
                        summary.highValueEscalated += 1;
                    }

                    if (
                        reason.includes(
                            "Human review"
                        )
                    ) {
                        summary.humanReviewEscalated += 1;
                    }
                }

                if (
                    policyDecision ===
                    "BLOCKED"
                ) {
                    summary.blocked += 1;
                }

                /*
                 * Recovery statistics
                 */

                if (
                    recoveryOutcome ===
                    "RECOVERED"
                ) {
                    summary.recovered += 1;
                }

                if (
                    recoveryOutcome ===
                    "FAILED"
                ) {
                    summary.recoveryFailed += 1;
                }

                if (
                    recoveryOutcome ===
                    "PENDING"
                ) {
                    summary.pending += 1;
                }

                results.push({
                    eventId:
                        eventData.eventId,

                    scenario:
                        eventData.evaluationScenario,

                    customerId:
                        eventData.customerId,

                    paymentAmount:
                        eventData.paymentAmount,

                    errorCode:
                        eventData.errorCode,

                    eventAttemptNumber:
                        eventData.attemptNumber,

                    riskBand:
                        result.risk?.riskBand,

                    riskScore:
                        result.risk?.riskScore,

                    recommendation:
                        result.analysis?.recommendation,

                    confidence:
                        result.analysis?.confidence,

                    analysisSource:
                        result.analysis?.source,

                    policyDecision,

                    policyReason:
                        result.policy?.reason,

                    recoveryAction:
                        result.recoveryAttempt?.action,

                    recoveryOutcome
                });

                if (
                    summary.processedSuccessfully %
                    50 ===
                    0
                ) {
                    console.log(
                        `Processed ${summary.processedSuccessfully}/` +
                        `${summary.uniqueDatasetEvents}`
                    );
                }
            } catch (error) {
                const message =
                    error?.message || "";

                /*
                 * Duplicate eventIds are intentional.
                 */
                if (
                    message.includes("E11000") ||
                    message.includes("duplicate key")
                ) {
                    summary.duplicatesDetected += 1;

                    results.push({
                        eventId:
                            eventData.eventId,

                        scenario:
                            eventData.evaluationScenario,

                        status:
                            "DUPLICATE"
                    });

                    continue;
                }

                summary.processingFailures += 1;

                console.error(
                    `Evaluation failed for ` +
                    `${eventData.eventId}: ${message}`
                );

                results.push({
                    eventId:
                        eventData.eventId,

                    scenario:
                        eventData.evaluationScenario,

                    status:
                        "FAILED",

                    error:
                        message
                });
            }
        }

        /*
         * ----------------------------------------------------------
         * Print summary
         * ----------------------------------------------------------
         */

        console.log();

        console.log(
            "=============================================="
        );

        console.log(
            "EVALUATION SUMMARY"
        );

        console.log(
            "=============================================="
        );

        console.log();

        console.log(
            `Total dataset records:    ${summary.totalDatasetRecords}`
        );

        console.log(
            `Processed successfully:   ${summary.processedSuccessfully}`
        );

        console.log(
            `Duplicates detected:      ${summary.duplicatesDetected}`
        );

        console.log(
            `Processing failures:      ${summary.processingFailures}`
        );

        console.log();

        console.log(
            `Recovered:                ${summary.recovered}`
        );

        console.log(
            `Recovery failed:          ${summary.recoveryFailed}`
        );

        console.log(
            `Pending:                  ${summary.pending}`
        );

        console.log(
            `Escalated:                ${summary.escalated}`
        );

        console.log(
            `Blocked:                  ${summary.blocked}`
        );

        console.log();

        console.log(
            `Max-attempt blocks:       ${summary.maxAttemptsBlocked}`
        );

        console.log(
            `High-risk escalations:    ${summary.highRiskEscalated}`
        );

        console.log(
            `High-value escalations:   ${summary.highValueEscalated}`
        );

        console.log(
            `Human-review escalations: ${summary.humanReviewEscalated}`
        );

        console.log(
            `Low-confidence escalations: ${summary.lowConfidenceEscalated}`
        );

        /*
         * ----------------------------------------------------------
         * Basic integrity check
         * ----------------------------------------------------------
         */

        const expectedProcessed =
            summary.uniqueDatasetEvents;

        if (
            summary.processedSuccessfully !==
            expectedProcessed
        ) {
            console.warn();

            console.warn(
                "WARNING: processed count does not match " +
                "unique dataset event count."
            );

            console.warn(
                `Expected: ${expectedProcessed}`
            );

            console.warn(
                `Actual:   ${summary.processedSuccessfully}`
            );
        }

        if (
            summary.duplicatesDetected !==
            (dataset.configuration
                ?.duplicateEvents || 0)
        ) {
            console.warn();

            console.warn(
                "WARNING: duplicate count does not match dataset configuration."
            );
        }

        /*
         * ----------------------------------------------------------
         * Save detailed report
         * ----------------------------------------------------------
         */

        fs.mkdirSync(
            RESULTS_DIR,
            {
                recursive: true
            }
        );

        const timestamp =
            new Date()
                .toISOString()
                .replace(/[:.]/g, "-");

        const outputFile =
            path.join(
                RESULTS_DIR,
                `evaluation-${timestamp}.json`
            );

        const output = {
            metadata: {
                generatedAt:
                    new Date().toISOString(),

                datasetVersion:
                    dataset.version,

                evaluationUser:
                    user.email,

                evaluationMode:
                    process.env.EVALUATION_MODE
            },

            summary,

            results
        };

        fs.writeFileSync(
            outputFile,

            JSON.stringify(
                output,
                null,
                2
            ),

            "utf8"
        );

        console.log();

        console.log(
            "Detailed results written to:"
        );

        console.log(
            outputFile
        );

        console.log();

        console.log(
            "Evaluation completed."
        );
    } catch (error) {
        console.error();

        console.error(
            "EVALUATION FAILED"
        );

        console.error(
            error?.message || error
        );

        process.exitCode = 1;
    } finally {
        /*
         * ----------------------------------------------------------
         * CLEAN CURRENT EVALUATION DATA
         * ----------------------------------------------------------
         */

        try {
            await cleanupEvaluationData();

            console.log(
                "[CLEANUP] Current evaluation data removed."
            );
        } catch (cleanupError) {
            console.error(
                "[CLEANUP] Failed:",
                cleanupError?.message ||
                cleanupError
            );
        }

        /*
         * ----------------------------------------------------------
         * Close MongoDB
         * ----------------------------------------------------------
         */

        if (
            mongoose.connection.readyState !== 0
        ) {
            await mongoose.connection.close();
        }
    }
};

main();