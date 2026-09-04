import mongoose from "mongoose";
import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getRecoveryRate = async (userId, eventIds = null) => {
    const matchStage = {
        outcome: {
            $in: ["RECOVERED", "FAILED"]
        }
    };

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
            $match: {
                "eventData.user": new mongoose.Types.ObjectId(userId)
            }
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
    userId,
    eventIds = null
) => {
    const matchStage = {
        action,
        outcome: {
            $in: ["RECOVERED", "FAILED"]
        }
    };

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
            $match: {
                "eventData.user": new mongoose.Types.ObjectId(userId),
                "eventData.errorCode": errorCode
            }
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

const getExpectedRecoveryValue = async (
    paymentAmount,
    action,
    errorCode,
    userId,
    eventIds = null
) => {
    const probabilityResult =
        await getHistoricalRecoveryProbability(
            action,
            errorCode,
            userId,
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

const getRecoveryByAction = async (userId) => {
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
            $match: {
                "eventData.user": new mongoose.Types.ObjectId(userId)
            }
        },
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
    ]);

    return result;
};

const getRecoveryByError = async (userId) => {
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
            $match: {
                "eventData.user": new mongoose.Types.ObjectId(userId)
            }
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

const getRecoveryTrend = async (userId) => {
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
            $match: {
                "eventData.user": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
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
                date: "$_id.date",
                outcome: "$_id.outcome",
                count: 1
            }
        },
        {
            $sort: {
                date: 1,
                outcome: 1
            }
        }
    ]);

    return result;
};

const getRecoveryBySource = async (userId) => {
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
            $match: {
                "eventData.user": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "analyses",
                localField: "analysis",
                foreignField: "_id",
                as: "analysisData"
            }
        },
        {
            $unwind: "$analysisData"
        },
        {
            $group: {
                _id: {
                    source: "$analysisData.source",
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
                source: "$_id.source",
                outcome: "$_id.outcome",
                count: 1
            }
        },
        {
            $sort: {
                source: 1,
                outcome: 1
            }
        }
    ]);

    return result;
};

export default {
    getRecoveryRate,
    getHistoricalRecoveryProbability,
    getExpectedRecoveryValue,
    getRecoveryByAction,
    getRecoveryByError,
    getRecoveryTrend,
    getRecoveryBySource
};