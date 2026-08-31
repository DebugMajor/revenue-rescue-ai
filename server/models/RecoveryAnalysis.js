import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        analysisNumber: {
            type: Number,
            required: true
        },

        analysisSummary: {
            type: String,
            required: true
        },

        recommendation: {
            type: String,
            enum: [
                "RETRY_NOW",
                "WAIT_AND_RETRY",
                "SEND_PAYMENT_LINK",
                "HUMAN_REVIEW",
                "DO_NOT_RETRY"
            ],
            required: true
        },

        confidence: {
            type: Number,
            required: true
        },

        reasoning: {
            type: String,
            required: true
        },
        source: {
            type: String,
            num: [
                "GEMINI",
                "DETERMINISTIC_FALLBACK"
            ],
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;