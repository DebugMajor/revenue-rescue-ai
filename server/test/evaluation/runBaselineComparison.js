import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
    simulateRecovery
} from "./outcomeSimulator.js";

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const DATASET_FILE =
    path.join(
        __dirname,
        "data",
        "evaluation-dataset.json"
    );

const RESULTS_DIR =
    path.join(
        __dirname,
        "results"
    );

const OUTPUT_FILE =
    path.join(
        RESULTS_DIR,
        "baseline-comparison.json"
    );

/*
|--------------------------------------------------------------------------
| Find latest Revenue Rescue evaluation
|--------------------------------------------------------------------------
*/

const getLatestEvaluationResult = () => {
    const files =
        fs.readdirSync(RESULTS_DIR)
            .filter(
                (file) =>
                    file.startsWith("evaluation-") &&
                    file.endsWith(".json") &&
                    file !== "evaluation-metrics.json"
            )
            .map((file) => {
                const fullPath =
                    path.join(
                        RESULTS_DIR,
                        file
                    );

                return {
                    file,
                    fullPath,
                    modified:
                        fs.statSync(
                            fullPath
                        ).mtimeMs
                };
            })
            .sort(
                (a, b) =>
                    b.modified -
                    a.modified
            );

    if (files.length === 0) {
        throw new Error(
            "No Revenue Rescue evaluation result found."
        );
    }

    return JSON.parse(
        fs.readFileSync(
            files[0].fullPath,
            "utf8"
        )
    );
};

/*
|--------------------------------------------------------------------------
| Remove duplicate event IDs
|--------------------------------------------------------------------------
*/

const getUniqueEvents = (
    dataset
) => {
    const unique =
        new Map();

    for (
        const event of dataset.events
    ) {
        if (
            !unique.has(
                event.eventId
            )
        ) {
            unique.set(
                event.eventId,
                event
            );
        }
    }

    return [
        ...unique.values()
    ];
};

/*
|--------------------------------------------------------------------------
| Empty strategy summary
|--------------------------------------------------------------------------
*/

const createSummary = () => ({
    events: 0,

    automaticallyActed: 0,

    noAction: 0,

    recoveredEvents: 0,

    recoveredRevenue: 0,

    exposedRevenue: 0,

    unnecessaryRetries: 0,

    escalated: 0,

    blocked: 0
});

/*
|--------------------------------------------------------------------------
| Finalize derived metrics
|--------------------------------------------------------------------------
*/

const finalizeSummary = (
    summary,
    totalRevenue
) => ({
    ...summary,

    recoveryRateByExposedRevenue:
        summary.exposedRevenue > 0
            ? summary.recoveredRevenue /
              summary.exposedRevenue
            : 0,

    recoveryRateByTotalRevenue:
        totalRevenue > 0
            ? summary.recoveredRevenue /
              totalRevenue
            : 0,

    unnecessaryRetryRate:
        summary.automaticallyActed > 0
            ? summary.unnecessaryRetries /
              summary.automaticallyActed
            : 0
});

/*
|--------------------------------------------------------------------------
| BASELINE A
|
| Retry every failed payment.
|--------------------------------------------------------------------------
*/

const runRetryEverything = (
    events
) => {
    const summary =
        createSummary();

    for (
        const event of events
    ) {
        summary.events += 1;

        summary.automaticallyActed += 1;

        summary.exposedRevenue +=
            Number(
                event.paymentAmount
            ) || 0;

        const simulation =
            simulateRecovery(
                event,
                "RETRY_NOW"
            );

        if (
            simulation.recovered
        ) {
            summary.recoveredEvents += 1;

            summary.recoveredRevenue +=
                Number(
                    event.paymentAmount
                ) || 0;
        }

        /*
         * Retrying CARD_DECLINED and INSUFFICIENT_FUNDS
         * is considered unnecessary for this baseline.
         */
        if (
            event.errorCode ===
                "CARD_DECLINED" ||
            event.errorCode ===
                "INSUFFICIENT_FUNDS"
        ) {
            summary.unnecessaryRetries += 1;
        }
    }

    return summary;
};

/*
|--------------------------------------------------------------------------
| BASELINE B
|
| Simple deterministic rules.
|--------------------------------------------------------------------------
*/

const runSimpleRules = (
    events
) => {
    const summary =
        createSummary();

    for (
        const event of events
    ) {
        summary.events += 1;

        const transient =
            [
                "NETWORK_ERROR",
                "TIMEOUT",
                "GATEWAY_ERROR"
            ].includes(
                event.errorCode
            );

        if (!transient) {
            summary.noAction += 1;
            continue;
        }

        summary.automaticallyActed += 1;

        summary.exposedRevenue +=
            Number(
                event.paymentAmount
            ) || 0;

        const action =
            event.errorCode ===
                "NETWORK_ERROR"
                ? "RETRY_NOW"
                : "WAIT_AND_RETRY";

        const simulation =
            simulateRecovery(
                event,
                action
            );

        if (
            simulation.recovered
        ) {
            summary.recoveredEvents += 1;

            summary.recoveredRevenue +=
                Number(
                    event.paymentAmount
                ) || 0;
        }
    }

    return summary;
};

/*
|--------------------------------------------------------------------------
| REVENUE RESCUE
|
| Use the actual evaluation result produced by processEvent().
|--------------------------------------------------------------------------
*/

const extractRevenueRescue = (
    evaluation
) => {
    const summary =
        createSummary();

    for (
        const result of
            evaluation.results || []
    ) {
        /*
         * Deliberate duplicates were not independently processed.
         */
        if (
            result.status ===
            "DUPLICATE"
        ) {
            continue;
        }

        summary.events += 1;

        if (
            result.policyDecision ===
            "APPROVED"
        ) {
            summary.automaticallyActed += 1;

            summary.exposedRevenue +=
                Number(
                    result.paymentAmount
                ) || 0;

            /*
             * The actual Revenue Rescue simulation already
             * produced the recovery outcome, so we use it directly.
             */
            if (
                result.recoveryOutcome ===
                "RECOVERED"
            ) {
                summary.recoveredEvents += 1;

                summary.recoveredRevenue +=
                    Number(
                        result.paymentAmount
                    ) || 0;
            }
        }

        if (
            result.policyDecision ===
            "ESCALATED"
        ) {
            summary.escalated += 1;
        }

        if (
            result.policyDecision ===
            "BLOCKED"
        ) {
            summary.blocked += 1;
        }
    }

    return summary;
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
        "REVENUE RESCUE AI — BASELINE COMPARISON"
    );

    console.log(
        "=============================================="
    );

    console.log();

    /*
     * Load dataset
     */

    if (
        !fs.existsSync(
            DATASET_FILE
        )
    ) {
        throw new Error(
            `Dataset not found:\n${DATASET_FILE}`
        );
    }

    const dataset =
        JSON.parse(
            fs.readFileSync(
                DATASET_FILE,
                "utf8"
            )
        );

    const events =
        getUniqueEvents(
            dataset
        );

    /*
     * Total revenue across all unique events.
     */

    const totalRevenue =
        events.reduce(
            (sum, event) =>
                sum +
                (
                    Number(
                        event.paymentAmount
                    ) || 0
                ),
            0
        );

    console.log(
        `Unique events compared: ${events.length}`
    );

    console.log();

    /*
     * Load actual Revenue Rescue evaluation.
     */

    const evaluation =
        getLatestEvaluationResult();

    /*
     * Run all strategies.
     */

    const retryEverything =
        finalizeSummary(
            runRetryEverything(
                events
            ),
            totalRevenue
        );

    const simpleRules =
        finalizeSummary(
            runSimpleRules(
                events
            ),
            totalRevenue
        );

    const revenueRescue =
        finalizeSummary(
            extractRevenueRescue(
                evaluation
            ),
            totalRevenue
        );

    /*
     * Build output.
     */

    const output = {
        generatedAt:
            new Date().toISOString(),

        dataset: {
            uniqueEvents:
                dataset.configuration
                    ?.uniqueEvents ||
                events.length,

            duplicateEvents:
                dataset.configuration
                    ?.duplicateEvents ||
                0,

            totalRevenueAtRisk:
                totalRevenue
        },

        methodology: {
            type:
                "Controlled synthetic comparison",

            outcomeModel:
                "Same deterministic outcome simulator for baseline strategies",

            revenueRescueSource:
                "Observed outcomes from Revenue Rescue evaluation",

            baselineSource:
                "Same deterministic outcome simulator",

            fairnessRule:
                "All strategies receive the same event set and deterministic event/action outcome mapping.",

            note:
                "This evaluation is synthetic and does not represent production payment-provider recovery rates."
        },

        strategies: {
            retryEverything,

            simpleRules,

            revenueRescue
        }
    };

    fs.mkdirSync(
        RESULTS_DIR,
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        OUTPUT_FILE,

        JSON.stringify(
            output,
            null,
            2
        ),

        "utf8"
    );

    /*
     * Print results.
     */

    const printStrategy = (
        name,
        summary
    ) => {
        console.log(name);

        console.log(
            `  Events:               ${summary.events}`
        );

        console.log(
            `  Automatic actions:    ${summary.automaticallyActed}`
        );

        console.log(
            `  No action:            ${summary.noAction}`
        );

        console.log(
            `  Recovered events:     ${summary.recoveredEvents}`
        );

        console.log(
            `  Recovered revenue:    ₹${summary.recoveredRevenue.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            )}`
        );

        console.log(
            `  Exposed revenue:      ₹${summary.exposedRevenue.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            )}`
        );

        console.log(
            `  Escalated:            ${summary.escalated}`
        );

        console.log(
            `  Blocked:              ${summary.blocked}`
        );

        console.log(
            `  Unnecessary retries:  ${summary.unnecessaryRetries}`
        );

        console.log(
            `  Recovery rate:        ${(
                summary.recoveryRateByExposedRevenue *
                100
            ).toFixed(2)}%`
        );

        console.log();
    };

    printStrategy(
        "BASELINE A — RETRY EVERYTHING",
        retryEverything
    );

    printStrategy(
        "BASELINE B — SIMPLE RULES",
        simpleRules
    );

    printStrategy(
        "REVENUE RESCUE",
        revenueRescue
    );

    console.log(
        "=============================================="
    );

    console.log(
        `Comparison written to:\n${OUTPUT_FILE}`
    );

    console.log(
        "=============================================="
    );
};

main();