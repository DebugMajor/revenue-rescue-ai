import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

import connectDB from "../../config/db.js";

import Event from "../../models/Event.js";
import RecoveryAnalysis from "../../models/RecoveryAnalysis.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";

import recoveryAnalyticsService from "../../services/recoveryAnalyticsService.js";

const {
    getRecoveryRate,
    getHistoricalRecoveryProbability,
    getExpectedRecoveryValue
} = recoveryAnalyticsService;


const runTests = async () => {

    await connectDB();

    const timestamp = Date.now();

    const testEventIds = [];
    const testAnalysisIds = [];
    const testAttemptIds = [];

    try {

        console.log("==================================================");
        console.log("RUNNING RECOVERY ANALYTICS TESTS");
        console.log("==================================================");

        // ==================================================
        // SETUP CONTROLLED TEST DATA
        // ==================================================

        const outcomes = [
            "RECOVERED",
            "RECOVERED",
            "FAILED",
            "PENDING"
        ];

        for (let i = 0; i < outcomes.length; i++) {

            const event = await Event.create({
                eventId: `TEST_ANALYTICS_EVENT_${timestamp}_${i}`,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_ANALYTICS_CUSTOMER_${timestamp}_${i}`,
                paymentAmount: 5000,
                status: "FAILED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            });

            testEventIds.push(event._id);

            const analysis = await RecoveryAnalysis.create({
                event: event._id,
                analysisNumber: 1,
                analysisSummary: "Recovery analytics test.",
                recommendation: "RETRY_NOW",
                confidence: 0.8,
                reasoning: "Recovery analytics test.",
                source: "DETERMINISTIC_FALLBACK"
            });

            testAnalysisIds.push(analysis._id);

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
        console.log("RECOVERED: 2");
        console.log("FAILED: 1");
        console.log("PENDING: 1");


        // ==================================================
        // TEST 1 — RECOVERY RATE
        // ==================================================

        console.log("\n===== TEST 1: RECOVERY RATE =====");

        const recoveryRateResult =
            await getRecoveryRate(testEventIds);

        console.log(recoveryRateResult);

        if (recoveryRateResult.recoveredAttempts !== 2) {
            throw new Error(
                `Expected 2 recovered attempts, got ${recoveryRateResult.recoveredAttempts}`
            );
        }

        if (recoveryRateResult.failedAttempts !== 1) {
            throw new Error(
                `Expected 1 failed attempt, got ${recoveryRateResult.failedAttempts}`
            );
        }

        if (recoveryRateResult.recoveryRate !== 2 / 3) {
            throw new Error(
                `Expected recovery rate ${2 / 3}, got ${recoveryRateResult.recoveryRate}`
            );
        }

        console.log("✅ Recovery Rate test passed.");


        // ==================================================
        // TEST 2 — HISTORICAL RECOVERY PROBABILITY
        // ==================================================

        console.log(
            "\n===== TEST 2: HISTORICAL RECOVERY PROBABILITY ====="
        );

        const probabilityResult =
            await getHistoricalRecoveryProbability(
                "RETRY_NOW",
                "NETWORK_ERROR",
                testEventIds
            );

        console.log(probabilityResult);

        if (probabilityResult.recoveredAttempts !== 2) {
            throw new Error(
                `Expected 2 recovered attempts, got ${probabilityResult.recoveredAttempts}`
            );
        }

        if (probabilityResult.failedAttempts !== 1) {
            throw new Error(
                `Expected 1 failed attempt, got ${probabilityResult.failedAttempts}`
            );
        }

        if (probabilityResult.completedAttempts !== 3) {
            throw new Error(
                `Expected 3 completed attempts, got ${probabilityResult.completedAttempts}`
            );
        }

        if (probabilityResult.recoveryProbability !== 2 / 3) {
            throw new Error(
                `Expected recovery probability ${2 / 3}, got ${probabilityResult.recoveryProbability}`
            );
        }

        console.log(
            "✅ Historical recovery probability test passed."
        );


        // ==================================================
        // TEST 3 — EXPECTED RECOVERY VALUE
        // ==================================================

        console.log(
            "\n===== TEST 3: EXPECTED RECOVERY VALUE ====="
        );

        const expectedValueResult =
            await getExpectedRecoveryValue(
                9000,
                "RETRY_NOW",
                "NETWORK_ERROR",
                testEventIds
            );

        console.log(expectedValueResult);

        if (expectedValueResult.recoveryProbability !== 2 / 3) {
            throw new Error(
                `Expected recovery probability ${2 / 3}, got ${expectedValueResult.recoveryProbability}`
            );
        }

        if (expectedValueResult.expectedRecoveryValue !== 6000) {
            throw new Error(
                `Expected expected recovery value 6000, got ${expectedValueResult.expectedRecoveryValue}`
            );
        }

        console.log(
            "✅ Expected Recovery Value test passed."
        );


        // ==================================================
        // FINAL RESULT
        // ==================================================

        console.log("\n==================================================");
        console.log(">>> ALL RECOVERY ANALYTICS TESTS PASSED <<<");
        console.log("==================================================");


    } catch (error) {

        console.error("\n==================================================");
        console.error(">>> RECOVERY ANALYTICS TEST FAILED <<<");
        console.error("==================================================");

        console.error(error.message);

    } finally {

        console.log("\n[CLEANUP] Removing test data...");

        await RecoveryAttempt.deleteMany({
            _id: {
                $in: testAttemptIds
            }
        });

        await RecoveryAnalysis.deleteMany({
            _id: {
                $in: testAnalysisIds
            }
        });

        await Event.deleteMany({
            _id: {
                $in: testEventIds
            }
        });

        console.log("[CLEANUP] Test RecoveryAttempt documents removed.");
        console.log("[CLEANUP] Test RecoveryAnalysis documents removed.");
        console.log("[CLEANUP] Test Event documents removed.");
        console.log("[CLEANUP] Completed.");

        await mongoose.connection.close();

        console.log("[DB] MongoDB connection closed.");
    }
};

runTests();