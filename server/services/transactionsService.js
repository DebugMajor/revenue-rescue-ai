import Event from "../models/Event.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getTransaction = async (id) => {
    const event = await Event.findOne({
        eventId: id
    });

    if (event === null) {
        return {
            message: "NOT FOUND"
        };
    }

    const attempts = await RecoveryAttempt.find({
        event: event._id
    }).populate("analysis");

    return {
        event,
        attempts
    };
};

const getTransactions = async () => {
    const data = await Event.find()
        .sort({ timestamp: -1 })
        .limit(10);

    return data;
};

export { getTransaction, getTransactions };