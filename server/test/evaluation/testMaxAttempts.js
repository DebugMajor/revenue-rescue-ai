import "dotenv/config";

import mongoose from "mongoose";
import connectDB from "../../config/db.js";

import User from "../../models/User.js";
import Event from "../../models/Event.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";
import RecoveryAnalysis from "../../models/RecoveryAnalysis.js";

import evaluatePolicy from "../../services/policyService.js";

const main = async () => {
    try {
        await connectDB();

        const userId = process.env.WEBHOOK_USER_ID;

        if (!userId) {
            throw new Error("WEBHOOK_USER_ID is not configured.");
        }

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("Evaluation user not found.");
        }

        const event = await Event.create({
            user: user._id,
            eventId: `TEST_MAX_ATTEMPTS_${Date.now()}`,
            eventType: "PAYMENT_FAILURE",
            customerId: `max_attempt_customer_${Date.now()}`,
            paymentAmount: 5000,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 4,
            timestamp: new Date()
        });

        /*
         * Create a valid Analysis document using the same reference
         * model used by RecoveryAttempt.
         */
        const analysis = await RecoveryAnalysis.create({
            event: event._id,
            analysisNumber: 1,
            recommendation: "RETRY_NOW",
            confidence: 0.9,
            reasoning: "Test analysis for max-attempt policy.",
            analysisSummary: "Testing automatic recovery attempt limit.",
            source: "DETERMINISTIC_FALLBACK"
        });

        /*
         * Seed three previous recovery attempts.
         */
        await RecoveryAttempt.create([
            {
                event: event._id,
                analysis: analysis._id,
                recoveryAttemptNumber: 1,
                action: "RETRY_NOW",
                outcome: "FAILED",
                outcomeDetails: "Seeded attempt 1."
            },
            {
                event: event._id,
                analysis: analysis._id,
                recoveryAttemptNumber: 2,
                action: "RETRY_NOW",
                outcome: "FAILED",
                outcomeDetails: "Seeded attempt 2."
            },
            {
                event: event._id,
                analysis: analysis._id,
                recoveryAttemptNumber: 3,
                action: "RETRY_NOW",
                outcome: "FAILED",
                outcomeDetails: "Seeded attempt 3."
            }
        ]);

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
            5000
        );

        console.log();
        console.log("==============================================");
        console.log("MAX ATTEMPTS POLICY TEST");
        console.log("==============================================");
        console.log();

        console.log("Existing recovery attempts:", existingAttempts);
        console.log("Next recovery attempt:", nextAttemptNumber);

        console.log();
        console.log("Policy result:");
        console.log(policy);

        console.log();

        if (
            policy.decision !== "BLOCKED" ||
            nextAttemptNumber <= 3
        ) {
            throw new Error(
                "MAX ATTEMPTS POLICY TEST FAILED"
            );
        }

        console.log(
            "✅ MAX ATTEMPTS TEST PASSED"
        );

        /*
         * Cleanup only this test event and its related records.
         */
        await RecoveryAttempt.deleteMany({
            event: event._id
        });

        await RecoveryAnalysis.deleteMany({
            event: event._id
        });

        await Event.deleteOne({
            _id: event._id
        });

        console.log(
            "✅ Test data cleaned up."
        );
    } catch (error) {
        console.error();
        console.error(
            "❌ MAX ATTEMPTS TEST FAILED"
        );
        console.error(
            error?.message || error
        );

        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

main();