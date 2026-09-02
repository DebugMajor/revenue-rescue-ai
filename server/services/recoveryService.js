import RecoveryAttempt from "../models/RecoveryAttempt.js";
import Event from "../models/Event.js";
import razorpayService from "./razorpay/razorpayService.js";

const finalizeAttempt = async (event, attempt, outcome, outcomeDetails) => {
    attempt.outcome = outcome;
    attempt.outcomeDetails = outcomeDetails;

    await Event.findOneAndUpdate(
        { _id: event._id },
        { status: outcome },
        { returnDocument: "after" }
    );

    await attempt.save();
};

const executeRecovery = async (event, analysis) => {

    if (
        analysis.recommendation === "HUMAN_REVIEW" ||
        analysis.recommendation === "DO_NOT_RETRY"
    ) {
        return;
    }

    // History lookup
    const existingAttempts = await RecoveryAttempt.countDocuments({
        event: event._id
    });

    const recoveryAttemptNumber = existingAttempts + 1;

    const newAttempt = new RecoveryAttempt({
        event: event._id,
        analysis: analysis._id,
        recoveryAttemptNumber,
        action: analysis.recommendation,
        outcome: "PENDING"
    });

    const savedAttempt = await newAttempt.save();

    // RETRY_NOW
    if (analysis.recommendation === "RETRY_NOW") {
        if (event.errorCode === "NETWORK_ERROR") {
            await finalizeAttempt(
                event,
                savedAttempt,
                "RECOVERED",
                "Payment retry succeeded after the temporary network failure."
            );
        } else {
            await finalizeAttempt(
                event,
                savedAttempt,
                "FAILED",
                "Payment retry did not resolve the payment failure."
            );
        }
    }

    // WAIT_AND_RETRY
    else if (analysis.recommendation === "WAIT_AND_RETRY") {
        await finalizeAttempt(
            event,
            savedAttempt,
            "PENDING",
            "Payment retry scheduled; awaiting deferred retry."
        );
    }

    // SEND_PAYMENT_LINK
    else if (analysis.recommendation === "SEND_PAYMENT_LINK") {
        const razorpay = razorpayService();

        const paymentLink = await razorpay.createPaymentLink(
            event.paymentAmount,
            event.customerId,
            "test@example.com"
        );

        savedAttempt.paymentLinkId = paymentLink.data.id;
        savedAttempt.outcome = "PENDING";
        savedAttempt.outcomeDetails =
            "Razorpay Payment Link created; awaiting customer payment.";

        await savedAttempt.save();
    }

    return savedAttempt;
};

export default executeRecovery;