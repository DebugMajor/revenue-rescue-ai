const evaluatePolicy = (riskScore, riskBand, recommendation, confidence, recoveryAttemptNumber, paymentAmount) => {
    //Hard Block
    if (recommendation === "DO_NOT_RETRY") {
        return {
            decision: "BLOCKED",
            reason: "Recovery action is explicitly prohibited."
        }
    }

    //Max Recovery Attempts
    if (recoveryAttemptNumber > 3) {
        return {
            decision: "BLOCKED",
            reason: "Maximum automatic recovery attempts exceeded."
        }
    }

    //Escalation Rule
    if (recommendation === "HUMAN_REVIEW") {
        return {
            decision: "ESCALATED",
            reason: "Human review is required for this recovery decision."
        };
    }

    //High risk escalation
    if (riskBand === "HIGH") {
        return {
            decision: "ESCALATED",
            reason: "High-risk recovery requires human review."
        };
    }

    //Low confidence escalation
    if (confidence < 0.60) {
        return {
            decision: "ESCALATED",
            reason: "Confidence is below the minimum threshold for automatic recovery."
        };
    }

    if (paymentAmount >= 100000) {
        return {
            decision: "ESCALATED",
            reason: "Transaction amount higher than threshold."
        };
    }

    if (recommendation === "RETRY_NOW" || recommendation === "WAIT_AND_RETRY" || recommendation === "SEND_PAYMENT_LINK") {
        return {
            decision: "APPROVED",
            reason: "Recovery action passed all automatic execution policy checks."
        };
    }
    return {
        decision: "BLOCKED",
        reason: "Recovery action is not supported for automatic execution."
    };
}

export default evaluatePolicy;