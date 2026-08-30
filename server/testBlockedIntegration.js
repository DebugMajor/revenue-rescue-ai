import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";
import processEvent from "./services/processEvent.js";

dotenv.config();

// Track test event IDs created during the test
const trackedEventIds = [];

/**
 * Task 4: Integration-test cleanup mechanism
 * Order of deletion:
 * 1. RecoveryAttempt documents
 * 2. RecoveryAnalysis documents
 * 3. Event documents
 * Strictly filters by test event IDs starting with "TEST_"
 */
const cleanupTestData = async (eventIds) => {
    if (!eventIds || eventIds.length === 0) return;

    // Safety guard: only delete IDs with TEST_ prefix
    const safeEventIds = eventIds.filter(
        id => typeof id === "string" && id.startsWith("TEST_")
    );

    if (safeEventIds.length === 0) return;

    console.log(`\n[CLEANUP] Starting cleanup for ${safeEventIds.length} test event(s)...`);

    // Fetch Event ObjectIds
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

const runBlockedIntegrationTest = async () => {
    await connectDB();

    const timestamp = Date.now();
    const blockedEventId = `TEST_BLOCKED_MAX_ATTEMPTS_${timestamp}`;
    const blockedObjectId = new mongoose.Types.ObjectId();

    trackedEventIds.push(blockedEventId);

    try {
        console.log("==================================================");
        console.log("RUNNING TASK 3: INTEGRATED BLOCKED PIPELINE TEST");
        console.log("==================================================");

        // Pre-populate 3 prior RecoveryAttempts for this specific event _id
        // This simulates an event that has already been attempted 3 times
        console.log(`[SETUP] Pre-populating 3 prior recovery attempts for event _id: ${blockedObjectId}...`);
        for (let i = 1; i <= 3; i++) {
            const dummyAnalysisId = new mongoose.Types.ObjectId();
            const priorAttempt = new RecoveryAttempt({
                event: blockedObjectId,
                analysis: dummyAnalysisId,
                recoveryAttemptNumber: i,
                action: "RETRY_NOW",
                outcome: "FAILED",
                outcomeDetails: `Simulated prior failure attempt #${i}`
            });
            await priorAttempt.save();
        }

        const eventData = {
            _id: blockedObjectId,
            eventId: blockedEventId,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_${timestamp}`,
            paymentAmount: 2500,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 4,
            timestamp: new Date()
        };

        console.log(`[EXECUTE] Processing event ${blockedEventId} through processEvent pipeline...`);
        const result = await processEvent(eventData);

        // Verifications
        console.log("\n--- VERIFYING BLOCKED ASSERTIONS ---");

        // 1. Verify Event is created
        const savedEvent = await Event.findOne({ eventId: blockedEventId });
        const isEventCreated = savedEvent !== null;
        console.log(`✓ Event is created in DB: ${isEventCreated} (ID: ${savedEvent?.eventId})`);
        if (!isEventCreated) throw new Error("Assertion failed: Event was not created.");

        // 2. Verify RecoveryAnalysis exists
        const savedAnalysis = await RecoveryAnalysis.findOne({ event: blockedObjectId });
        const isAnalysisCreated = savedAnalysis !== null;
        console.log(`✓ RecoveryAnalysis exists in DB: ${isAnalysisCreated} (Analysis #: ${savedAnalysis?.analysisNumber}, Rec: ${savedAnalysis?.recommendation})`);
        if (!isAnalysisCreated) throw new Error("Assertion failed: RecoveryAnalysis does not exist.");

        // 3. Verify Policy decision is BLOCKED
        const isPolicyBlocked = result.policy?.decision === "BLOCKED";
        console.log(`✓ Policy decision is BLOCKED: ${isPolicyBlocked} (Reason: "${result.policy?.reason}")`);
        if (!isPolicyBlocked) throw new Error(`Assertion failed: Expected policy decision 'BLOCKED', got '${result.policy?.decision}'.`);

        // 4. Verify No new RecoveryAttempt was created by the pipeline
        const totalAttempts = await RecoveryAttempt.countDocuments({ event: blockedObjectId });
        const isNoNewAttempt = totalAttempts === 3 && result.recoveryAttempt === undefined;
        console.log(`✓ No new RecoveryAttempt created: ${isNoNewAttempt} (Total attempts remains: ${totalAttempts}, result.recoveryAttempt is undefined)`);
        if (!isNoNewAttempt) throw new Error("Assertion failed: Unexpected RecoveryAttempt was created for a BLOCKED decision.");

        console.log("\n>>> ALL BLOCKED PIPELINE ASSERTIONS PASSED SUCCESSFULLY! <<<\n");

    } finally {
        // Run cleanup even if test fails
        await cleanupTestData(trackedEventIds);
        await mongoose.connection.close();
        console.log("[DB] MongoDB connection closed.");
    }
};

runBlockedIntegrationTest().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
