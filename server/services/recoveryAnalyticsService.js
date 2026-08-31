import RecoveryAttempt from "../models/RecoveryAttempt.js";

const getRecoveryRate = async (eventIds = null) => {

    // Build the MongoDB filter dynamically
    const matchStage = {
        outcome: {
            $in: ["RECOVERED", "FAILED"]
        }
    };

    // If event IDs are provided, restrict the calculation
    // to those events only.
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

export default getRecoveryRate;