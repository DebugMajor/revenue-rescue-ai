import Event from "../models/Event.js";
import recoveryAnalyticsService from "./recoveryAnalyticsService.js";
import mongoose from "mongoose";

const ELIGIBLE_ACTIONS = [
    "RETRY_NOW",
    "SEND_PAYMENT_LINK",
    "WAIT_AND_RETRY"
];

const getDashboardMetrics = async (userId, eventIds = null) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const recoveryResult =
        await recoveryAnalyticsService.getRecoveryRate(
            userId,
            eventIds
        );

    const failedEventMatch = {
        status: "FAILED",
        user: userObjectId,
        ...(eventIds && eventIds.length > 0
            ? { _id: { $in: eventIds } }
            : {})
    };

    const failedPayments =
        await Event.countDocuments(failedEventMatch);

    const failedEventAnalysis = await Event.aggregate([
        {
            $match: failedEventMatch
        },
        {
            $lookup: {
                from: "analyses",
                let: {
                    eventId: "$_id"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$event", "$$eventId"]
                            }
                        }
                    },
                    {
                        $sort: {
                            analysisNumber: -1
                        }
                    },
                    {
                        $limit: 1
                    }
                ],
                as: "analysis"
            }
        },
        {
            $unwind: "$analysis"
        }
    ]);

    let expectedRecoveryValue = 0;

    for (const record of failedEventAnalysis) {
        try {
            const recommendation =
                record.analysis?.recommendation;

            const errorCode = record.errorCode;

            const paymentAmount =
                Number(record.paymentAmount) || 0;

            if (
                ELIGIBLE_ACTIONS.includes(recommendation) &&
                errorCode
            ) {
                const probResult =
                    await recoveryAnalyticsService.getHistoricalRecoveryProbability(
                        recommendation,
                        errorCode,
                        userId,
                        eventIds
                    );

                const probability =
                    probResult?.recoveryProbability || 0;

                expectedRecoveryValue +=
                    paymentAmount * probability;
            }
        }
        catch (err) {
            console.error(
                "Error calculating EV for event:",
                record._id,
                err.message
            );
        }
    }

    return {
        failedPayments,
        recoveredPayments:
            recoveryResult.recoveredAttempts,
        recoveryRate:
            recoveryResult.recoveryRate,
        expectedRecoveryValue
    };
};

export default getDashboardMetrics;