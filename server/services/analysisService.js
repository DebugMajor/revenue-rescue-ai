import Analysis from "../models/RecoveryAnalysis.js";

const analyzeEvent = async (event, analysisResult, context, risk) => {
    if (event.status !== "FAILED") {
        return;
    }

    const existingAnalyses = await Analysis.countDocuments({
        event: event._id
    });

    const analysisNumber = existingAnalyses + 1;

    const newAnalysis = new Analysis({
        event: event._id,
        analysisNumber,
        analysisSummary: analysisResult.analysisSummary,
        recommendation: analysisResult.recommendation,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        source: analysisResult.source,
        customerContext: context,
        riskAssessment: risk
    });

    const savedAnalysis = await newAnalysis.save();

    return savedAnalysis;
};

const updateAnalysisPolicy = async (analysisId, policy) => {
    const updatedAnalysis = await Analysis.findByIdAndUpdate(
        analysisId,
        {
            policyDecision: policy.decision,
            policyReason: policy.reason
        },
        { new: true }
    );

    return updatedAnalysis;
};


export { analyzeEvent, updateAnalysisPolicy };
