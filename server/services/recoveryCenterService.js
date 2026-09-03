import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getRecoveryQueue = async () => {
    const data = await RecoveryAttempt.find({
        outcome: "PENDING"
    }).populate("event").populate("analysis")

    return data;
}


export default getRecoveryQueue;