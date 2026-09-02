import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        analysis: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Analysis",
            required: true
        },

        recoveryAttemptNumber: {
            type: Number,
            required: true
        },

        action: {
            type: String,
            required: true,
            enum: [
                "RETRY_NOW",
                "WAIT_AND_RETRY",
                "SEND_PAYMENT_LINK"
            ]
        },

        outcome: {
            type: String,
            required: true,
            enum: [
                "PENDING",
                "FAILED",
                "RECOVERED"
            ]
        },

        outcomeDetails: String,

        paymentLinkId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        }
    },
    { timestamps: true }
);

const RecoveryAttempt = mongoose.model("RecoveryAttempt", attemptSchema);

export default RecoveryAttempt;