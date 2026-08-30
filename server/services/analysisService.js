import Analysis from "../models/RecoveryAnalysis.js";

const analyzeEvent = async (event, context, risk) => {
    if (event.status !== "FAILED") {
        return;
    }

    //History lookup
    const existingAnalyses = await Analysis.countDocuments({
        event: event._id
    });
    const analysisNumber = existingAnalyses + 1;

    //Analysis outputs
    let recommendation;
    let confidence;
    let analysisSummary;
    let reasoning;

    //Dealing with vairous errors
    if (event.errorCode === "NETWORK_ERROR") {
        recommendation = "RETRY_NOW";
        confidence = 0.80;
        analysisSummary = "Payment failed due to a network-related error.";
        reasoning = "Network failures are often temporary, so retrying the payment may succeed.";
    }
    else if (event.errorCode === "INSUFFICIENT_FUNDS") {
        recommendation = "SEND_PAYMENT_LINK";
        confidence = 0.70;
        analysisSummary = "Payment failed because the customer has insufficient funds.";
        reasoning = "An immediate retry is unlikely to succeed, so providing an alternative payment option may improve the recovery chance.";
    }
    else {
        recommendation = "HUMAN_REVIEW";
        confidence = 0.40;
        analysisSummary = "The payment failed with an error that is not handled by the current recovery rules.";
        reasoning = "The system does not have enough predefined information to safely select an automated recovery action, so human review is required.";
    }
    const newAnalysis = new Analysis({
        event: event._id,
        analysisNumber,
        analysisSummary,
        recommendation,
        confidence,
        reasoning
    });
    const savedAnalysis = await newAnalysis.save();
    return savedAnalysis;
};
export default analyzeEvent;