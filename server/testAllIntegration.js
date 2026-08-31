import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import RecoveryAnalysis from "./models/RecoveryAnalysis.js";
import RecoveryAttempt from "./models/RecoveryAttempt.js";
import processEvent from "./services/processEvent.js";
import {
    validateGeminiResult,
    isRetryableGeminiError
} from "./services/ai/geminiService.js";
import recoveryAnalyticsService from "./services/recoveryAnalyticsService.js";

dotenv.config();

const {
    getRecoveryRate,
    getHistoricalRecoveryProbability,
    getExpectedRecoveryValue
} = recoveryAnalyticsService;

// Track all test-generated event IDs for guaranteed cleanup
const trackedEventIds = [];
const trackedEventObjectIds = [];

const cleanupTestData = async () => {
    if (trackedEventIds.length === 0 && trackedEventObjectIds.length === 0) return;

    console.log(`\n[CLEANUP] Starting cleanup of test data...`);

    // Fetch any additional ObjectIds from tracked eventIds
    if (trackedEventIds.length > 0) {
        const events = await Event.find({ eventId: { $in: trackedEventIds } });
        for (const ev of events) {
            if (!trackedEventObjectIds.some(id => id.equals(ev._id))) {
                trackedEventObjectIds.push(ev._id);
            }
        }
    }

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

const runRegressionSuite = async () => {
    await connectDB();
    const timestamp = Date.now();

    let totalTests = 0;
    let passedTests = 0;
    const failures = [];
    let geminiSmokeStatus = "NOT_RUN";

    const recordSuccess = (testNum, testName) => {
        totalTests++;
        passedTests++;
        console.log(`✅ TEST ${testNum} PASSED: ${testName}`);
    };

    const recordFailure = (testNum, testName, assertion, error) => {
        totalTests++;
        failures.push({ testNum, testName, assertion, message: error.message });
        console.error(`❌ TEST ${testNum} FAILED: ${testName} | Assertion: ${assertion} | Error: ${error.message}`);
    };

    console.log("================================================================================");
    console.log("REVENUE RESCUE AI — COMPREHENSIVE BACKEND REGRESSION TEST SUITE");
    console.log("================================================================================\n");

    try {
        // ============================================================
        // TEST 1 — REAL GEMINI HAPPY PATH
        // ============================================================
        const test1Name = "REAL GEMINI HAPPY PATH";
        console.log(`--- Running TEST 1: ${test1Name} ---`);
        try {
            const id1 = `TEST_REAL_GEMINI_${timestamp}`;
            trackedEventIds.push(id1);

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

            trackedEventObjectIds.push(res1.event._id);

            const allowedRecs = [
                "RETRY_NOW",
                "WAIT_AND_RETRY",
                "SEND_PAYMENT_LINK",
                "HUMAN_REVIEW",
                "DO_NOT_RETRY"
            ];

            if (!res1.analysis) {
                throw new Error("Expected analysis object to exist");
            }
            if (!allowedRecs.includes(res1.analysis.recommendation)) {
                throw new Error(`Unexpected recommendation: ${res1.analysis.recommendation}`);
            }
            if (typeof res1.analysis.confidence !== "number" || res1.analysis.confidence < 0 || res1.analysis.confidence > 1) {
                throw new Error(`Invalid confidence: ${res1.analysis.confidence}`);
            }
            if (!res1.policy || !["APPROVED", "BLOCKED", "ESCALATED"].includes(res1.policy.decision)) {
                throw new Error(`Invalid policy decision: ${res1.policy?.decision}`);
            }

            if (res1.analysis.source === "GEMINI") {
                geminiSmokeStatus = "SUCCEEDED (Real Gemini recommendation returned)";
            } else {
                geminiSmokeStatus = `FALLBACK_USED (Gemini error caught, fallback used source: ${res1.analysis.source})`;
            }

            console.log(`   Result Analysis: rec=${res1.analysis.recommendation}, conf=${res1.analysis.confidence}, source=${res1.analysis.source}, policy=${res1.policy.decision}`);
            recordSuccess(1, test1Name);
        } catch (err) {
            geminiSmokeStatus = `FAILED: ${err.message}`;
            recordFailure(1, test1Name, "Real Gemini integration verification", err);
        }

        // ============================================================
        // TEST 2 — INVALID GEMINI OUTPUT (Fallback on Validation Throw)
        // ============================================================
        const test2Name = "INVALID GEMINI OUTPUT HANDLING";
        console.log(`\n--- Running TEST 2: ${test2Name} ---`);
        try {
            const id2 = `TEST_INVALID_GEMINI_${timestamp}`;
            trackedEventIds.push(id2);

            // Fake provider that passes invalid structured result through validateGeminiResult
            const fakeInvalidGeminiProvider = async () => {
                const invalidResult = {
                    recommendation: "INVALID_ACTION_NAME",
                    confidence: 0.9,
                    reasoning: "Invalid reasoning",
                    analysisSummary: "Invalid summary"
                };
                return validateGeminiResult(invalidResult);
            };

            const res2 = await processEvent({
                eventId: id2,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_2_${timestamp}`,
                paymentAmount: 2000,
                status: "FAILED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            }, fakeInvalidGeminiProvider);

            trackedEventObjectIds.push(res2.event._id);

            if (res2.analysis.source !== "DETERMINISTIC_FALLBACK") {
                throw new Error(`Expected source 'DETERMINISTIC_FALLBACK', got '${res2.analysis.source}'`);
            }
            if (res2.policy.decision !== "APPROVED") {
                throw new Error(`Expected policy 'APPROVED', got '${res2.policy.decision}'`);
            }
            if (res2.recoveryAttempt?.outcome !== "RECOVERED") {
                throw new Error(`Expected outcome 'RECOVERED', got '${res2.recoveryAttempt?.outcome}'`);
            }

            recordSuccess(2, test2Name);
        } catch (err) {
            recordFailure(2, test2Name, "Validation throw caught and fallback used", err);
        }

        // ============================================================
        // TEST 3 — RETRY_NOW
        // ============================================================
        const test3Name = "RETRY_NOW (APPROVED -> RECOVERED)";
        console.log(`\n--- Running TEST 3: ${test3Name} ---`);
        try {
            const id3 = `TEST_RETRY_NOW_${timestamp}`;
            trackedEventIds.push(id3);

            const res3 = await processEvent({
                eventId: id3,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_3_${timestamp}`,
                paymentAmount: 2500,
                status: "FAILED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            }, async () => ({
                recommendation: "RETRY_NOW",
                confidence: 0.85,
                reasoning: "Transient network issue.",
                analysisSummary: "Network failure.",
                source: "DETERMINISTIC_FALLBACK"
            }));

            trackedEventObjectIds.push(res3.event._id);

            if (res3.policy.decision !== "APPROVED") throw new Error(`Expected policy APPROVED, got ${res3.policy.decision}`);
            if (!res3.recoveryAttempt) throw new Error("Expected RecoveryAttempt to be created");
            if (res3.recoveryAttempt.outcome !== "RECOVERED") throw new Error(`Expected outcome RECOVERED, got ${res3.recoveryAttempt.outcome}`);
            if (res3.event.status !== "RECOVERED") throw new Error(`Expected Event status RECOVERED, got ${res3.event.status}`);

            recordSuccess(3, test3Name);
        } catch (err) {
            recordFailure(3, test3Name, "RETRY_NOW outcome and event status RECOVERED", err);
        }

        // ============================================================
        // TEST 4 — SEND_PAYMENT_LINK
        // ============================================================
        const test4Name = "SEND_PAYMENT_LINK (APPROVED -> PENDING)";
        console.log(`\n--- Running TEST 4: ${test4Name} ---`);
        try {
            const id4 = `TEST_PAYMENT_LINK_${timestamp}`;
            trackedEventIds.push(id4);

            const res4 = await processEvent({
                eventId: id4,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_4_${timestamp}`,
                paymentAmount: 3000,
                status: "FAILED",
                errorCode: "INSUFFICIENT_FUNDS",
                attemptNumber: 1,
                timestamp: new Date()
            }, async () => ({
                recommendation: "SEND_PAYMENT_LINK",
                confidence: 0.75,
                reasoning: "Customer has insufficient funds, send link.",
                analysisSummary: "Insufficient funds.",
                source: "DETERMINISTIC_FALLBACK"
            }));

            trackedEventObjectIds.push(res4.event._id);

            if (res4.policy.decision !== "APPROVED") throw new Error(`Expected policy APPROVED, got ${res4.policy.decision}`);
            if (!res4.recoveryAttempt) throw new Error("Expected RecoveryAttempt to be created");
            if (res4.recoveryAttempt.outcome !== "PENDING") throw new Error(`Expected outcome PENDING, got ${res4.recoveryAttempt.outcome}`);
            if (res4.event.status !== "PENDING") throw new Error(`Expected Event status PENDING, got ${res4.event.status}`);

            recordSuccess(4, test4Name);
        } catch (err) {
            recordFailure(4, test4Name, "SEND_PAYMENT_LINK outcome and event status PENDING", err);
        }

        // ============================================================
        // TEST 5 — WAIT_AND_RETRY
        // ============================================================
        const test5Name = "WAIT_AND_RETRY (APPROVED -> PENDING, deferred retry)";
        console.log(`\n--- Running TEST 5: ${test5Name} ---`);
        try {
            const id5 = `TEST_WAIT_RETRY_${timestamp}`;
            trackedEventIds.push(id5);

            const res5 = await processEvent({
                eventId: id5,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_5_${timestamp}`,
                paymentAmount: 4000,
                status: "FAILED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            }, async () => ({
                recommendation: "WAIT_AND_RETRY",
                confidence: 0.80,
                reasoning: "Temporary failure, retry after wait period.",
                analysisSummary: "Deferred retry.",
                source: "DETERMINISTIC_FALLBACK"
            }));

            trackedEventObjectIds.push(res5.event._id);

            if (res5.policy.decision !== "APPROVED") throw new Error(`Expected policy APPROVED, got ${res5.policy.decision}`);
            if (!res5.recoveryAttempt) throw new Error("Expected RecoveryAttempt to be created");
            if (res5.recoveryAttempt.outcome !== "PENDING") throw new Error(`Expected outcome PENDING, got ${res5.recoveryAttempt.outcome}`);
            if (res5.event.status !== "PENDING") throw new Error(`Expected Event status PENDING, got ${res5.event.status}`);
            if (res5.recoveryAttempt.outcomeDetails !== "Payment retry scheduled; awaiting deferred retry.") {
                throw new Error(`Unexpected outcomeDetails: ${res5.recoveryAttempt.outcomeDetails}`);
            }

            recordSuccess(5, test5Name);
        } catch (err) {
            recordFailure(5, test5Name, "WAIT_AND_RETRY outcome and status PENDING with deferred retry details", err);
        }

        // ============================================================
        // TEST 6 — HUMAN_REVIEW
        // ============================================================
        const test6Name = "HUMAN_REVIEW (ESCALATED -> no RecoveryAttempt)";
        console.log(`\n--- Running TEST 6: ${test6Name} ---`);
        try {
            const id6 = `TEST_HUMAN_REVIEW_${timestamp}`;
            trackedEventIds.push(id6);

            const res6 = await processEvent({
                eventId: id6,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_6_${timestamp}`,
                paymentAmount: 5000,
                status: "FAILED",
                errorCode: "UNKNOWN_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            }, async () => ({
                recommendation: "HUMAN_REVIEW",
                confidence: 0.40,
                reasoning: "Complex unknown error.",
                analysisSummary: "Human review required.",
                source: "DETERMINISTIC_FALLBACK"
            }));

            trackedEventObjectIds.push(res6.event._id);

            if (res6.policy.decision !== "ESCALATED") throw new Error(`Expected policy ESCALATED, got ${res6.policy.decision}`);
            if (res6.recoveryAttempt !== undefined) throw new Error("Expected NO RecoveryAttempt to be created");

            recordSuccess(6, test6Name);
        } catch (err) {
            recordFailure(6, test6Name, "HUMAN_REVIEW yields ESCALATED and undefined recoveryAttempt", err);
        }

        // ============================================================
        // TEST 7 — BLOCKED MAX ATTEMPTS
        // ============================================================
        const test7Name = "BLOCKED MAX ATTEMPTS (RecoveryAttempt > 3 -> BLOCKED)";
        console.log(`\n--- Running TEST 7: ${test7Name} ---`);
        try {
            const id7 = `TEST_BLOCKED_MAX_${timestamp}`;
            const objId7 = new mongoose.Types.ObjectId();
            trackedEventIds.push(id7);
            trackedEventObjectIds.push(objId7);

            // Pre-seed 3 prior attempts
            for (let i = 1; i <= 3; i++) {
                const priorAttempt = new RecoveryAttempt({
                    event: objId7,
                    analysis: new mongoose.Types.ObjectId(),
                    recoveryAttemptNumber: i,
                    action: "RETRY_NOW",
                    outcome: "FAILED",
                    outcomeDetails: `Prior attempt #${i}`
                });
                await priorAttempt.save();
            }

            const res7 = await processEvent({
                _id: objId7,
                eventId: id7,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_7_${timestamp}`,
                paymentAmount: 2000,
                status: "FAILED",
                errorCode: "NETWORK_ERROR",
                attemptNumber: 4,
                timestamp: new Date()
            }, async () => ({
                recommendation: "RETRY_NOW",
                confidence: 0.85,
                reasoning: "Retry requested.",
                analysisSummary: "Retry analysis.",
                source: "DETERMINISTIC_FALLBACK"
            }));

            if (res7.policy.decision !== "BLOCKED") throw new Error(`Expected policy BLOCKED, got ${res7.policy.decision}`);
            if (res7.recoveryAttempt !== undefined) throw new Error("Expected no new RecoveryAttempt on BLOCKED");
            if (res7.event.status !== "FAILED") throw new Error(`Expected event status to remain FAILED, got ${res7.event.status}`);

            recordSuccess(7, test7Name);
        } catch (err) {
            recordFailure(7, test7Name, "Max recovery attempts triggers BLOCKED with no new attempt", err);
        }

        // ============================================================
        // TEST 8 — INVALID AI RECOMMENDATION VALIDATION
        // ============================================================
        const test8Name = "VALIDATE GEMINI: INVALID RECOMMENDATION";
        console.log(`\n--- Running TEST 8: ${test8Name} ---`);
        try {
            let threw = false;
            try {
                validateGeminiResult({
                    recommendation: "NON_EXISTENT_ACTION",
                    confidence: 0.8,
                    reasoning: "Valid reasoning.",
                    analysisSummary: "Valid summary."
                });
            } catch (err) {
                threw = true;
                if (!err.message.includes("Invalid recommendation")) {
                    throw new Error(`Unexpected error message: ${err.message}`);
                }
            }
            if (!threw) throw new Error("validateGeminiResult should have thrown for invalid recommendation");

            recordSuccess(8, test8Name);
        } catch (err) {
            recordFailure(8, test8Name, "Throws on invalid recommendation", err);
        }

        // ============================================================
        // TEST 9 — INVALID AI CONFIDENCE VALIDATION
        // ============================================================
        const test9Name = "VALIDATE GEMINI: INVALID CONFIDENCE";
        console.log(`\n--- Running TEST 9: ${test9Name} ---`);
        try {
            let threwHigh = false;
            let threwLow = false;
            try {
                validateGeminiResult({
                    recommendation: "RETRY_NOW",
                    confidence: 1.2,
                    reasoning: "Valid reasoning.",
                    analysisSummary: "Valid summary."
                });
            } catch (e) {
                threwHigh = true;
            }

            try {
                validateGeminiResult({
                    recommendation: "RETRY_NOW",
                    confidence: -0.1,
                    reasoning: "Valid reasoning.",
                    analysisSummary: "Valid summary."
                });
            } catch (e) {
                threwLow = true;
            }

            if (!threwHigh || !threwLow) {
                throw new Error("validateGeminiResult should throw for confidence outside [0, 1]");
            }

            recordSuccess(9, test9Name);
        } catch (err) {
            recordFailure(9, test9Name, "Throws on confidence outside [0, 1]", err);
        }

        // ============================================================
        // TEST 10 — INVALID AI REASONING VALIDATION
        // ============================================================
        const test10Name = "VALIDATE GEMINI: INVALID REASONING";
        console.log(`\n--- Running TEST 10: ${test10Name} ---`);
        try {
            let threwEmpty = false;
            try {
                validateGeminiResult({
                    recommendation: "RETRY_NOW",
                    confidence: 0.8,
                    reasoning: "   ",
                    analysisSummary: "Valid summary."
                });
            } catch (e) {
                threwEmpty = true;
            }

            if (!threwEmpty) throw new Error("validateGeminiResult should throw for empty reasoning");

            recordSuccess(10, test10Name);
        } catch (err) {
            recordFailure(10, test10Name, "Throws on empty reasoning", err);
        }

        // ============================================================
        // TEST 11 — INVALID AI ANALYSIS SUMMARY VALIDATION
        // ============================================================
        const test11Name = "VALIDATE GEMINI: INVALID ANALYSIS SUMMARY";
        console.log(`\n--- Running TEST 11: ${test11Name} ---`);
        try {
            let threwEmpty = false;
            try {
                validateGeminiResult({
                    recommendation: "RETRY_NOW",
                    confidence: 0.8,
                    reasoning: "Valid reasoning.",
                    analysisSummary: ""
                });
            } catch (e) {
                threwEmpty = true;
            }

            if (!threwEmpty) throw new Error("validateGeminiResult should throw for empty analysisSummary");

            recordSuccess(11, test11Name);
        } catch (err) {
            recordFailure(11, test11Name, "Throws on empty analysisSummary", err);
        }

        // ============================================================
        // TEST 12 — RETRYABLE GEMINI ERRORS
        // ============================================================
        const test12Name = "IS RETRYABLE GEMINI ERROR (429, 503, 504, AbortError)";
        console.log(`\n--- Running TEST 12: ${test12Name} ---`);
        try {
            const err429 = { status: 429 };
            const err503 = { status: 503 };
            const err504 = { status: 504 };
            const errAbort = { name: "AbortError" };

            if (!isRetryableGeminiError(err429)) throw new Error("429 should be retryable");
            if (!isRetryableGeminiError(err503)) throw new Error("503 should be retryable");
            if (!isRetryableGeminiError(err504)) throw new Error("504 should be retryable");
            if (!isRetryableGeminiError(errAbort)) throw new Error("AbortError should be retryable");

            recordSuccess(12, test12Name);
        } catch (err) {
            recordFailure(12, test12Name, "429, 503, 504, AbortError identified as retryable", err);
        }

        // ============================================================
        // TEST 13 — NON-RETRYABLE GEMINI ERROR
        // ============================================================
        const test13Name = "NON-RETRYABLE GEMINI ERROR (401)";
        console.log(`\n--- Running TEST 13: ${test13Name} ---`);
        try {
            const err401 = { status: 401 };
            if (isRetryableGeminiError(err401)) throw new Error("401 should NOT be retryable");

            recordSuccess(13, test13Name);
        } catch (err) {
            recordFailure(13, test13Name, "401 identified as non-retryable", err);
        }

        // ============================================================
        // TEST 14, 15, 16 — ANALYTICS FIXTURE SETUP
        // ============================================================
        console.log("\n--- Setting up Controlled Analytics Fixture (2 RECOVERED, 1 FAILED, 1 PENDING) ---");
        const analyticsEventObjectIds = [];
        const outcomes = ["RECOVERED", "RECOVERED", "FAILED", "PENDING"];

        for (let i = 0; i < 4; i++) {
            const eventId = `TEST_ANALYTICS_EVT_${timestamp}_${i + 1}`;
            trackedEventIds.push(eventId);

            const ev = new Event({
                eventId,
                eventType: "PAYMENT_FAILURE",
                customerId: `TEST_CUST_ANALYTICS_${timestamp}`,
                paymentAmount: 9000,
                status: outcomes[i] === "RECOVERED" ? "RECOVERED" : (outcomes[i] === "FAILED" ? "FAILED" : "PENDING"),
                errorCode: "NETWORK_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            });
            const savedEv = await ev.save();
            analyticsEventObjectIds.push(savedEv._id);
            trackedEventObjectIds.push(savedEv._id);

            const analysis = new RecoveryAnalysis({
                event: savedEv._id,
                analysisNumber: 1,
                analysisSummary: "Analytics fixture analysis.",
                recommendation: "RETRY_NOW",
                confidence: 0.8,
                reasoning: "Analytics fixture reasoning.",
                source: "DETERMINISTIC_FALLBACK"
            });
            const savedAnalysis = await analysis.save();

            const attempt = new RecoveryAttempt({
                event: savedEv._id,
                analysis: savedAnalysis._id,
                recoveryAttemptNumber: 1,
                action: "RETRY_NOW",
                outcome: outcomes[i],
                outcomeDetails: `Analytics fixture outcome: ${outcomes[i]}`
            });
            await attempt.save();
        }

        // ============================================================
        // TEST 14 — RECOVERY RATE
        // ============================================================
        const test14Name = "RECOVERY RATE (2 RECOVERED, 1 FAILED, 1 PENDING -> 2/3)";
        console.log(`\n--- Running TEST 14: ${test14Name} ---`);
        try {
            const rateResult = await getRecoveryRate(analyticsEventObjectIds);
            const expectedRate = 2 / 3;

            if (rateResult.recoveredAttempts !== 2) throw new Error(`Expected recoveredAttempts 2, got ${rateResult.recoveredAttempts}`);
            if (rateResult.failedAttempts !== 1) throw new Error(`Expected failedAttempts 1, got ${rateResult.failedAttempts}`);
            if (Math.abs(rateResult.recoveryRate - expectedRate) >= 1e-9) {
                throw new Error(`Expected recoveryRate ${expectedRate}, got ${rateResult.recoveryRate}`);
            }

            recordSuccess(14, test14Name);
        } catch (err) {
            recordFailure(14, test14Name, "recoveryRate is 2/3 with PENDING excluded", err);
        }

        // ============================================================
        // TEST 15 — HISTORICAL RECOVERY PROBABILITY
        // ============================================================
        const test15Name = "HISTORICAL RECOVERY PROBABILITY (action=RETRY_NOW, errorCode=NETWORK_ERROR -> 2/3)";
        console.log(`\n--- Running TEST 15: ${test15Name} ---`);
        try {
            const probResult = await getHistoricalRecoveryProbability(
                "RETRY_NOW",
                "NETWORK_ERROR",
                analyticsEventObjectIds
            );
            const expectedProb = 2 / 3;

            if (probResult.completedAttempts !== 3) throw new Error(`Expected completedAttempts 3, got ${probResult.completedAttempts}`);
            if (probResult.recoveredAttempts !== 2) throw new Error(`Expected recoveredAttempts 2, got ${probResult.recoveredAttempts}`);
            if (probResult.failedAttempts !== 1) throw new Error(`Expected failedAttempts 1, got ${probResult.failedAttempts}`);
            if (Math.abs(probResult.recoveryProbability - expectedProb) >= 1e-9) {
                throw new Error(`Expected recoveryProbability ${expectedProb}, got ${probResult.recoveryProbability}`);
            }

            recordSuccess(15, test15Name);
        } catch (err) {
            recordFailure(15, test15Name, "recoveryProbability is 2/3", err);
        }

        // ============================================================
        // TEST 16 — EXPECTED RECOVERY VALUE
        // ============================================================
        const test16Name = "EXPECTED RECOVERY VALUE (amount=9000 * 2/3 = 6000)";
        console.log(`\n--- Running TEST 16: ${test16Name} ---`);
        try {
            const valResult = await getExpectedRecoveryValue(
                9000,
                "RETRY_NOW",
                "NETWORK_ERROR",
                analyticsEventObjectIds
            );
            const expectedVal = 6000;

            if (Math.abs(valResult.recoveryProbability - (2 / 3)) >= 1e-9) {
                throw new Error(`Expected recoveryProbability 2/3, got ${valResult.recoveryProbability}`);
            }
            if (Math.abs(valResult.expectedRecoveryValue - expectedVal) >= 1e-9) {
                throw new Error(`Expected expectedRecoveryValue 6000, got ${valResult.expectedRecoveryValue}`);
            }

            recordSuccess(16, test16Name);
        } catch (err) {
            recordFailure(16, test16Name, "expectedRecoveryValue is 6000", err);
        }

        // ============================================================
        // TEST 17 — EMPTY HISTORICAL DATA / COLD START
        // ============================================================
        const test17Name = "COLD START / EMPTY HISTORICAL DATA (Prob=0, ExpectedValue=0)";
        console.log(`\n--- Running TEST 17: ${test17Name} ---`);
        try {
            const coldResult = await getExpectedRecoveryValue(
                5000,
                "SEND_PAYMENT_LINK",
                "NON_EXISTENT_ERROR_CODE",
                [new mongoose.Types.ObjectId()]
            );

            if (coldResult.recoveredAttempts !== 0) throw new Error(`Expected recoveredAttempts 0, got ${coldResult.recoveredAttempts}`);
            if (coldResult.failedAttempts !== 0) throw new Error(`Expected failedAttempts 0, got ${coldResult.failedAttempts}`);
            if (coldResult.completedAttempts !== 0) throw new Error(`Expected completedAttempts 0, got ${coldResult.completedAttempts}`);
            if (coldResult.recoveryProbability !== 0) throw new Error(`Expected recoveryProbability 0, got ${coldResult.recoveryProbability}`);
            if (coldResult.expectedRecoveryValue !== 0) throw new Error(`Expected expectedRecoveryValue 0, got ${coldResult.expectedRecoveryValue}`);

            recordSuccess(17, test17Name);
        } catch (err) {
            recordFailure(17, test17Name, "Cold start returns 0 for probability and expected value", err);
        }

    } finally {
        await cleanupTestData();
        await mongoose.connection.close();
        console.log("[DB] MongoDB connection closed.");
    }

    // ============================================================
    // SUMMARY REPORT
    // ============================================================
    console.log("\n================================================================================");
    console.log("REGRESSION TEST SUITE EXECUTION SUMMARY");
    console.log("================================================================================");
    console.log(`TOTAL TESTS: ${totalTests}`);
    console.log(`PASSED: ${passedTests}`);
    console.log(`FAILED: ${failures.length}`);
    console.log(`REAL GEMINI SMOKE TEST STATUS: ${geminiSmokeStatus}`);

    if (failures.length > 0) {
        console.log("\nFAILURES BREAKDOWN:");
        failures.forEach(f => {
            console.log(`- TEST ${f.testNum} (${f.testName}):`);
            console.log(`  Assertion: ${f.assertion}`);
            console.log(`  Error: ${f.message}`);
        });
        process.exit(1);
    } else {
        console.log("\n>>> ALL 17 REGRESSION TESTS PASSED CLEANLY! <<<");
    }
};

runRegressionSuite().catch(err => {
    console.error("Fatal Error running regression test suite:", err);
    process.exit(1);
});
