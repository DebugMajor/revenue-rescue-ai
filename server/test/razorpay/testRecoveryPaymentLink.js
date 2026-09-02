import dotenv from "dotenv";
import mongoose from "mongoose";

import Event from "../../models/Event.js";
import RecoveryAnalysis from "../../models/RecoveryAnalysis.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";
import executeRecovery from "../../services/recoveryService.js";

dotenv.config({
    path: "../../.env"
});

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const event = await Event.create({
            eventId: `test_payment_link_${Date.now()}`,
            eventType: "payment.failed",
            customerId: `test_customer_${Date.now()}`,
            paymentAmount: 50,
            status: "FAILED",
            errorCode: "BAD_REQUEST_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        });

        const analysis = await RecoveryAnalysis.create({
            event: event._id,
            analysisNumber: 1,
            analysisSummary: "Test analysis for payment link recovery.",
            recommendation: "SEND_PAYMENT_LINK",
            confidence: 0.95,
            reasoning: "Testing Razorpay Payment Link execution.",
            source: "DETERMINISTIC_FALLBACK"
        });

        const result = await executeRecovery(event, analysis);

        console.log("Recovery Attempt Returned:");
        console.log(result);

        const savedAttempt = await RecoveryAttempt.findById(result._id);

        console.log("Saved Recovery Attempt:");
        console.log(savedAttempt);

    } catch (error) {
        console.error("Recovery Payment Link test failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();