import RecoveryAttempt from "../models/RecoveryAttempt.js";
import Event from "../models/Event.js";

const executeRecovery = async (event, analysis) => {

    if (analysis.recommendation === "HUMAN_REVIEW" || analysis.recommendation === "DO_NOT_RETRY") {
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
    //Retry logic
    if (analysis.recommendation === "RETRY_NOW") {

        if (event.errorCode === "NETWORK_ERROR") {
            savedAttempt.outcome = "RECOVERED";
            savedAttempt.outcomeDetails =
                "Payment retry succeeded after the temporary network failure.";
            await Event.findOneAndUpdate(
                { _id: event._id },
                { status: "RECOVERED" }
            );
        }
        else {
            savedAttempt.outcome = "FAILED";
            savedAttempt.outcomeDetails =
                "Payment retry did not resolve the payment failure.";
            await Event.findOneAndUpdate(
                { _id: event._id },
                { status: "FAILED" }
            );
        }
        await savedAttempt.save();
    }
    return savedAttempt;
};

export default executeRecovery;