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

    return {
        event: newEvent,
        context,
        risk,
        analysis,
        policy,
        recoveryAttempt
    };
};

export default processEvent;