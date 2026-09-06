import RecoveryAttempt from "../models/RecoveryAttempt.js";
import Event from "../models/Event.js";
import razorpayService from "./razorpay/razorpayService.js";
import isEvaluationMode from "../config/evaluation.js";
import { simulateRecovery } from "../test/evaluation/outcomeSimulator.js";
const finalizeAttempt = async (
    event,
    attempt,
    outcome,
    outcomeDetails
) => {
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
        if (isEvaluationMode) {
            const simulation = simulateRecovery(
                event,
                "RETRY_NOW"
            );

            if (simulation.recovered) {
                await finalizeAttempt(
                    event,
                    savedAttempt,
                    "RECOVERED",
                    "Evaluation mode: simulated retry succeeded."
                );
            } else {
                await finalizeAttempt(
                    event,
                    savedAttempt,
                    "FAILED",
                    "Evaluation mode: simulated retry failed."
                );
            }
        } else {
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
    }
    // WAIT_AND_RETRY
    // WAIT_AND_RETRY
    else if (analysis.recommendation === "WAIT_AND_RETRY") {
        savedAttempt.nextRetryAt =
            new Date(Date.now() + 10000);

        if (isEvaluationMode) {
            const simulation = simulateRecovery(
                event,
                "WAIT_AND_RETRY"
            );

            if (simulation.recovered) {
                savedAttempt.outcome = "RECOVERED";
                savedAttempt.outcomeDetails =
                    "Evaluation mode: simulated deferred retry succeeded.";
            } else {
                savedAttempt.outcome = "PENDING";
                savedAttempt.outcomeDetails =
                    "Evaluation mode: deferred retry scheduled; simulated outcome remains pending.";
            }
        } else {
            savedAttempt.outcome = "PENDING";
            savedAttempt.outcomeDetails =
                "Payment retry scheduled; awaiting deferred retry.";
        }

        await Event.findOneAndUpdate(
            { _id: event._id },
            { status: savedAttempt.outcome },
            { returnDocument: "after" }
        );

        await savedAttempt.save();
    }

    // SEND_PAYMENT_LINK
    // SEND_PAYMENT_LINK
    else if (analysis.recommendation === "SEND_PAYMENT_LINK") {
        let paymentLinkId;

        if (isEvaluationMode) {
            paymentLinkId =
                `plink_eval_${Date.now()}_${event._id}`;

            const simulation = simulateRecovery(
                event,
                "SEND_PAYMENT_LINK"
            );

            if (simulation.recovered) {
                savedAttempt.outcome = "RECOVERED";
                savedAttempt.outcomeDetails =
                    "Evaluation mode: simulated Payment Link payment succeeded.";
            } else {
                savedAttempt.outcome = "PENDING";
                savedAttempt.outcomeDetails =
                    "Evaluation mode: simulated Payment Link created; awaiting simulated customer payment.";
            }
        } else {
            const razorpay = razorpayService();

            const paymentLink =
                await razorpay.createPaymentLink(
                    event.paymentAmount,
                    event.customerId,
                    "test@example.com"
                );

            paymentLinkId =
                paymentLink.data.id;

            savedAttempt.outcome = "PENDING";
            savedAttempt.outcomeDetails =
                "Razorpay Payment Link created; awaiting customer payment.";
        }

        savedAttempt.paymentLinkId =
            paymentLinkId;

        await Event.findOneAndUpdate(
            { _id: event._id },
            { status: savedAttempt.outcome },
            { returnDocument: "after" }
        );

        await savedAttempt.save();
    }

    return savedAttempt;
};

export default executeRecovery;