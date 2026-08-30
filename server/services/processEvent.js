import Event from "../models/Event.js";
import getCustomerHistory from "./contextService.js";
import { calculateRiskScore } from "./riskScore.js";
import analyzeEvent from "./analysisService.js";
import evaluatePolicy from "./policyService.js";
import executeRecovery from "./recoveryService.js";
const processEvent = async (eventData) => {
    const newEvent = new Event(eventData);
    await newEvent.save();

    const context = await getCustomerHistory(
        newEvent.customerId,
        newEvent._id
    );

    // Non-failed events don't need recovery analysis
    if (newEvent.status !== "FAILED") {
        return {
            event: newEvent,
            context
        };
    }

    const risk = calculateRiskScore(
        context.successfulPayments,
        context.totalPayments,
        context.recoveryAttempts + 1,
        newEvent.errorCode
    );

    const analysis = await analyzeEvent(
        newEvent,
        context,
        risk
    );

    const policy = evaluatePolicy(
        risk.riskScore,
        risk.riskBand,
        analysis.recommendation,
        analysis.confidence,
        context.recoveryAttempts + 1,
        newEvent.paymentAmount
    );

    let recoveryAttempt;

    if (policy.decision === "APPROVED") {
        recoveryAttempt = await executeRecovery(
            newEvent,
            analysis
        );
    }
    const finalEvent = await Event.findById(newEvent._id);

    return {
        event: finalEvent,
        context,
        risk,
        analysis,
        policy,
        recoveryAttempt
    };
};
export default processEvent;