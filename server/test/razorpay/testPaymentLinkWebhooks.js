import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";

import Event from "../../models/Event.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";

dotenv.config({
    path: "../../.env"
});

const webhookURL = "http://localhost:5000/webhooks/razorpay";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const testEvents = [
    {
        eventType: "payment_link.partially_paid",
        expectedOutcome: "PENDING"
    },
    {
        eventType: "payment_link.cancelled",
        expectedOutcome: "FAILED"
    },
    {
        eventType: "payment_link.expired",
        expectedOutcome: "FAILED"
    }
];

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        for (const test of testEvents) {
            const eventId = `test_pl_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;

            const paymentLinkId = `plink_test_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;

            const event = await Event.create({
                eventId,
                eventType: "payment.failed",
                customerId: `customer_${Date.now()}`,
                paymentAmount: 50,
                status: "FAILED",
                errorCode: "BAD_REQUEST_ERROR",
                attemptNumber: 1,
                timestamp: new Date()
            });

            const recoveryAttempt = await RecoveryAttempt.create({
                event: event._id,
                analysis: new mongoose.Types.ObjectId(),
                recoveryAttemptNumber: 1,
                action: "SEND_PAYMENT_LINK",
                outcome: "PENDING",
                paymentLinkId
            });

            const payload = {
                event: test.eventType,
                payload: {
                    payment_link: {
                        entity: {
                            id: paymentLinkId
                        }
                    }
                }
            };

            const rawBody = JSON.stringify(payload);

            const signature = crypto
                .createHmac("sha256", webhookSecret)
                .update(rawBody)
                .digest("hex");

            const providerEventId = `evt_test_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;

            const response = await fetch(webhookURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-razorpay-signature": signature,
                    "x-razorpay-event-id": providerEventId
                },
                body: rawBody
            });

            const responseData = await response.json();

            const updatedAttempt =
                await RecoveryAttempt.findById(recoveryAttempt._id);

            const updatedEvent =
                await Event.findById(event._id);

            console.log("\nEvent:", test.eventType);
            console.log("HTTP Status:", response.status);
            console.log("Response:", responseData);
            console.log(
                "RecoveryAttempt outcome:",
                updatedAttempt.outcome
            );
            console.log(
                "Event status:",
                updatedEvent.status
            );
            console.log(
                "Expected outcome:",
                test.expectedOutcome
            );

            console.log(
                updatedAttempt.outcome === test.expectedOutcome &&
                updatedEvent.status === test.expectedOutcome
                    ? "✅ TEST PASSED"
                    : "❌ TEST FAILED"
            );
        }
    } catch (error) {
        console.error("Payment Link webhook tests failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();