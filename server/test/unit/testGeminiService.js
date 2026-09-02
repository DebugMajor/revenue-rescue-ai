import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import getCustomerHistory from "./services/contextService.js";
import { calculateRiskScore } from "./services/riskScore.js";
import {
    getRecoveryRecommendation,
    validateGeminiResult,
    isRetryableGeminiError
} from "./services/ai/geminiService.js";

dotenv.config();

const test = async () => {
    await connectDB();

    // =========================
    // TEST 1 — VALID GEMINI RESPONSE
    // =========================

    const event = await Event.findOne({
        status: "FAILED",
        errorCode: "NETWORK_ERROR"
    });

    if (!event) {
        throw new Error("No suitable FAILED event found for testing.");
    }

    const context = await getCustomerHistory(
        event.customerId,
        event._id
    );

    const risk = calculateRiskScore(
        context.successfulPayments,
        context.totalPayments,
        context.recoveryAttempts + 1,
        event.errorCode
    );

    const recommendation = await getRecoveryRecommendation(
        event,
        context,
        risk
    );

    console.log("\n===== TEST 1: VALID GEMINI RESPONSE =====");
    console.log(recommendation);

    // =========================
    // TEST 2 — INVALID RECOMMENDATION
    // =========================

    console.log("\n===== TEST 2: INVALID RECOMMENDATION =====");

    try {
        validateGeminiResult({
            recommendation: "RETRY_FOREVER",
            confidence: 0.9,
            reasoning: "Test reasoning."
        });

        console.log("❌ Test 2 failed.");
    } catch (error) {
        console.log("✅ Test 2 passed:", error.message);
    }

    // =========================
    // TEST 3 — INVALID CONFIDENCE
    // =========================

    console.log("\n===== TEST 3: INVALID CONFIDENCE =====");

    try {
        validateGeminiResult({
            recommendation: "RETRY_NOW",
            confidence: 1.5,
            reasoning: "Test reasoning."
        });

        console.log("❌ Test 3 failed.");
    } catch (error) {
        console.log("✅ Test 3 passed:", error.message);
    }

    // =========================
    // TEST 4 — EMPTY REASONING
    // =========================

    console.log("\n===== TEST 4: EMPTY REASONING =====");

    try {
        validateGeminiResult({
            recommendation: "RETRY_NOW",
            confidence: 0.9,
            reasoning: "   "
        });

        console.log("❌ Test 4 failed.");
    } catch (error) {
        console.log("✅ Test 4 passed:", error.message);
    }

    console.log("\n===== TEST 5: VALID EDGE CONFIDENCE VALUES =====");

    try {
        validateGeminiResult({
            recommendation: "RETRY_NOW",
            confidence: 0,
            reasoning: "Low confidence test.",
            analysisSummary: "Payment failed due to a network error."
        });

        validateGeminiResult({
            recommendation: "RETRY_NOW",
            confidence: 1,
            reasoning: "High confidence test.",
            analysisSummary: "Payment failed due to a network error."
        });

        console.log("✅ Test 5 passed.");
    } catch (error) {
        console.log("❌ Test 5 failed:", error.message);
    }

    // =========================
    // TEST 6 — RETRYABLE ERRORS
    // =========================

    console.log("\n===== TEST 6: RETRYABLE GEMINI ERRORS =====");

    const error503 = new Error("Service unavailable");
    error503.status = 503;

    const error429 = new Error("Rate limited");
    error429.status = 429;

    const timeoutError = new DOMException(
        "The operation was aborted",
        "AbortError"
    );

    console.log(
        isRetryableGeminiError(error503)
            ? "✅ 503 is retryable"
            : "❌ 503 should be retryable"
    );

    console.log(
        isRetryableGeminiError(error429)
            ? "✅ 429 is retryable"
            : "❌ 429 should be retryable"
    );

    console.log(
        isRetryableGeminiError(timeoutError)
            ? "✅ Timeout is retryable"
            : "❌ Timeout should be retryable"
    );

    // =========================
    // TEST 7 — NON-RETRYABLE ERROR
    // =========================

    console.log("\n===== TEST 7: NON-RETRYABLE ERROR =====");

    const authError = new Error("Invalid API key");
    authError.status = 401;

    console.log(
        !isRetryableGeminiError(authError)
            ? "✅ 401 is not retryable"
            : "❌ 401 should not be retryable"
    );
};

test().catch((error) => {
    console.error("Test suite failed:", error.message);
});