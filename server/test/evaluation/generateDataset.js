import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "evaluation-dataset.json");

const EVENT_COUNT = 500;
const CUSTOMER_COUNT = 75;

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = (items) =>
    items[randomInt(0, items.length - 1)];

const generateAmount = (min = 500, max = 25000) =>
    randomInt(min, max);

const generateCustomerProfile = (index) => {
    const successfulPayments = randomInt(0, 15);
    const failedPayments = randomInt(0, 5);

    return {
        customerId: `eval_customer_${String(index + 1).padStart(3, "0")}`,
        successfulPayments,
        failedPayments,
        totalPayments: successfulPayments + failedPayments
    };
};

const generateTimestamp = () => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return new Date(
        now - randomInt(0, thirtyDays)
    ).toISOString();
};

/*
 * ------------------------------------------------------------
 * CONTROLLED SCENARIOS
 *
 * Instead of pure randomness, deliberately create policy
 * boundary cases.
 * ------------------------------------------------------------
 */

const SCENARIOS = [
    // 1. Normal approved recovery
    {
        name: "NORMAL_NETWORK",
        errorCode: "NETWORK_ERROR",
        attemptNumber: 1,
        amount: () => generateAmount(500, 20000)
    },

    {
        name: "NORMAL_TIMEOUT",
        errorCode: "TIMEOUT",
        attemptNumber: 1,
        amount: () => generateAmount(500, 20000)
    },

    {
        name: "NORMAL_GATEWAY",
        errorCode: "GATEWAY_ERROR",
        attemptNumber: 1,
        amount: () => generateAmount(500, 20000)
    },

    {
        name: "INSUFFICIENT_FUNDS",
        errorCode: "INSUFFICIENT_FUNDS",
        attemptNumber: 1,
        amount: () => generateAmount(500, 20000)
    },

    // 2. High-value escalation
    {
        name: "HIGH_VALUE",
        errorCode: "NETWORK_ERROR",
        attemptNumber: 1,
        amount: () => generateAmount(100000, 150000)
    },

    // 3. High-attempt blocking
    {
        name: "MAX_ATTEMPTS",
        errorCode: "NETWORK_ERROR",
        attemptNumber: 4,
        amount: () => generateAmount(500, 20000)
    },

    // 4. High-risk candidates
    {
        name: "HIGH_RISK",
        errorCode: "CARD_DECLINED",
        attemptNumber: 1,
        amount: () => generateAmount(500, 20000)
    },

    // 5. Card decline
    {
        name: "CARD_DECLINED",
        errorCode: "CARD_DECLINED",
        attemptNumber: 1,
        amount: () => generateAmount(500, 20000)
    }
];

/*
 * Explicit counts ensure that the evaluation contains
 * enough boundary scenarios.
 */
const SCENARIO_COUNTS = {
    NORMAL_NETWORK: 100,
    NORMAL_TIMEOUT: 75,
    NORMAL_GATEWAY: 75,

    INSUFFICIENT_FUNDS: 75,

    HIGH_VALUE: 50,

    MAX_ATTEMPTS: 50,

    HIGH_RISK: 40,

    CARD_DECLINED: 35
};

const buildScenarioList = () => {
    const result = [];

    for (const scenario of SCENARIOS) {
        const count = SCENARIO_COUNTS[scenario.name] || 0;

        for (let i = 0; i < count; i += 1) {
            result.push(scenario);
        }
    }

    return result;
};

const main = () => {
    console.log("==============================================");
    console.log("REVENUE RESCUE AI — CONTROLLED DATASET");
    console.log("==============================================");
    console.log();

    const customers = Array.from(
        { length: CUSTOMER_COUNT },
        (_, index) => generateCustomerProfile(index)
    );

    const scenarios = buildScenarioList();

    // Safety check.
    if (scenarios.length !== EVENT_COUNT) {
        throw new Error(
            `Scenario count ${scenarios.length} does not equal EVENT_COUNT ${EVENT_COUNT}`
        );
    }

    // Shuffle scenario order.
    scenarios.sort(() => Math.random() - 0.5);

    const events = scenarios.map((scenario, index) => {
        const customer =
            randomChoice(customers);

        return {
            eventId: `EVAL_${String(index + 1).padStart(4, "0")}`,

            eventType: "PAYMENT_FAILURE",

            customerId:
                customer.customerId,

            paymentAmount:
                scenario.amount(),

            status: "FAILED",

            errorCode:
                scenario.errorCode,

            attemptNumber:
                scenario.attemptNumber,

            timestamp:
                generateTimestamp(),

            evaluationScenario:
                scenario.name
        };
    });

    /*
     * Add deliberate duplicate eventIds.
     */
    const duplicateCount = 15;

    const duplicates = [];

    for (let i = 0; i < duplicateCount; i += 1) {
        const source =
            events[randomInt(0, events.length - 1)];

        duplicates.push({
            ...source,

            // IMPORTANT:
            // Keep exactly the same eventId.
            // This tests your unique constraint/idempotency.
            eventId: source.eventId,

            evaluationScenario:
                `${source.evaluationScenario}_DUPLICATE`
        });
    }

    const datasetEvents = [
        ...events,
        ...duplicates
    ];

    const scenarioDistribution = {};

    for (const event of events) {
        scenarioDistribution[event.evaluationScenario] =
            (scenarioDistribution[event.evaluationScenario] || 0) + 1;
    }

    const dataset = {
        version: "2.0",

        generatedAt:
            new Date().toISOString(),

        configuration: {
            uniqueEvents: EVENT_COUNT,
            customerCount: CUSTOMER_COUNT,
            duplicateEvents: duplicateCount,
            totalRecords: datasetEvents.length
        },

        scenarioDistribution,

        customers,

        events: datasetEvents
    };

    fs.mkdirSync(
        OUTPUT_DIR,
        { recursive: true }
    );

    fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(
            dataset,
            null,
            2
        ),
        "utf8"
    );

    console.log(
        `Unique events:     ${EVENT_COUNT}`
    );

    console.log(
        `Customers:         ${CUSTOMER_COUNT}`
    );

    console.log(
        `Duplicate events:  ${duplicateCount}`
    );

    console.log(
        `Total records:     ${datasetEvents.length}`
    );

    console.log();

    console.log("Scenario distribution:");

    for (const [scenario, count] of Object.entries(
        scenarioDistribution
    )) {
        console.log(
            `  ${scenario.padEnd(24)} ${count}`
        );
    }

    console.log();

    console.log(
        "Dataset written to:"
    );

    console.log(OUTPUT_FILE);

    console.log();
    console.log("Generation complete.");
};

main();