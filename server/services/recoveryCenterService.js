import Event from "../models/Event.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getRecoveryQueue = async (userId) => {
    const events = await Event.find({
        user: userId
    }).select("_id");

    const eventIds = events.map((event) => event._id);

    const data = await RecoveryAttempt.find({
        outcome: "PENDING",
        event: { $in: eventIds }
    })
        .populate("event")
        .populate("analysis");

    return data;
};

export default getRecoveryQueue;