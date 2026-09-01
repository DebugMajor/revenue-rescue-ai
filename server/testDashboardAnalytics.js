import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";
import getDashboardMetrics from "./services/dashboardAnalyticsService.js";

dotenv.config();

const trackedEventIds = [];
const trackedEventObjectIds = [];

const cleanupTestData = async () => {
    if (trackedEventObjectIds.length === 0 && trackedEventIds.length === 0) return;

    console.log(`\n[CLEANUP] Cleaning up test data...`);

    if (trackedEventObjectIds.length > 0) {
        // 1. Delete RecoveryAttempt documents first
        const attemptDelete = await RecoveryAttempt.deleteMany({
            event: { $in: trackedEventObjectIds }
        });
        console.log(`[CLEANUP] 1. Deleted ${attemptDelete.deletedCount} RecoveryAttempt document(s).`);

        // 2. Delete RecoveryAnalysis documents second
        const analysisDelete = await RecoveryAnalysis.deleteMany({
            event: { $in: trackedEventObjectIds }
        });
        console.log(`[CLEANUP] 2. Deleted ${analysisDelete.deletedCount} RecoveryAnalysis document(s).`);
    }

    if (trackedEventIds.length > 0 || trackedEventObjectIds.length > 0) {
        // 3. Delete Event documents last
        const eventDelete = await Event.deleteMany({
            $or: [
                { eventId: { $in: trackedEventIds } },
                { _id: { $in: trackedEventObjectIds } }
            ]
        });
        console.log(`[CLEANUP] 3. Deleted ${eventDelete.deletedCount} Event document(s).`);
    }

    console.log("[CLEANUP] Completed cleanly.\n");
};

const runDashboardAnalyticsTest = async () => {
    await connectDB();
    const timestamp = Date.now();

    try {
        console.log("================================================================================");
        console.log("RUNNING DASHBOARD EXPECTED RECOVERY VALUE (EV) INTEGRATION TEST");
        console.log("================================================================================\n");

        // -----------------------------------------------------------------------------------------
        // STEP 1: Establish known historical recovery rates
        // -----------------------------------------------------------------------------------------
        // A) RETRY_NOW + NETWORK_ERROR: 2 RECOVERED, 1 FAILED -> Probability = 2/3
        const retryOutcomes = ["RECOVERED", "RECOVERED", "FAILED"];
        for (let i = 0; i < retryOutcomes.length; i++) {
            const eventId = `TEST_HIST_RETRY_${timestamp}_${i + 1}`;
            trackedEventIds.push(eventId);

            const ev = new Event({
                eventId,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_HIST_${timestamp}`,
                paymentAmount: 1000,
                status: retryOutcomes[i] === "RECOVERED" ? "RECOVERED" : "RESOLVED_UNRECOVERED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            });
            const savedEv = await ev.save();
            trackedEventObjectIds.push(savedEv._id);

            const analysis = new RecoveryAnalysis({
                event: savedEv._id,
                analysisNumber: 1,
                analysisSummary: "Historical test network failure.",
                recommendation: "RETRY_NOW",
                confidence: 0.8,
                reasoning: "Historical retry reasoning.",
                source: "DETERMINISTIC_FALLBACK"
            });
            const savedAnalysis = await analysis.save();

            const attempt = new RecoveryAttempt({
                event: savedEv._id,
                analysis: savedAnalysis._id,
                recoveryAttemptNumber: 1,
                action: "RETRY_NOW",
                outcome: retryOutcomes[i],
                outcomeDetails: `Historical outcome ${retryOutcomes[i]}`
            });
            await attempt.save();
        }

        // B) SEND_PAYMENT_LINK + INSUFFICIENT_FUNDS: 1 RECOVERED, 1 FAILED -> Probability = 1/2 (0.5)
        const linkOutcomes = ["RECOVERED", "FAILED"];
        for (let i = 0; i < linkOutcomes.length; i++) {
            const eventId = `TEST_HIST_LINK_${timestamp}_${i + 1}`;
            trackedEventIds.push(eventId);

            const ev = new Event({
                eventId,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_HIST_${timestamp}`,
                paymentAmount: 1000,
                status: linkOutcomes[i] === "RECOVERED" ? "RECOVERED" : "RESOLVED_UNRECOVERED",
                errorCode: "INSUFFICIENT_FUNDS",
                attemptNumber: 1,
                timestamp: new Date()
            });
            const savedEv = await ev.save();
            trackedEventObjectIds.push(savedEv._id);

            const analysis = new RecoveryAnalysis({
                event: savedEv._id,
                analysisNumber: 1,
                analysisSummary: "Historical test insufficient funds.",
                recommendation: "SEND_PAYMENT_LINK",
                confidence: 0.75,
                reasoning: "Historical link reasoning.",
                source: "DETERMINISTIC_FALLBACK"
            });
            const savedAnalysis = await analysis.save();

            const attempt = new RecoveryAttempt({
                event: savedEv._id,
                analysis: savedAnalysis._id,
                recoveryAttemptNumber: 1,
                action: "SEND_PAYMENT_LINK",
                outcome: linkOutcomes[i],
                outcomeDetails: `Historical outcome ${linkOutcomes[i]}`
            });
            await attempt.save();
        }

        console.log("[SETUP] Seeded historical outcomes:");
        console.log("  - RETRY_NOW + NETWORK_ERROR: 2 RECOVERED, 1 FAILED (Prob = 2/3)");
        console.log("  - SEND_PAYMENT_LINK + INSUFFICIENT_FUNDS: 1 RECOVERED, 1 FAILED (Prob = 0.5)");

        // -----------------------------------------------------------------------------------------
        // STEP 2: Create currently active failed events
        // -----------------------------------------------------------------------------------------
        // 1) Eligible Failed Event 1: paymentAmount = 9000, NETWORK_ERROR, RETRY_NOW -> EV = 9000 * (2/3) = 6000
        const id1 = `TEST_FAILED_EV1_${timestamp}`;
        trackedEventIds.push(id1);
        const ev1 = await new Event({
            eventId: id1,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_FAIL_${timestamp}`,
            paymentAmount: 9000,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        }).save();
        trackedEventObjectIds.push(ev1._id);
        await new RecoveryAnalysis({
            event: ev1._id,
            analysisNumber: 1,
            analysisSummary: "Eligible network failure.",
            recommendation: "RETRY_NOW",
            confidence: 0.85,
            reasoning: "Eligible for retry.",
            source: "DETERMINISTIC_FALLBACK"
        }).save();

        // 2) Eligible Failed Event 2: paymentAmount = 4000, INSUFFICIENT_FUNDS, SEND_PAYMENT_LINK -> EV = 4000 * 0.5 = 2000
        const id2 = `TEST_FAILED_EV2_${timestamp}`;
        trackedEventIds.push(id2);
        const ev2 = await new Event({
            eventId: id2,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_FAIL_${timestamp}`,
            paymentAmount: 4000,
            status: "FAILED",
            errorCode: "INSUFFICIENT_FUNDS",
            attemptNumber: 1,
            timestamp: new Date()
        }).save();
        trackedEventObjectIds.push(ev2._id);
        await new RecoveryAnalysis({
            event: ev2._id,
            analysisNumber: 1,
            analysisSummary: "Eligible insufficient funds.",
            recommendation: "SEND_PAYMENT_LINK",
            confidence: 0.80,
            reasoning: "Eligible for payment link.",
            source: "DETERMINISTIC_FALLBACK"
        }).save();

        // 3) Ineligible Failed Event 3 (HUMAN_REVIEW): paymentAmount = 5000 -> Excluded (EV = 0)
        const id3 = `TEST_FAILED_EV3_HUMAN_${timestamp}`;
        trackedEventIds.push(id3);
        const ev3 = await new Event({
            eventId: id3,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_FAIL_${timestamp}`,
            paymentAmount: 5000,
            status: "FAILED",
            errorCode: "UNKNOWN_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        }).save();
        trackedEventObjectIds.push(ev3._id);
        await new RecoveryAnalysis({
            event: ev3._id,
            analysisNumber: 1,
            analysisSummary: "Human review required.",
            recommendation: "HUMAN_REVIEW",
            confidence: 0.40,
            reasoning: "Ineligible action for automation.",
            source: "DETERMINISTIC_FALLBACK"
        }).save();

        // 4) Ineligible Failed Event 4 (DO_NOT_RETRY): paymentAmount = 8000 -> Excluded (EV = 0)
        const id4 = `TEST_FAILED_EV4_DONOTRETRY_${timestamp}`;
        trackedEventIds.push(id4);
        const ev4 = await new Event({
            eventId: id4,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_FAIL_${timestamp}`,
            paymentAmount: 8000,
            status: "FAILED",
            errorCode: "CARD_DECLINED",
            attemptNumber: 1,
            timestamp: new Date()
        }).save();
        trackedEventObjectIds.push(ev4._id);
        await new RecoveryAnalysis({
            event: ev4._id,
            analysisNumber: 1,
            analysisSummary: "Do not retry.",
            recommendation: "DO_NOT_RETRY",
            confidence: 0.90,
            reasoning: "Ineligible action.",
            source: "DETERMINISTIC_FALLBACK"
        }).save();

        // 5) Ineligible Failed Event 5 (No Analysis): paymentAmount = 7000 -> Excluded (EV = 0)
        const id5 = `TEST_FAILED_EV5_NOANALYSIS_${timestamp}`;
        trackedEventIds.push(id5);
        const ev5 = await new Event({
            eventId: id5,
            eventType: "PAYMENT_FAILURE",
            customerId: `TEST_CUST_FAIL_${timestamp}`,
            paymentAmount: 7000,
            status: "FAILED",
            errorCode: "TIMEOUT",
            attemptNumber: 1,
            timestamp: new Date()
        }).save();
        trackedEventObjectIds.push(ev5._id);

        console.log("[SETUP] Created 5 active failed events (2 eligible: ₹9,000 and ₹4,000; 3 excluded).");

        // -----------------------------------------------------------------------------------------
        // STEP 3: Execute getDashboardMetrics(trackedEventObjectIds)
        // -----------------------------------------------------------------------------------------
        console.log("\n--- EXECUTING getDashboardMetrics(trackedEventObjectIds) ---");
        const metrics = await getDashboardMetrics(trackedEventObjectIds);
        console.log("Scoped Dashboard Metrics Output:", JSON.stringify(metrics, null, 2));

        // -----------------------------------------------------------------------------------------
        // STEP 4: Mathematical Assertions
        // -----------------------------------------------------------------------------------------
        console.log("\n--- VERIFYING ASSERTIONS ---");

        // Expected EV calculation: 9000 * (2/3) + 4000 * 0.5 = 6000 + 2000 = 8000
        const expectedEV = 6000 + 2000;
        console.log(`1. expectedRecoveryValue is present: ${metrics.expectedRecoveryValue !== undefined}`);
        if (metrics.expectedRecoveryValue === undefined) {
            throw new Error("expectedRecoveryValue is undefined in getDashboardMetrics response");
        }

        console.log(`2. expectedRecoveryValue === ${expectedEV}: ${Math.abs(metrics.expectedRecoveryValue - expectedEV) < 1e-9}`);
        if (Math.abs(metrics.expectedRecoveryValue - expectedEV) >= 1e-9) {
            throw new Error(`Expected EV ${expectedEV}, got ${metrics.expectedRecoveryValue}`);
        }

        console.log(`3. failedPayments count is tracked: ${metrics.failedPayments} (Expected: 5)`);
        if (metrics.failedPayments !== 5) {
            throw new Error(`Expected 5 failed payments in fixture, got ${metrics.failedPayments}`);
        }

        console.log(`4. recoveredPayments count is tracked: ${metrics.recoveredPayments} (Expected: 3)`);
        if (metrics.recoveredPayments !== 3) {
            throw new Error(`Expected 3 recovered payments in fixture, got ${metrics.recoveredPayments}`);
        }

        const expectedRate = 3 / (3 + 2); // 3 RECOVERED, 2 FAILED in historical = 0.6
        console.log(`5. recoveryRate is tracked: ${metrics.recoveryRate} (Expected: ${expectedRate})`);
        if (Math.abs(metrics.recoveryRate - expectedRate) >= 1e-9) {
            throw new Error(`Expected recoveryRate ${expectedRate}, got ${metrics.recoveryRate}`);
        }

        // Test Global Call
        console.log("\n--- EXECUTING Global getDashboardMetrics() (Unscoped) ---");
        const globalMetrics = await getDashboardMetrics();
        console.log("Global Dashboard Metrics Output:", JSON.stringify(globalMetrics, null, 2));
        if (typeof globalMetrics.expectedRecoveryValue !== "number") {
            throw new Error("Global metrics expectedRecoveryValue should be a number");
        }

        console.log("\n================================================================================");
        console.log(">>> DASHBOARD EXPECTED RECOVERY VALUE TEST PASSED SUCCESSFULLY! <<<");
        console.log("================================================================================");

    } finally {
        await cleanupTestData();
        await mongoose.connection.close();
        console.log("[DB] MongoDB connection closed.");
    }
};

runDashboardAnalyticsTest().catch(err => {
    console.error("Dashboard Analytics Test failed with error:", err);
    process.exit(1);
});
