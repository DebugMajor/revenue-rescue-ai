import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";
import processEvent from "./services/processEvent.js";
import getCustomerHistory from "./services/contextService.js";
import { calculateRiskScore } from "./services/riskScore.js";
import analyzeEvent from "./services/analysisService.js";
import evaluatePolicy from "./services/policyService.js";
import executeRecovery from "./services/recoveryService.js";

dotenv.config();

const trackedEventIds = [];

const cleanupTestData = async (eventIds) => {
    if (!eventIds || eventIds.length === 0) return;

    const safeEventIds = eventIds.filter(
        id => typeof id === "string" && id.startsWith("TEST_")
    );

    if (safeEventIds.length === 0) return;

    console.log(`\n[CLEANUP] Starting cleanup for ${safeEventIds.length} test event(s)...`);

    const events = await Event.find({ eventId: { $in: safeEventIds } });
    const eventObjectIds = events.map(e => e._id);

    if (eventObjectIds.length > 0) {
        // 1. Delete RecoveryAttempt documents first
        const attemptDelete = await RecoveryAttempt.deleteMany({
            event: { $in: eventObjectIds }
        });
        console.log(`[CLEANUP] 1. Deleted ${attemptDelete.deletedCount} RecoveryAttempt document(s).`);

        // 2. Delete RecoveryAnalysis documents second
        const analysisDelete = await RecoveryAnalysis.deleteMany({
            event: { $in: eventObjectIds }
        });
        console.log(`[CLEANUP] 2. Deleted ${analysisDelete.deletedCount} RecoveryAnalysis document(s).`);
    }

    // 3. Delete Event documents last
    const eventDelete = await Event.deleteMany({
        eventId: { $in: safeEventIds }
    });
    console.log(`[CLEANUP] 3. Deleted ${eventDelete.deletedCount} Event document(s).`);
    console.log("[CLEANUP] Completed cleanly.\n");
};

/**
 * Test helper that runs the pipeline stages with an injected/mocked analysis result
 * to deterministically test downstream Policy Gate and Recovery Execution logic.
 */
const processEventWithMockedAnalysis = async (eventData, mockAnalysisResult) => {
    const newEvent = new Event(eventData);
    await newEvent.save();

    const context = await getCustomerHistory(
        newEvent.customerId,
        newEvent._id
    );

    if (newEvent.status !== "FAILED") {
        return { event: newEvent, context };
    }

    const risk = calculateRiskScore(
        context.successfulPayments,
        context.totalPayments,
        context.recoveryAttempts + 1,
        newEvent.errorCode
    );

    const analysis = await analyzeEvent(newEvent, mockAnalysisResult);

    const policy = evaluatePolicy(
        risk.riskScore,
        risk.riskBand,
        analysis.recommendation,
        analysis.confidence,
        context.recoveryAttempts + 1,
        newEvent.paymentAmount
    );

    let recoveryAttempt;

    if (policy.decision === "APPROVED") {
        recoveryAttempt = await executeRecovery(
            newEvent,
            analysis
        );
    }

    const finalEvent = await Event.findById(newEvent._id);

    return {
        event: finalEvent,
        context,
        risk,
        analysis,
        policy,
        recoveryAttempt
    };
};

const runAllTests = async () => {
    await connectDB();
    const timestamp = Date.now();

    try {
        console.log("==================================================");
        console.log("RUNNING COMPREHENSIVE PIPELINE INTEGRATION TESTS");
        console.log("==================================================");

        // ============================================================
        // TEST 1: REAL GEMINI INTEGRATION (Happy Path)
        // ============================================================
        const id1 = `TEST_REAL_GEMINI_${timestamp}`;
        trackedEventIds.push(id1);
        console.log(`\n--- Test 1: Real Gemini Happy Path Integration [${id1}] ---`);
        const res1 = await processEvent({
            eventId: id1,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_GEMINI_${timestamp}`,
            paymentAmount: 1500,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        });

        console.log(`Gemini Recommendation: ${res1.analysis.recommendation} (Confidence: ${res1.analysis.confidence})`);
        console.log(`Policy Decision: ${res1.policy.decision}`);
        console.log(`Recovery Attempt Action: ${res1.recoveryAttempt?.action || "None"}`);
        console.log(`Recovery Attempt Outcome: ${res1.recoveryAttempt?.outcome || "None"}`);
        console.log(`Final Event Status: ${res1.event?.status}`);

        if (!res1.event || !res1.analysis || !res1.policy) {
            throw new Error("Test 1 failed: Missing core pipeline outputs from real Gemini flow.");
        }
        console.log("✓ Test 1 Passed (Real Gemini Pipeline Integrated successfully)!");

        // ============================================================
        // TEST 2: DETERMINISTIC RETRY_NOW -> APPROVED -> RECOVERED
        // ============================================================
        const id2 = `TEST_RETRY_NOW_${timestamp}`;
        trackedEventIds.push(id2);
        console.log(`\n--- Test 2: Deterministic RETRY_NOW [${id2}] ---`);
        const res2 = await processEventWithMockedAnalysis({
            eventId: id2,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_2_${timestamp}`,
            paymentAmount: 2000,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        }, {
            recommendation: "RETRY_NOW",
            confidence: 0.85,
            analysisSummary: "Temporary network glitch detected.",
            reasoning: "First attempt network failure with high recovery likelihood."
        });

        console.log(`Policy Decision: ${res2.policy.decision}`);
        console.log(`Recovery Outcome: ${res2.recoveryAttempt?.outcome}`);
        console.log(`Final Event Status: ${res2.event?.status}`);
        if (res2.policy.decision !== "APPROVED" || res2.recoveryAttempt?.outcome !== "RECOVERED" || res2.event?.status !== "RECOVERED") {
            throw new Error("Test 2 failed: Expected APPROVED and RECOVERED outcome/status.");
        }
        console.log("✓ Test 2 Passed!");

        // ============================================================
        // TEST 3: DETERMINISTIC SEND_PAYMENT_LINK -> APPROVED -> PENDING
        // ============================================================
        const id3 = `TEST_PAYMENT_LINK_${timestamp}`;
        trackedEventIds.push(id3);
        console.log(`\n--- Test 3: Deterministic SEND_PAYMENT_LINK [${id3}] ---`);
        const res3 = await processEventWithMockedAnalysis({
            eventId: id3,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_3_${timestamp}`,
            paymentAmount: 3000,
            status: "FAILED",
            errorCode: "INSUFFICIENT_FUNDS",
            attemptNumber: 1,
            timestamp: new Date()
        }, {
            recommendation: "SEND_PAYMENT_LINK",
            confidence: 0.80,
            analysisSummary: "Insufficient funds failure.",
            reasoning: "Payment link sent to allow alternate payment method."
        });

        console.log(`Policy Decision: ${res3.policy.decision}`);
        console.log(`Recovery Outcome: ${res3.recoveryAttempt?.outcome}`);
        console.log(`Final Event Status: ${res3.event?.status}`);
        if (res3.policy.decision !== "APPROVED" || res3.recoveryAttempt?.outcome !== "PENDING" || res3.event?.status !== "PENDING") {
            throw new Error("Test 3 failed: Expected APPROVED and PENDING outcome/status.");
        }
        console.log("✓ Test 3 Passed!");

        // ============================================================
        // TEST 4: DETERMINISTIC WAIT_AND_RETRY -> APPROVED -> PENDING
        // ============================================================
        const id4 = `TEST_WAIT_RETRY_${timestamp}`;
        trackedEventIds.push(id4);
        console.log(`\n--- Test 4: Deterministic WAIT_AND_RETRY [${id4}] ---`);
        const res4 = await processEventWithMockedAnalysis({
            eventId: id4,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_4_${timestamp}`,
            paymentAmount: 2500,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        }, {
            recommendation: "WAIT_AND_RETRY",
            confidence: 0.80,
            analysisSummary: "Deferred retry recommended.",
            reasoning: "Scheduling deferred payment retry for network recovery."
        });

        console.log(`Policy Decision: ${res4.policy.decision}`);
        console.log(`Recovery Outcome: ${res4.recoveryAttempt?.outcome}`);
        console.log(`Final Event Status: ${res4.event?.status}`);
        if (res4.policy.decision !== "APPROVED" || res4.recoveryAttempt?.outcome !== "PENDING" || res4.event?.status !== "PENDING") {
            throw new Error("Test 4 failed: Expected APPROVED and PENDING outcome/status.");
        }
        console.log("✓ Test 4 Passed!");

        // ============================================================
        // TEST 5: DETERMINISTIC HUMAN_REVIEW -> ESCALATED -> no RecoveryAttempt
        // ============================================================
        const id5 = `TEST_HUMAN_REVIEW_${timestamp}`;
        trackedEventIds.push(id5);
        console.log(`\n--- Test 5: Deterministic HUMAN_REVIEW [${id5}] ---`);
        const res5 = await processEventWithMockedAnalysis({
            eventId: id5,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_5_${timestamp}`,
            paymentAmount: 5000,
            status: "FAILED",
            errorCode: "UNKNOWN_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        }, {
            recommendation: "HUMAN_REVIEW",
            confidence: 0.40,
            analysisSummary: "Unknown error requires human operator review.",
            reasoning: "Error code is unrecognized by automated heuristics."
        });

        console.log(`Policy Decision: ${res5.policy.decision}`);
        console.log(`Recovery Attempt: ${res5.recoveryAttempt}`);
        if (res5.policy.decision !== "ESCALATED" || res5.recoveryAttempt !== undefined) {
            throw new Error("Test 5 failed: Expected ESCALATED and undefined recoveryAttempt.");
        }
        console.log("✓ Test 5 Passed!");

        // ============================================================
        // TEST 6: DETERMINISTIC BLOCKED (Max Attempts Exceeded) -> no RecoveryAttempt
        // ============================================================
        const id6 = `TEST_BLOCKED_${timestamp}`;
        const objId6 = new mongoose.Types.ObjectId();
        trackedEventIds.push(id6);
        console.log(`\n--- Test 6: Deterministic BLOCKED (Max Attempts Exceeded) [${id6}] ---`);

        // Seed 3 prior attempts to trigger max attempt limit
        for (let i = 1; i <= 3; i++) {
            const priorAttempt = new RecoveryAttempt({
                event: objId6,
                analysis: new mongoose.Types.ObjectId(),
                recoveryAttemptNumber: i,
                action: "RETRY_NOW",
                outcome: "FAILED",
                outcomeDetails: `Prior attempt #${i}`
            });
            await priorAttempt.save();
        }

        const res6 = await processEventWithMockedAnalysis({
            _id: objId6,
            eventId: id6,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_6_${timestamp}`,
            paymentAmount: 2000,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 4,
            timestamp: new Date()
        }, {
            recommendation: "RETRY_NOW",
            confidence: 0.85,
            analysisSummary: "Retry recommended by analysis.",
            reasoning: "Transient failure."
        });

        console.log(`Policy Decision: ${res6.policy.decision} ("${res6.policy.reason}")`);
        console.log(`Recovery Attempt: ${res6.recoveryAttempt}`);
        if (res6.policy.decision !== "BLOCKED" || res6.recoveryAttempt !== undefined) {
            throw new Error("Test 6 failed: Expected BLOCKED and undefined recoveryAttempt.");
        }
        console.log("✓ Test 6 Passed!");

        console.log("\n==================================================");
        console.log(">>> ALL INTEGRATION TEST SUITES PASSED (6/6) <<<");
        console.log("==================================================");

    } finally {
        await cleanupTestData(trackedEventIds);
        await mongoose.connection.close();
        console.log("[DB] MongoDB connection closed.");
    }
};

runAllTests().catch(err => {
    console.error("Test Suite failed with error:", err);
    process.exit(1);
});
