import Analysis from "../models/RecoveryAnalysis.js";

const analyzeEvent = async (event, analysisResult) => {
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
        reasoning: analysisResult.reasoning
    });

    const savedAnalysis = await newAnalysis.save();

    return savedAnalysis;
};

export default analyzeEvent;