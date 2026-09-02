import dotenv from "dotenv";
import mongoose from "mongoose";

import Event from "../../models/Event.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";
import processDeferredRecoveries from "../../services/deferredRecoveryService.js";

dotenv.config({
    path: "../../.env"
});

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const event = await Event.create({
            eventId: `deferred_${Date.now()}`,
            eventType: "payment.failed",
            customerId: `customer_${Date.now()}`,
            paymentAmount: 50,
            status: "FAILED",
            errorCode: "NETWORK_ERROR",
            attemptNumber: 1,
            timestamp: new Date()
        });

        const attempt = await RecoveryAttempt.create({
            event: event._id,
            analysis: new mongoose.Types.ObjectId(),
            recoveryAttemptNumber: 1,
            action: "WAIT_AND_RETRY",
            outcome: "PENDING",
            nextRetryAt: new Date(Date.now() - 1000),
            outcomeDetails:
                "Payment retry scheduled; awaiting deferred retry."
        });

        await processDeferredRecoveries();

        const updatedAttempt =
            await RecoveryAttempt.findById(attempt._id);

        const updatedEvent =
            await Event.findById(event._id);

        console.log("RecoveryAttempt:");
        console.log(updatedAttempt);

        console.log("Event:");
        console.log(updatedEvent);

        console.log(
            updatedAttempt.outcome === "RECOVERED" &&
                updatedEvent.status === "RECOVERED"
                ? "✅ TEST PASSED"
                : "❌ TEST FAILED"
        );

    } catch (error) {
        console.error(
            "Deferred recovery test failed:",
            error
        );
    } finally {
        await mongoose.disconnect();
    }
};

runTest();