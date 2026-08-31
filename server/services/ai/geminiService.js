import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import {
    ALLOWED_RECOMMENDATIONS,
    isValidConfidence
} from "./aiConstants.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Validation
const validateGeminiResult = (result) => {
    if (!ALLOWED_RECOMMENDATIONS.includes(result.recommendation)) {
        throw new Error("Invalid recommendation returned by Gemini.");
    }

    if (!isValidConfidence(result.confidence)) {
        throw new Error("Invalid confidence returned by Gemini.");
    }

    if (
        typeof result.reasoning !== "string" ||
        result.reasoning.trim().length === 0
    ) {
        throw new Error("Invalid reasoning returned by Gemini.");
    }

    if (
        typeof result.analysisSummary !== "string" || result.analysisSummary.trim().length === 0) {
        throw new Error("Invalid analysis summary returned by GEMINI.");
    }

    return result;
};

const getRecoveryRecommendation = async (event, context, risk) => {

    const input = {
        event: {
            paymentAmount: event.paymentAmount,
            attemptNumber: event.attemptNumber,
            errorCode: event.errorCode
        },

        customerHistory: {
            successfulPayments: context.successfulPayments,
            failedPayments: context.failedPayments,
            totalPayments: context.totalPayments,
            recoveryAttempts: context.recoveryAttempts
        },

        risk: {
            riskScore: risk.riskScore,
            riskBand: risk.riskBand
        }
    };

    const prompt = `
You are a payment recovery analyst for Revenue Rescue AI.

ROLE:
Analyze failed payment events and recommend the most appropriate
recovery action based only on the transaction data, customer history,
and risk assessment provided.

TASK:
1. Analyze the current payment failure.
2. Consider the customer's historical payment and recovery behavior.
3. Consider the provided risk score and risk band.
4. Select the single most appropriate recovery recommendation.
5. Provide a concise summary of what caused the payment failure.

ALLOWED RECOMMENDATIONS:
- RETRY_NOW
- WAIT_AND_RETRY
- SEND_PAYMENT_LINK
- HUMAN_REVIEW
- DO_NOT_RETRY

IMPORTANT CONSTRAINTS:
- You are a recommendation engine only.
- You do NOT execute payments or recovery actions.
- You must NOT invent new recovery actions.
- You must NOT override or bypass the deterministic policy engine.
- Confidence must be a decimal number between 0 and 1.
- Reasoning must be concise and based on the supplied evidence.
- Do not invent facts that are not present in the input.
- Return only the requested structured output.
- analysisSummary must briefly describe the failure.
- reasoning must explain why the recommendation was selected.

INPUT DATA:
${JSON.stringify(input, null, 2)}
`;
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    recommendation: {
                        type: "string",
                        enum: ALLOWED_RECOMMENDATIONS
                    },
                    confidence: {
                        type: "number"
                    },
                    reasoning: {
                        type: "string"
                    },
                    analysisSummary: {
                        type: "string"
                    }

                },
                required: [
                    "recommendation",
                    "confidence",
                    "reasoning",
                    "analysisSummary"
                ]
            }
        }
    });

    const result = JSON.parse(response.text);

    return validateGeminiResult(result);
};

export {
    getRecoveryRecommendation,
    validateGeminiResult
};