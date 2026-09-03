import Event from "../models/Event.js";
import getCustomerHistory from "./contextService.js";
import { calculateRiskScore } from "./riskScore.js";
import { analyzeEvent, updateAnalysisPolicy } from "./analysisService.js";
import evaluatePolicy from "./policyService.js";
import executeRecovery from "./recoveryService.js";
import { getRecoveryRecommendation } from "./ai/geminiService.js";
import deterministicAnalysisService from "./deterministicAnalysisServices.js";


const processEvent = async (eventData,
    analysisProvider = getRecoveryRecommendation
) => {
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

    let analysisResult;
    try {
        analysisResult = await analysisProvider(
            newEvent,
            context,
            risk
        );
    }
    catch (error) {
        analysisResult = deterministicAnalysisService(newEvent);
    }

    const analysis = await analyzeEvent(
        newEvent,
        analysisResult,
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

    await updateAnalysisPolicy(analysis._id, policy);

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