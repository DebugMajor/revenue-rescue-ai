import { Router } from "express";
import crypto from "crypto";
import Event from "../models/Event.js";
import normalizeRazorpayEvent from "../services/normalizeRazorpayEvent.js";
import processEvent from "../services/processEvent.js";

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

        const normalizedEvent = normalizeRazorpayEvent(
            payload,
            providerEventId
        );
        if (normalizedEvent.eventType === "payment.failed") {
            await processEvent(normalizedEvent);
        }
        else {
            const event = await Event.findOne(
                { eventId: normalizedEvent.eventId }
            );
            if (event !== null) {
                event.status = normalizedEvent.status;
                await event.save();
            }
            else {
                return res.status(200).json({
                    status: "OK",
                    message: "Lifecycle event received, but no existing payment event was found",
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