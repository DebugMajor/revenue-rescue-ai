import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";
import Event from "../../models/Event.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";

dotenv.config({
    path: "../../.env"
});

const webhookURL =
    "http://localhost:5000/webhooks/razorpay";

const webhookSecret =
    process.env.RAZORPAY_WEBHOOK_SECRET;

const runTest = async () => {
    try {
        if (!webhookSecret) {
            throw new Error(
                "RAZORPAY_WEBHOOK_SECRET is not configured."
            );
        }

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("Connected to MongoDB.");

        // --------------------------------------------------
        // 1. Find the pending abandoned checkout
        // --------------------------------------------------

        const abandonedAttempt =
            await RecoveryAttempt.findOne({
                action: "RECOVERY_REMINDER",
                outcome: "PENDING"
            })
                .populate("event")
                .sort({ createdAt: -1 });

        if (
            !abandonedAttempt ||
            !abandonedAttempt.event
        ) {
            throw new Error(
                "No pending abandoned checkout recovery was found."
            );
        }

        console.log(
            "\nPending abandoned recovery found:"
        );

        console.log({
            recoveryAttemptId:
                abandonedAttempt._id,
            eventId:
                abandonedAttempt.event.eventId,
            customerId:
                abandonedAttempt.event.customerId,
            amount:
                abandonedAttempt.event.paymentAmount,
            eventType:
                abandonedAttempt.event.eventType,
            eventStatus:
                abandonedAttempt.event.status,
            action:
                abandonedAttempt.action,
            outcome:
                abandonedAttempt.outcome
        });

        // --------------------------------------------------
        // 2. Create a fake Razorpay payment.captured event
        // --------------------------------------------------

        const razorpayPaymentId =
            `pay_abandon_test_${Date.now()}`;

        const providerEventId =
            `evt_abandon_test_${Date.now()}`;

        const payload = {
            event: "payment.captured",

            payload: {
                payment: {
                    entity: {
                        id: razorpayPaymentId,

                        customer_id:
                            abandonedAttempt.event.customerId,

                        amount:
                            abandonedAttempt.event.paymentAmount * 100,

                        status: "captured",

                        error_code: null,

                        created_at:
                            Math.floor(
                                Date.now() / 1000
                            )
                    }
                }
            }
        };

        const rawBody =
            JSON.stringify(payload);

        // --------------------------------------------------
        // 3. Generate valid Razorpay HMAC
        // --------------------------------------------------

        const signature =
            crypto
                .createHmac(
                    "sha256",
                    webhookSecret
                )
                .update(rawBody)
                .digest("hex");

        // --------------------------------------------------
        // 4. Send webhook request
        // --------------------------------------------------

        console.log(
            "\nSending payment.captured webhook..."
        );

        const response =
            await fetch(webhookURL, {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "x-razorpay-signature":
                        signature,

                    "x-razorpay-event-id":
                        providerEventId
                },

                body: rawBody
            });

        // --------------------------------------------------
        // 5. Read response
        // --------------------------------------------------

        const responseData =
            await response.json();

        console.log(
            "\nWebhook response:"
        );

        console.log({
            httpStatus:
                response.status,
            response:
                responseData
        });

        // --------------------------------------------------
        // 6. Print expected matcher result
        // --------------------------------------------------

        console.log(
            "\nExpected:"
        );

        console.log(
            "MATCHED ABANDONED RECOVERY should appear in the server console."
        );

        console.log(
            "\nTest event:"
        );

        console.log({
            providerEventId,
            razorpayPaymentId,
            customerId:
                abandonedAttempt.event.customerId,
            amount:
                abandonedAttempt.event.paymentAmount,
            eventType:
                "payment.captured"
        });

    } catch (error) {
        console.error(
            "\nAbandoned checkout webhook test failed:"
        );

        console.error(error);

    } finally {
        await mongoose.disconnect();

        console.log(
            "\nMongoDB connection closed."
        );
    }
};

runTest();