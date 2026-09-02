import RecoveryAttempt from "../models/RecoveryAttempt.js";
import Event from "../models/Event.js";

const processDeferredRecoveries = async () => {
    const attempts = await RecoveryAttempt.find({
        action: "WAIT_AND_RETRY",
        outcome: "PENDING",
        nextRetryAt: {
            $lte: new Date()
        }
    }).populate("event");

    for (const attempt of attempts) {
        const event = attempt.event;

        if (!event) {
            continue;
        }

        if (event.errorCode === "NETWORK_ERROR") {
            attempt.outcome = "RECOVERED";
            attempt.outcomeDetails =
                "Deferred payment retry succeeded after the temporary network failure.";

            await Event.findOneAndUpdate(
                { _id: event._id },
                { status: "RECOVERED" }
            );
        } else {
            attempt.outcome = "FAILED";
            attempt.outcomeDetails =
                "Deferred payment retry did not resolve the payment failure.";

            await Event.findOneAndUpdate(
                { _id: event._id },
                { status: "FAILED" }
            );
        }

        attempt.nextRetryAt = undefined;

        await attempt.save();
    }
};

export default processDeferredRecoveries;