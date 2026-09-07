//Analysis for a single transaction

function AnalysisResult({ result }) {
    const {
        event,
        risk,
        analysis,
        policy,
        recoveryAttempt
    } = result;

    return (
        <section>

            {/* Transaction Details */}
            <div>
                <h2>Transaction</h2>

                <p>
                    <strong>Payment Amount:</strong>{" "}
                    ₹{event.paymentAmount}
                </p>

                <p>
                    <strong>Error Code:</strong>{" "}
                    {event.errorCode}
                </p>

                <p>
                    <strong>Attempt Number:</strong>{" "}
                    {event.attemptNumber}
                </p>
            </div>

            {/* AI Analysis */}
            <div>
                <h2>AI Analysis</h2>

                <p>
                    <strong>Recommendation:</strong>{" "}
                    {analysis.recommendation}
                </p>

                <p>
                    <strong>Confidence:</strong>{" "}
                    {analysis.confidence * 100}%
                </p>

                <p>
                    <strong>Source:</strong>{" "}
                    {analysis.source}
                </p>

                <p>
                    <strong>Analysis Summary:</strong>{" "}
                    {analysis.analysisSummary}
                </p>

                <p>
                    <strong>Reasoning:</strong>{" "}
                    {analysis.reasoning}
                </p>
            </div>

            {/* Risk Assessment */}
            <div>
                <h2>Risk</h2>

                <p>
                    <strong>Risk Score:</strong>{" "}
                    {risk.riskScore}
                </p>

                <p>
                    <strong>Risk Band:</strong>{" "}
                    {risk.riskBand}
                </p>
            </div>

            {/* Policy Decision */}
            <div>
                <h2>Policy</h2>

                <p>
                    <strong>Decision:</strong>{" "}
                    {policy.decision}
                </p>

                <p>
                    <strong>Reason:</strong>{" "}
                    {policy.reason}
                </p>
            </div>

            {/* Recovery Result */}
            <div>
                <h2>Recovery</h2>

                <p>
                    <strong>Action:</strong>{" "}
                    {recoveryAttempt?.action || "None"}
                </p>

                <p>
                    <strong>Outcome:</strong>{" "}
                    {recoveryAttempt?.outcome || "None"}
                </p>
            </div>

        </section>
    );
}

export default AnalysisResult;