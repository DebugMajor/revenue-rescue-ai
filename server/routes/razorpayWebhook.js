import { Router } from "express";
import crypto from "crypto";
import Event from "../models/Event.js";
import normalizeRazorpayEvent from "../services/normalizeRazorpayEvent.js";
import processEvent from "../services/processEvent.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";

const router = Router();

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post("/", async (req, res) => {
    try {
        const receivedSignature =
            req.headers["x-razorpay-signature"];

        const providerEventId =
            req.headers["x-razorpay-event-id"];

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(req.body)
            .digest("hex");

        if (expectedSignature !== receivedSignature) {
            return res.status(400).json({
                status: "ERROR",
                message: "Invalid webhook signature"
            });
        }

        if (!providerEventId) {
            return res.status(400).json({
                status: "ERROR",
                message: "Provider event ID not found."
            });
        }

        const existingEvent = await Event.findOne({
            providerEventId
        });

        if (existingEvent !== null) {
            return res.status(200).json({
                status: "OK",
                message: "Webhook already processed"
            });
        }

        const payload = JSON.parse(req.body.toString());

        const eventType = payload.event;

        if (eventType.startsWith("payment_link.")) {
            const paymentLinkId =
                payload.payload.payment_link.entity.id;

            const recoveryAttempt = await RecoveryAttempt.findOne({
                paymentLinkId
            });

            if (recoveryAttempt === null) {
                return res.status(200).json({
                    status: "OK",
                    message:
                        "Payment Link received, but no matching recovery attempt was found",
                    eventType,
                    paymentLinkId
                });
            }

            let outcome;
            let outcomeDetails;

            if (eventType === "payment_link.paid") {
                outcome = "RECOVERED";
                outcomeDetails =
                    "Customer completed payment through the Razorpay Payment Link.";
            }
            else if (eventType === "payment_link.partially_paid") {
                outcome = "PENDING";
                outcomeDetails =
                    "Customer partially paid through the Razorpay Payment Link.";
            }
            else if (eventType === "payment_link.cancelled") {
                outcome = "FAILED";
                outcomeDetails =
                    "Payment Link was cancelled before full recovery.";
            }
            else if (eventType === "payment_link.expired") {
                outcome = "FAILED";
                outcomeDetails =
                    "Payment Link expired before full recovery.";
            }
            else {
                return res.status(200).json({
                    status: "OK",
                    message: "Unsupported Payment Link event",
                    eventType,
                    paymentLinkId
                });
            }

            recoveryAttempt.outcome = outcome;
            recoveryAttempt.outcomeDetails = outcomeDetails;

            await recoveryAttempt.save();

            await Event.findOneAndUpdate(
                { _id: recoveryAttempt.event },
                { status: outcome }
            );

            return res.status(200).json({
                status: "OK",
                message: "Payment Link webhook processed",
                eventType,
                paymentLinkId,
                outcome: recoveryAttempt.outcome
            });
        }

        const normalizedEvent = normalizeRazorpayEvent(
            payload,
            providerEventId
        );

        if (normalizedEvent.eventType === "payment.failed") {
            await processEvent(normalizedEvent);
        }
        else {
            const event = await Event.findOne({
                eventId: normalizedEvent.eventId
            });

            if (event !== null) {
                event.status = normalizedEvent.status;
                await event.save();
            }
            else {
                return res.status(200).json({
                    status: "OK",
                    message:
                        "Lifecycle event received, but no existing payment event was found",
                    eventId: normalizedEvent.eventId
                });
            }
        }

        console.log("Normalized event:", normalizedEvent);

        return res.status(200).json({
            status: "OK",
            message: "Webhook processed successfully",
            eventId: normalizedEvent.eventId
        });

    } catch (error) {
        console.error("Webhook processing failed:", error);

        return res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});

export default router;