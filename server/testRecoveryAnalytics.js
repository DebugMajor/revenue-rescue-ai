import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";

import getRecoveryRate from "./services/recoveryAnalyticsService.js";

const test = async () => {
    await connectDB();

    const testEventIds = [];
    const testAttemptIds = [];

    try {
        console.log("==================================================");
        console.log("RECOVERY RATE ANALYTICS TEST");
        console.log("==================================================");

        // -------------------------------------------------
        // Create temporary test events
        // -------------------------------------------------

        const outcomes = [
            "RECOVERED",
            "RECOVERED",
            "FAILED",
            "PENDING"
        ];

        for (let i = 0; i < outcomes.length; i++) {

            const event = await Event.create({
                eventId: `TEST_ANALYTICS_EVENT_${Date.now()}_${i}`,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_ANALYTICS_CUSTOMER_${Date.now()}_${i}`,
                paymentAmount: 1000,
                status: "FAILED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            });

            testEventIds.push(event._id);

            // RecoveryAnalysis reference required by schema
            const analysis = await RecoveryAnalysis.create({
                event: event._id,
                analysisNumber: 1,
                analysisSummary: "Analytics test analysis.",
                recommendation: "RETRY_NOW",
                confidence: 0.8,
                reasoning: "Analytics test reasoning.",
                source: "DETERMINISTIC_FALLBACK"
            });

            const attempt = await RecoveryAttempt.create({
                event: event._id,
                analysis: analysis._id,
                recoveryAttemptNumber: 1,
                action: "RETRY_NOW",
                outcome: outcomes[i],
                outcomeDetails: `Analytics test outcome: ${outcomes[i]}`
            });

            testAttemptIds.push(attempt._id);
        }

        console.log("\n[SETUP]");
        console.log("Created test outcomes:");
        console.log("RECOVERED: 2");
        console.log("FAILED: 1");
        console.log("PENDING: 1");

        // -------------------------------------------------
        // Run Recovery Rate
        // -------------------------------------------------

        const result = await getRecoveryRate(testEventIds);

        console.log("\n[RESULT]");
        console.log(result);

        // -------------------------------------------------
        // Assertions
        // -------------------------------------------------

        if (result.recoveredAttempts !== 2) {
            throw new Error(
                `Expected 2 recovered attempts, got ${result.recoveredAttempts}`
            );
        }

        if (result.failedAttempts !== 1) {
            throw new Error(
                `Expected 1 failed attempt, got ${result.failedAttempts}`
            );
        }

        if (result.recoveryRate !== 2 / 3) {
            throw new Error(
                `Expected recovery rate ${2 / 3}, got ${result.recoveryRate}`
            );
        }

        /*
         * IMPORTANT:
         * getRecoveryRate() currently aggregates the entire database,
         * so these assertions only verify that our test records were
         * included and PENDING was excluded.
         *
         * The exact 2/3 value will only be possible after the analytics
         * function supports filtering by test batch / event IDs.
         */
        const expectedTestRate = 2 / 3;

        console.log("\n[EXPECTED TEST DATA RATE]");
        console.log(expectedTestRate);

        console.log("\n[NOTE]");
        console.log(
            "The current analytics function reads all RecoveryAttempt documents."
        );
        console.log(
            "Therefore the returned overall rate may include existing data."
        );

        console.log("\n>>> RECOVERY RATE TEST PASSED <<<");

    } catch (error) {

        console.error("\n>>> TEST FAILED <<<");
        console.error(error.message);

    } finally {

        // Delete RecoveryAttempts first
        if (testAttemptIds.length > 0) {
            await RecoveryAttempt.deleteMany({
                _id: {
                    $in: testAttemptIds
                }
            });
        }

        // Delete all test analyses
        if (testEventIds.length > 0) {
            await RecoveryAnalysis.deleteMany({
                event: {
                    $in: testEventIds
                }
            });
        }

        // Delete test events
        if (testEventIds.length > 0) {
            await Event.deleteMany({
                _id: {
                    $in: testEventIds
                }
            });
        }

        console.log("\n[CLEANUP] Temporary analytics data removed.");

        await mongoose.connection.close();
    }
};

test();