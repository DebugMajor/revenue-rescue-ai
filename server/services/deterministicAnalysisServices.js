const deterministicAnalysisService = (event) => {
    if (event.status !== "FAILED" && event.status !== "CHECKOUT_ABANDONED") {
        return;
    }

    let recommendation;
    let confidence;
    let analysisSummary;
    let reasoning;
    const source = "DETERMINISTIC_FALLBACK";
    // if else rules

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
    else if (event.eventType === "CHECKOUT_ABANDONED") {
        recommendation = "RECOVERY_REMINDER";
        confidence = 0.80;
        analysisSummary = "Checkout was abandoned before the payment was completed.";
        reasoning = "A recovery reminder can re-engage the customer without retrying the payment automatically.";
    }
    else {
        recommendation = "HUMAN_REVIEW";
        confidence = 0.40;
        analysisSummary = "The payment failed with an error that is not handled by the current recovery rules.";
        reasoning = "The system does not have enough predefined information to safely select an automated recovery action, so human review is required.";
    }


    return {
        analysisSummary,
        recommendation,
        confidence,
        reasoning,
        source
    };
};

export default deterministicAnalysisService;