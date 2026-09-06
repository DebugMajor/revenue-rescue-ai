import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const OUTPUT_FILE = path.join(
    RESULTS_DIR,
    "evaluation-metrics.json"
);

/*
|--------------------------------------------------------------------------
| Find latest evaluation result
|--------------------------------------------------------------------------
*/

const getLatestResultFile = () => {
    if (!fs.existsSync(RESULTS_DIR)) {
        throw new Error(
            "Evaluation results directory does not exist."
        );
    }

    const files = fs
        .readdirSync(RESULTS_DIR)
        .filter(
            (file) =>
                file.startsWith("evaluation-") &&
                file.endsWith(".json") &&
                file !== "evaluation-metrics.json"
        )
        .map((file) => ({
            file,
            fullPath: path.join(
                RESULTS_DIR,
                file
            ),
            time: fs.statSync(
                path.join(
                    RESULTS_DIR,
                    file
                )
            ).mtimeMs
        }))
        .sort(
            (a, b) => b.time - a.time
        );

    if (files.length === 0) {
        throw new Error(
            "No evaluation result JSON file found."
        );
    }

    return files[0].fullPath;
};

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

const main = () => {
    console.log(
        "=============================================="
    );

    console.log(
        "REVENUE RESCUE AI — REVENUE METRICS"
    );

    console.log(
        "=============================================="
    );

    console.log();

    /*
     * Load dataset
     */

    if (!fs.existsSync(DATASET_FILE)) {
        throw new Error(
            `Dataset not found:\n${DATASET_FILE}`
        );
    }

    const dataset = JSON.parse(
        fs.readFileSync(
            DATASET_FILE,
            "utf8"
        )
    );

    /*
     * Load latest evaluation result
     */

    const resultFile =
        getLatestResultFile();

    const evaluation = JSON.parse(
        fs.readFileSync(
            resultFile,
            "utf8"
        )
    );

    const results =
        evaluation.results || [];

    /*
     * ----------------------------------------------------------
     * Revenue at Risk
     *
     * Sum of unique payment amounts represented by the
     * evaluation events.
     *
     * Duplicate eventIds are counted only once.
     * ----------------------------------------------------------
     */

    const uniqueEvents = new Map();

    for (const event of dataset.events) {
        if (!uniqueEvents.has(event.eventId)) {
            uniqueEvents.set(
                event.eventId,
                event
            );
        }
    }

    let revenueAtRisk = 0;

    for (const event of uniqueEvents.values()) {
        revenueAtRisk +=
            Number(event.paymentAmount) || 0;
    }

    /*
     * ----------------------------------------------------------
     * Recovery probabilities
     *
     * These are deliberately explicit assumptions for the
     * evaluation model.
     *
     * They are NOT claimed to be learned from production data.
     * ----------------------------------------------------------
     */

    const recoveryProbability = {
        RETRY_NOW: 0.80,
        WAIT_AND_RETRY: 0.65,
        SEND_PAYMENT_LINK: 0.55
    };

    /*
     * ----------------------------------------------------------
     * Expected Recovery
     *
     * Only automatically executable approved recovery actions
     * contribute to expected recovery.
     * ----------------------------------------------------------
     */

    let expectedRecovery = 0;

    for (const result of results) {
        if (
            result.status === "DUPLICATE" ||
            result.status === "FAILED"
        ) {
            continue;
        }

        if (
            result.policyDecision !==
            "APPROVED"
        ) {
            continue;
        }

        const action =
            result.recoveryAction;

        const probability =
            recoveryProbability[action];

        if (!probability) {
            continue;
        }

        expectedRecovery +=
            Number(result.paymentAmount || 0) *
            probability;
    }

    /*
     * ----------------------------------------------------------
     * Recovered Revenue
     *
     * Sum amounts where the recovery outcome is RECOVERED.
     * ----------------------------------------------------------
     */

    let recoveredRevenue = 0;

    for (const result of results) {
        if (
            result.recoveryOutcome ===
            "RECOVERED"
        ) {
            recoveredRevenue +=
                Number(
                    result.paymentAmount
                ) || 0;
        }
    }

    /*
     * ----------------------------------------------------------
     * Pending Revenue
     * ----------------------------------------------------------
     */

    let pendingRevenue = 0;

    for (const result of results) {
        if (
            result.recoveryOutcome ===
            "PENDING"
        ) {
            pendingRevenue +=
                Number(
                    result.paymentAmount
                ) || 0;
        }
    }

    /*
     * ----------------------------------------------------------
     * Escalated Revenue
     * ----------------------------------------------------------
     */

    let escalatedRevenue = 0;

    for (const result of results) {
        if (
            result.policyDecision ===
            "ESCALATED"
        ) {
            escalatedRevenue +=
                Number(
                    result.paymentAmount
                ) || 0;
        }
    }

    /*
     * ----------------------------------------------------------
     * Blocked Revenue
     * ----------------------------------------------------------
     */

    let blockedRevenue = 0;

    for (const result of results) {
        if (
            result.policyDecision ===
            "BLOCKED"
        ) {
            blockedRevenue +=
                Number(
                    result.paymentAmount
                ) || 0;
        }
    }

    /*
     * ----------------------------------------------------------
     * Recovery Rate
     *
     * Recovered revenue divided by revenue that was actually
     * exposed to an automatic recovery decision.
     *
     * This is different from recovered / total events.
     * ----------------------------------------------------------
     */

    const executableRevenue =
        results
            .filter(
                (result) =>
                    result.policyDecision ===
                    "APPROVED"
            )
            .reduce(
                (sum, result) =>
                    sum +
                    (Number(
                        result.paymentAmount
                    ) || 0),
                0
            );

    const recoveryRate =
        executableRevenue > 0
            ? recoveredRevenue /
              executableRevenue
            : 0;

    /*
     * ----------------------------------------------------------
     * Action distribution
     * ----------------------------------------------------------
     */

    const actionCounts = {};

    for (const result of results) {
        const action =
            result.recoveryAction ||
            result.recommendation;

        if (!action) {
            continue;
        }

        actionCounts[action] =
            (actionCounts[action] || 0) +
            1;
    }

    /*
     * ----------------------------------------------------------
     * Error distribution
     * ----------------------------------------------------------
     */

    const errorMetrics = {};

    for (const result of results) {
        const errorCode =
            result.errorCode ||
            "UNKNOWN";

        if (!errorMetrics[errorCode]) {
            errorMetrics[errorCode] = {
                events: 0,
                recovered: 0,
                pending: 0,
                escalated: 0,
                blocked: 0,
                revenueAtRisk: 0,
                recoveredRevenue: 0
            };
        }

        errorMetrics[errorCode].events += 1;

        errorMetrics[errorCode]
            .revenueAtRisk +=
            Number(
                result.paymentAmount
            ) || 0;

        if (
            result.recoveryOutcome ===
            "RECOVERED"
        ) {
            errorMetrics[errorCode]
                .recovered += 1;

            errorMetrics[errorCode]
                .recoveredRevenue +=
                Number(
                    result.paymentAmount
                ) || 0;
        }

        if (
            result.recoveryOutcome ===
            "PENDING"
        ) {
            errorMetrics[errorCode]
                .pending += 1;
        }

        if (
            result.policyDecision ===
            "ESCALATED"
        ) {
            errorMetrics[errorCode]
                .escalated += 1;
        }

        if (
            result.policyDecision ===
            "BLOCKED"
        ) {
            errorMetrics[errorCode]
                .blocked += 1;
        }
    }

    /*
     * ----------------------------------------------------------
     * Final metrics
     * ----------------------------------------------------------
     */

    const metrics = {
        generatedAt:
            new Date().toISOString(),

        sourceEvaluationFile:
            path.basename(
                resultFile
            ),

        dataset: {
            uniqueEvents:
                dataset.configuration
                    ?.uniqueEvents || 0,

            duplicateEvents:
                dataset.configuration
                    ?.duplicateEvents || 0,

            totalRecords:
                dataset.configuration
                    ?.totalRecords || 0
        },

        financial: {
            revenueAtRisk:
                Number(
                    revenueAtRisk.toFixed(2)
                ),

            expectedRecovery:
                Number(
                    expectedRecovery.toFixed(2)
                ),

            recoveredRevenue:
                Number(
                    recoveredRevenue.toFixed(2)
                ),

            pendingRevenue:
                Number(
                    pendingRevenue.toFixed(2)
                ),

            escalatedRevenue:
                Number(
                    escalatedRevenue.toFixed(2)
                ),

            blockedRevenue:
                Number(
                    blockedRevenue.toFixed(2)
                ),

            recoveryRate:
                Number(
                    recoveryRate.toFixed(4)
                )
        },

        outcomes: {
            recovered:
                evaluation.summary
                    ?.recovered || 0,

            pending:
                evaluation.summary
                    ?.pending || 0,

            escalated:
                evaluation.summary
                    ?.escalated || 0,

            blocked:
                evaluation.summary
                    ?.blocked || 0,

            recoveryFailed:
                evaluation.summary
                    ?.recoveryFailed || 0,

            duplicatesPrevented:
                evaluation.summary
                    ?.duplicatesDetected || 0
        },

        policy: {
            maxAttemptsBlocked:
                evaluation.summary
                    ?.maxAttemptsBlocked || 0,

            highRiskEscalated:
                evaluation.summary
                    ?.highRiskEscalated || 0,

            highValueEscalated:
                evaluation.summary
                    ?.highValueEscalated || 0,

            humanReviewEscalated:
                evaluation.summary
                    ?.humanReviewEscalated || 0,

            lowConfidenceEscalated:
                evaluation.summary
                    ?.lowConfidenceEscalated || 0
        },

        actionCounts,

        errorMetrics
    };

    /*
     * ----------------------------------------------------------
     * Write metrics
     * ----------------------------------------------------------
     */

    fs.mkdirSync(
        RESULTS_DIR,
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(
            metrics,
            null,
            2
        ),
        "utf8"
    );

    /*
     * ----------------------------------------------------------
     * Console output
     * ----------------------------------------------------------
     */

    console.log(
        "Revenue at Risk:",
        `₹${metrics.financial.revenueAtRisk.toLocaleString("en-IN")}`
    );

    console.log(
        "Expected Recovery:",
        `₹${metrics.financial.expectedRecovery.toLocaleString("en-IN")}`
    );

    console.log(
        "Recovered Revenue:",
        `₹${metrics.financial.recoveredRevenue.toLocaleString("en-IN")}`
    );

    console.log(
        "Pending Revenue:",
        `₹${metrics.financial.pendingRevenue.toLocaleString("en-IN")}`
    );

    console.log(
        "Escalated Revenue:",
        `₹${metrics.financial.escalatedRevenue.toLocaleString("en-IN")}`
    );

    console.log(
        "Blocked Revenue:",
        `₹${metrics.financial.blockedRevenue.toLocaleString("en-IN")}`
    );

    console.log(
        "Recovery Rate:",
        `${(
            metrics.financial.recoveryRate *
            100
        ).toFixed(2)}%`
    );

    console.log();

    console.log(
        `Metrics written to:\n${OUTPUT_FILE}`
    );
};

main();