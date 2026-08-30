const getPriorSuccessRate = (successfulPayments, totalPayments) => {
    if (totalPayments === 0)
        return 0.5;

    return successfulPayments / totalPayments;
}

const getAttemptFactor = (recoveryAttempts) => {
    if (recoveryAttempts === 1)
        return 1.0;
    else if (recoveryAttempts === 2)
        return 0.6;
    else if (recoveryAttempts === 3)
        return 0.3;
    else
        return 0.1;
}

const getErrorFactor = (errorCode) => {
    if (errorCode === "NETWORK_ERROR")
        return 0.5;
    if (errorCode === "TIMEOUT")
        return 0.6;
    if (errorCode === "INSUFFICIENT_FUNDS")
        return 0.3;
    if (errorCode === "CARD_DECLINED")
        return 0.4;
    if (errorCode === "UNKNOWN_ERROR")
        return 0.1;
    return 0.1; //Any other error
}

const getRiskBand = (score) => {
    if (score >= 0.7)
        return "LOW";
    if (score >= 0.4)
        return "MEDIUM";
    return "HIGH";
};

const calculateRiskScore = (successfulPayments, totalPayments, recoveryAttempts, errorCode) => {
    const priorSuccessRate = getPriorSuccessRate(successfulPayments, totalPayments);
    const attemptFactor = getAttemptFactor(recoveryAttempts);
    const errorFactor = getErrorFactor(errorCode);

    const score = (0.4 * priorSuccessRate) + (0.3 * attemptFactor) + (0.3 * errorFactor);
    const band = getRiskBand(score);
    return { riskScore: Number(score.toFixed(2)), riskBand: band };
}

export { calculateRiskScore, getRiskBand };