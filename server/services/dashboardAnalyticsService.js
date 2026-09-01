import Event from "../models/Event.js";
import recoveryAnalyticsService from "./recoveryAnalyticsService.js";

const ELIGIBLE_ACTIONS = [
    "RETRY_NOW",
    "SEND_PAYMENT_LINK",
    "WAIT_AND_RETRY"
];

const getDashboardMetrics = async (eventIds = null) => {

    const failedMatch = { status: "FAILED" };
    const recoveredMatch = { status: "RECOVERED" };

    if (eventIds && eventIds.length > 0) {
        failedMatch._id = { $in: eventIds };
        recoveredMatch._id = { $in: eventIds };
    }

    const failedEvents = await Event.countDocuments(failedMatch);

    const recoveredEvents = await Event.countDocuments(recoveredMatch);

    const recoveryResult =
        await recoveryAnalyticsService.getRecoveryRate(eventIds);

    const failedEventAnalysis = await Event.aggregate([
        {
            $match: failedMatch
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
            const recommendation = record.analysis?.recommendation;
            const errorCode = record.errorCode;
            const paymentAmount = Number(record.paymentAmount) || 0;

            if (ELIGIBLE_ACTIONS.includes(recommendation) && errorCode) {
                const probResult =
                    await recoveryAnalyticsService.getHistoricalRecoveryProbability(
                        recommendation,
                        errorCode,
                        eventIds
                    );

                const probability = probResult?.recoveryProbability || 0;
                expectedRecoveryValue += paymentAmount * probability;
            }
        } catch (err) {
            console.error(
                "Error calculating EV for event:",
                record._id,
                err.message
            );
        }
    }

    return {
        failedPayments: failedEvents,
        recoveredPayments: recoveredEvents,
        recoveryRate: recoveryResult.recoveryRate,
        expectedRecoveryValue
    };
};

export default getDashboardMetrics;