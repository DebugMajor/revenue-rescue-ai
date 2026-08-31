import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";
import processEvent from "./services/processEvent.js";

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

const runAllTests = async () => {
    await connectDB();
    const timestamp = Date.now();

    try {
        console.log("==================================================");
        console.log("RUNNING COMPREHENSIVE PIPELINE INTEGRATION TESTS");
        console.log("==================================================");

        // TEST 1: APPROVED with RETRY_NOW + NETWORK_ERROR -> RECOVERED
        const id1 = `TEST_APPROVED_RETRY_${timestamp}`;
        trackedEventIds.push(id1);
        console.log(`\n--- Test 1: APPROVED (RETRY_NOW + NETWORK_ERROR) [${id1}] ---`);
        const res1 = await processEvent({
            eventId: id1,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_1_${timestamp}`,
            paymentAmount: 1500,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        });
        console.log(`Policy Decision: ${res1.policy.decision}`);
        console.log(`Recovery Outcome: ${res1.recoveryAttempt?.outcome}`);
        console.log(`Final Event Status: ${res1.event?.status}`);
        if (res1.policy.decision !== "APPROVED" || res1.recoveryAttempt?.outcome !== "RECOVERED" || res1.event?.status !== "RECOVERED") {
            throw new Error("Test 1 failed: Expected APPROVED and RECOVERED outcome/status.");
        }
        console.log("✓ Test 1 Passed!");

        // TEST 2: APPROVED with SEND_PAYMENT_LINK + INSUFFICIENT_FUNDS -> PENDING
        const id2 = `TEST_APPROVED_LINK_${timestamp}`;
        trackedEventIds.push(id2);
        console.log(`\n--- Test 2: APPROVED (SEND_PAYMENT_LINK + INSUFFICIENT_FUNDS) [${id2}] ---`);
        const res2 = await processEvent({
            eventId: id2,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_2_${timestamp}`,
            paymentAmount: 3000,
            status: "FAILED",
            errorCode: "INSUFFICIENT_FUNDS",
            attemptNumber: 1,
            timestamp: new Date()
        });
        console.log("Gemini/Analysis Result:", res2.analysis);
        console.log(`Policy Decision: ${res2.policy.decision}`);
        console.log(`Recovery Outcome: ${res2.recoveryAttempt?.outcome}`);
        console.log(`Final Event Status: ${res2.event?.status}`);
        if (res2.policy.decision !== "APPROVED" || res2.recoveryAttempt?.outcome !== "PENDING" || res2.event?.status !== "PENDING") {
            throw new Error("Test 2 failed: Expected APPROVED and PENDING outcome/status.");
        }
        console.log("✓ Test 2 Passed!");

        // TEST 3: ESCALATED with UNKNOWN_ERROR -> HUMAN_REVIEW
        const id3 = `TEST_ESCALATED_${timestamp}`;
        trackedEventIds.push(id3);
        console.log(`\n--- Test 3: ESCALATED (HUMAN_REVIEW) [${id3}] ---`);
        const res3 = await processEvent({
            eventId: id3,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_3_${timestamp}`,
            paymentAmount: 5000,
            status: "FAILED",
            errorCode: "UNKNOWN_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        });
        console.log(`Policy Decision: ${res3.policy.decision}`);
        console.log(`Recovery Attempt: ${res3.recoveryAttempt}`);
        if (res3.policy.decision !== "ESCALATED" || res3.recoveryAttempt !== undefined) {
            throw new Error("Test 3 failed: Expected ESCALATED and undefined recoveryAttempt.");
        }
        console.log("✓ Test 3 Passed!");

        // TEST 4: BLOCKED with Max Recovery Attempts Exceeded
        const id4 = `TEST_BLOCKED_${timestamp}`;
        const objId4 = new mongoose.Types.ObjectId();
        trackedEventIds.push(id4);
        console.log(`\n--- Test 4: BLOCKED (Max Attempts Exceeded) [${id4}] ---`);

        // Seed 3 attempts
        for (let i = 1; i <= 3; i++) {
            const priorAttempt = new RecoveryAttempt({
                event: objId4,
                analysis: new mongoose.Types.ObjectId(),
                recoveryAttemptNumber: i,
                action: "RETRY_NOW",
                outcome: "FAILED",
                outcomeDetails: `Prior attempt ${i}`
            });
            await priorAttempt.save();
        }

        const res4 = await processEvent({
            _id: objId4,
            eventId: id4,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_4_${timestamp}`,
            paymentAmount: 2000,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 4,
            timestamp: new Date()
        });

        console.log(`Policy Decision: ${res4.policy.decision} ("${res4.policy.reason}")`);
        console.log(`Recovery Attempt: ${res4.recoveryAttempt}`);
        if (res4.policy.decision !== "BLOCKED" || res4.recoveryAttempt !== undefined) {
            throw new Error("Test 4 failed: Expected BLOCKED and undefined recoveryAttempt.");
        }
        console.log("✓ Test 4 Passed!");

        console.log("\n==================================================");
        console.log(">>> ALL INTEGRATION TEST SUITES PASSED (4/4) <<<");
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
