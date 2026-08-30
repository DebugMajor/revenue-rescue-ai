const ALLOWED_RECOMMENDATIONS = [
    "RETRY_NOW",
    "WAIT_AND_RETRY",
    "SEND_PAYMENT_LINK",
    "HUMAN_REVIEW",
    "DO_NOT_RETRY"
];

const isValidConfidence = (confidence) => {
    return (
        typeof confidence === "number" &&
        confidence >= 0 &&
        confidence <= 1
    );
};

export {
    ALLOWED_RECOMMENDATIONS,
    isValidConfidence
};