import Event from "../models/Event.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";
import Analysis from "../models/RecoveryAnalysis.js";

const getTransaction = async (id, userId) => {
    const event = await Event.findOne({
        eventId: id,
        user: userId
    });

    if (event === null) {
        return {
            message: "NOT FOUND"
        };
    }

    const attempts = await RecoveryAttempt.find({
        event: event._id
    })
        .populate("analysis");

    const analysis = await Analysis.findOne({
        event: event._id
    }).sort({
        analysisNumber: -1
    });

    return {
        event,
        analysis,
        attempts
    };
};

const getTransactions = async (userId) => {
    const data = await Event.find({
        user: userId
    })
        .sort({ timestamp: -1 })
        .limit(10);

    return data;
};

export {
    getTransaction,
    getTransactions
};