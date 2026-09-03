import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getRecoveryRate = async (eventIds = null) => {

    // Build the MongoDB filter dynamically.
    const matchStage = {
        outcome: {
            $in: ["RECOVERED", "FAILED"]
        }
    };

    // Restrict calculation to specific events when provided.
    if (eventIds && eventIds.length > 0) {
        matchStage.event = {
            $in: eventIds
        };
    }

    const result = await RecoveryAttempt.aggregate([
        {
            $match: matchStage
        },

        {
            $group: {
                _id: null,

                recoveredAttempts: {
                    $sum: {
                        $cond: [
                            { $eq: ["$outcome", "RECOVERED"] },
                            1,
                            0
                        ]
                    }
                },

                failedAttempts: {
                    $sum: {
                        $cond: [
                            { $eq: ["$outcome", "FAILED"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const stats = result[0] || {
        recoveredAttempts: 0,
        failedAttempts: 0
    };

    const recoveredAttempts = stats.recoveredAttempts;
    const failedAttempts = stats.failedAttempts;

    const completedAttempts =
        recoveredAttempts + failedAttempts;

    const recoveryRate =
        completedAttempts === 0
            ? 0
            : recoveredAttempts / completedAttempts;

    return {
        recoveredAttempts,
        failedAttempts,
        recoveryRate
    };
};


const getHistoricalRecoveryProbability = async (
    action,
    errorCode,
    eventIds = null
) => {

    // Build the initial MongoDB filter.
    const matchStage = {
        action,
        outcome: {
            $in: ["RECOVERED", "FAILED"]
        }
    };

    // Restrict calculation to specific events when provided.
    if (eventIds && eventIds.length > 0) {
        matchStage.event = {
            $in: eventIds
        };
    }

    const result = await RecoveryAttempt.aggregate([

        // 1. Match recovery action and completed outcomes.
        {
            $match: matchStage
        },

        // 2. Join RecoveryAttempt with Event.
        {
            $lookup: {
                from: "events",
                localField: "event",
                foreignField: "_id",
                as: "eventData"
            }
        },

        // 3. Convert eventData array into a single document.
        {
            $unwind: "$eventData"
        },

        // 4. Match the requested payment error.
        {
            $match: {
                "eventData.errorCode": errorCode
            }
        },

        // 5. Count recovered and failed attempts.
        {
            $group: {
                _id: null,

                recoveredAttempts: {
                    $sum: {
                        $cond: [
                            { $eq: ["$outcome", "RECOVERED"] },
                            1,
                            0
                        ]
                    }
                },

                failedAttempts: {
                    $sum: {
                        $cond: [
                            { $eq: ["$outcome", "FAILED"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const stats = result[0] || {
        recoveredAttempts: 0,
        failedAttempts: 0
    };

    const recoveredAttempts = stats.recoveredAttempts;
    const failedAttempts = stats.failedAttempts;

    const completedAttempts =
        recoveredAttempts + failedAttempts;

    const recoveryProbability =
        completedAttempts === 0
            ? 0
            : recoveredAttempts / completedAttempts;

    return {
        action,
        errorCode,
        recoveredAttempts,
        failedAttempts,
        completedAttempts,
        recoveryProbability
    };
};

const getRecoveryByAction = async () => {
    const result = await RecoveryAttempt.aggregate([
        {
            $group: {
                _id: {
                    action: "$action",
                    outcome: "$outcome"
                },
                count: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                action: "$_id.action",
                outcome: "$_id.outcome",
                count: 1
            }
        },
        {
            $sort: {
                action: 1,
                outcome: 1
            }
        }
    ])
    return result;
}

//Recovery by error
// Recovery by error
const getRecoveryByError = async () => {
    const result = await RecoveryAttempt.aggregate([
        {
            $lookup: {
                from: "events",
                localField: "event",
                foreignField: "_id",
                as: "eventData"
            }
        },
        {
            $unwind: "$eventData"
        },
        {
            $group: {
                _id: {
                    errorCode: "$eventData.errorCode",
                    outcome: "$outcome"
                },
                count: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                errorCode: "$_id.errorCode",
                outcome: "$_id.outcome",
                count: 1
            }
        },
        {
            $sort: {
                errorCode: 1,
                outcome: 1
            }
        }
    ]);

    return result;
};

const getExpectedRecoveryValue = async (
    paymentAmount,
    action,
    errorCode,
    eventIds = null
) => {

    const probabilityResult =
        await getHistoricalRecoveryProbability(
            action,
            errorCode,
            eventIds
        );

    const expectedRecoveryValue =
        paymentAmount *
        probabilityResult.recoveryProbability;

    return {
        paymentAmount,
        action,
        errorCode,
        recoveredAttempts: probabilityResult.recoveredAttempts,
        failedAttempts: probabilityResult.failedAttempts,
        completedAttempts: probabilityResult.completedAttempts,
        recoveryProbability: probabilityResult.recoveryProbability,
        expectedRecoveryValue
    };

};


export default {
    getRecoveryRate,
    getHistoricalRecoveryProbability,
    getExpectedRecoveryValue,
    getRecoveryByAction,
    getRecoveryByError
};