import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";

import processEvent from "./services/processEvent.js";
import { validateGeminiResult } from "./services/ai/geminiService.js";

const cleanup = async (eventId) => {
    try {
        const event = await Event.findOne({ eventId });

        if (!event) {
            console.log("[CLEANUP] No event found.");
            return;
        }

        await RecoveryAttempt.deleteMany({
            event: event._id
        });

        await RecoveryAnalysis.deleteMany({
            event: event._id
        });

        await Event.deleteOne({
            _id: event._id
        });

        console.log("[CLEANUP] Test data removed.");
    } catch (error) {
        console.error("[CLEANUP] Failed:", error.message);
    }
};

const runTest = async () => {
    await connectDB();

    const timestamp = Date.now();

    const eventData = {
        eventId: `TEST_INVALID_AI_FULL_${timestamp}`,
        eventType: "PAYMENT_FAILURE",
        customerId: `TEST_INVALID_AI_CUST_${timestamp}`,
        paymentAmount: 2000,
        status: "FAILED",
        errorCode: "NETWORK_ERROR",
        attemptNumber: 1,
        timestamp: new Date()
    };

    try {
        console.log("==================================================");
        console.log("INVALID AI → REAL processEvent() FALLBACK TEST");
        console.log("==================================================");

        // Fake Gemini provider.
        // It deliberately returns an invalid recommendation,
        // then passes it through the REAL validator.
        const fakeGemini = async () => {
            const invalidGeminiResult = {
                recommendation: "INVALID_ACTION",
                confidence: 0.9,
                reasoning: "Test reasoning",
                analysisSummary: "Test summary"
            };

            console.log("\n[FAKE GEMINI]");
            console.log(invalidGeminiResult);

            // This should throw.
            return validateGeminiResult(invalidGeminiResult);
        };

        console.log("\n[EXECUTE]");
        console.log("Calling REAL processEvent() with fake Gemini provider...");

        const result = await processEvent(
            eventData,
            fakeGemini
        );

        console.log("\n[RESULT]");
        console.log("Analysis:", result.analysis);
        console.log("Policy:", result.policy);
        console.log("Recovery Attempt:", result.recoveryAttempt);
        console.log("Final Event:", result.event);

        // -------------------------------------------------
        // Assertions
        // -------------------------------------------------

        if (!result.analysis) {
            throw new Error("Analysis was not created.");
        }

        if (result.analysis.recommendation !== "RETRY_NOW") {
            throw new Error(
                `Expected deterministic fallback RETRY_NOW, got ${result.analysis.recommendation}`
            );
        }

        if (result.analysis.confidence !== 0.8) {
            throw new Error(
                `Expected fallback confidence 0.8, got ${result.analysis.confidence}`
            );
        }

        if (result.policy.decision !== "APPROVED") {
            throw new Error(
                `Expected policy APPROVED, got ${result.policy.decision}`
            );
        }

        if (!result.recoveryAttempt) {
            throw new Error(
                "Expected RecoveryAttempt to be created."
            );
        }

        if (result.recoveryAttempt.outcome !== "RECOVERED") {
            throw new Error(
                `Expected RECOVERED, got ${result.recoveryAttempt.outcome}`
            );
        }

        if (result.event.status !== "RECOVERED") {
            throw new Error(
                `Expected final Event status RECOVERED, got ${result.event.status}`
            );
        }

        if (result.analysis.source !== "DETERMINISTIC_FALLBACK") {
            throw new Error(
                `Expected source DETERMINISTIC_FALLBACK, got ${result.analysis.source}`
            );
        }
        console.log("\n==================================================");
        console.log(">>> FULL-PIPELINE INVALID AI TEST PASSED <<<");
        console.log("==================================================");

    } catch (error) {
        console.error("\n==================================================");
        console.error(">>> TEST FAILED <<<");
        console.error("==================================================");
        console.error(error.message);

    } finally {
        await cleanup(eventData.eventId);

        await import("mongoose").then(({ default: mongoose }) =>
            mongoose.connection.close()
        );
    }
};

runTest();