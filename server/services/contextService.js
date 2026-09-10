import Event from "../models/Event.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getCustomerHistory = async (customerId, currentEventId, userId) => {
    const historicalEvents = await Event.find({
        user: userId,
        customerId,
        _id: { $ne: currentEventId }
    });

    // Count successful and failed payments
    const successfulPayments = historicalEvents.filter(
        event => event.status === "SUCCESS"
    ).length;

    const failedPayments = historicalEvents.filter(
        event => event.status === "FAILED"
    ).length;

    const totalPayments = historicalEvents.length;

    // Count recovery attempts for the current event
    const recoveryAttempts = await RecoveryAttempt.countDocuments({
        event: currentEventId
    });

    return {
        successfulPayments,
        failedPayments,
        totalPayments,
        recoveryAttempts
    };
};

export default getCustomerHistory;