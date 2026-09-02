import { Router } from "express";
import crypto from "crypto";
import Event from "../models/Event.js";
import normalizeRazorpayEvent from "../services/normalizeRazorpayEvent.js";
import processEvent from "../services/processEvent.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";

const router = Router();

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const sendError = (res, status, message) => {
    return res.status(status).json({
        status: "ERROR",
        message
    });
};

const verifySignature = (rawBody, receivedSignature) => {
    if (!receivedSignature || !webhookSecret) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

    if (
        typeof receivedSignature !== "string" ||
        receivedSignature.length !== expectedSignature.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(receivedSignature, "utf8")
    );
};

router.post("/", async (req, res) => {
    try {
        // --------------------------------------------------
        // 1. Verify webhook secret configuration
        // --------------------------------------------------
        if (!webhookSecret) {
            console.error(
                "RAZORPAY_WEBHOOK_SECRET is not configured."
            );

            return sendError(
                res,
                500,
                "Webhook secret is not configured."
            );
        }

        // --------------------------------------------------
        // 2. Ensure raw request body exists
        // --------------------------------------------------
        if (!Buffer.isBuffer(req.body)) {
            return sendError(
                res,
                400,
                "Invalid webhook request body."
            );
        }

        // --------------------------------------------------
        // 3. Verify Razorpay signature
        // --------------------------------------------------
        const receivedSignature =
            req.headers["x-razorpay-signature"];

        if (!receivedSignature) {
            return sendError(
                res,
                400,
                "Missing webhook signature."
            );
        }

        const isSignatureValid = verifySignature(
            req.body,
            receivedSignature
        );

        if (!isSignatureValid) {
            return sendError(
                res,
                400,
                "Invalid webhook signature"
            );
        }

        // --------------------------------------------------
        // 4. Require provider event ID
        // --------------------------------------------------
        const providerEventId =
            req.headers["x-razorpay-event-id"];

        if (!providerEventId) {
            return sendError(
                res,
                400,
                "Provider event ID not found."
            );
        }

        // --------------------------------------------------
        // 5. Parse JSON safely
        // --------------------------------------------------
        let payload;

        try {
            payload = JSON.parse(req.body.toString("utf8"));
        } catch (error) {
            console.error(
                "Webhook JSON parsing failed:",
                error.message
            );

            return sendError(
                res,
                400,
                "Malformed webhook JSON payload."
            );
        }

        // --------------------------------------------------
        // 6. Validate basic payload structure
        // --------------------------------------------------
        if (
            payload === null ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            return sendError(
                res,
                400,
                "Invalid webhook payload."
            );
        }

        const eventType = payload.event;

        if (
            typeof eventType !== "string" ||
            eventType.trim().length === 0
        ) {
            return sendError(
                res,
                400,
                "Webhook event type is missing or invalid."
            );
        }

        // --------------------------------------------------
        // 7. Idempotency check
        // --------------------------------------------------
        const existingEvent = await Event.findOne({
            providerEventId
        });

        if (existingEvent !== null) {
            return res.status(200).json({
                status: "OK",
                message: "Webhook already processed"
            });
        }

        // --------------------------------------------------
        // 8. Handle Payment Link lifecycle events
        // --------------------------------------------------
        if (eventType.startsWith("payment_link.")) {
            const paymentLinkId =
                payload?.payload?.payment_link?.entity?.id;

            if (
                typeof paymentLinkId !== "string" ||
                paymentLinkId.length === 0
            ) {
                return sendError(
                    res,
                    400,
                    "Payment Link ID is missing or invalid."
                );
            }

            const recoveryAttempt =
                await RecoveryAttempt.findOne({
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
            } else if (
                eventType === "payment_link.partially_paid"
            ) {
                outcome = "PENDING";
                outcomeDetails =
                    "Customer partially paid through the Razorpay Payment Link.";
            } else if (
                eventType === "payment_link.cancelled"
            ) {
                outcome = "FAILED";
                outcomeDetails =
                    "Payment Link was cancelled before full recovery.";
            } else if (
                eventType === "payment_link.expired"
            ) {
                outcome = "FAILED";
                outcomeDetails =
                    "Payment Link expired before full recovery.";
            } else {
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
                outcome
            });
        }

        // --------------------------------------------------
        // 9. Normalize standard Razorpay payment event
        // --------------------------------------------------
        let normalizedEvent;

        try {
            normalizedEvent = normalizeRazorpayEvent(
                payload,
                providerEventId
            );
        } catch (error) {
            console.error(
                "Razorpay event normalization failed:",
                error
            );

            return sendError(
                res,
                400,
                "Invalid Razorpay event payload."
            );
        }

        // --------------------------------------------------
        // 10. Process payment.failed
        // --------------------------------------------------
        if (normalizedEvent.eventType === "payment.failed") {
            await processEvent(normalizedEvent);
        }

        // --------------------------------------------------
        // 11. Process other payment lifecycle events
        // --------------------------------------------------
        else {
            const event = await Event.findOne({
                eventId: normalizedEvent.eventId
            });

            if (event !== null) {
                event.status = normalizedEvent.status;
                await event.save();
            } else {
                return res.status(200).json({
                    status: "OK",
                    message:
                        "Lifecycle event received, but no existing payment event was found",
                    eventId: normalizedEvent.eventId
                });
            }
        }

        console.log(
            "Normalized event:",
            normalizedEvent
        );

        return res.status(200).json({
            status: "OK",
            message: "Webhook processed successfully",
            eventId: normalizedEvent.eventId
        });
    } catch (error) {
        console.error(
            "Webhook processing failed:",
            error
        );

        return res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});

export default router;