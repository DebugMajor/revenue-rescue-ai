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

            {/* Transaction */}
            <div>
                <h2>Transaction</h2>

                <div>
                    <h3>Payment Amount</h3>
                    <p>₹{event.paymentAmount}</p>
                </div>

                <div>
                    <h3>Error Code</h3>
                    <p>{event.errorCode}</p>
                </div>

                <div>
                    <h3>Attempt Number</h3>
                    <p>{event.attemptNumber}</p>
                </div>
            </div>

            {/* AI Analysis */}
            <div>
                <h2>AI Analysis</h2>

                <div>
                    <h3>Recommendation</h3>
                    <p>{analysis.recommendation}</p>
                </div>

                <div>
                    <h3>Confidence</h3>
                    <p>{analysis.confidence * 100}%</p>
                </div>

                <div>
                    <h3>Source</h3>
                    <p>{analysis.source}</p>
                </div>

                <div>
                    <h3>Analysis Summary</h3>
                    <p>{analysis.analysisSummary}</p>
                </div>

                <div>
                    <h3>Reasoning</h3>
                    <p>{analysis.reasoning}</p>
                </div>
            </div>

            {/* Risk */}
            <div>
                <h2>Risk</h2>

                <div>
                    <h3>Risk Score</h3>
                    <p>{risk.riskScore}</p>
                </div>

                <div>
                    <h3>Risk Band</h3>
                    <p>{risk.riskBand}</p>
                </div>
            </div>

            {/* Policy */}
            <div>
                <h2>Policy</h2>

                <div>
                    <h3>Decision</h3>
                    <p>{policy.decision}</p>
                </div>

                <div>
                    <h3>Reason</h3>
                    <p>{policy.reason}</p>
                </div>
            </div>

            {/* Recovery */}
            <div>
                <h2>Recovery</h2>

                <div>
                    <h3>Action</h3>
                    <p>{recoveryAttempt?.action || "None"}</p>
                </div>

                <div>
                    <h3>Outcome</h3>
                    <p>{recoveryAttempt?.outcome || "None"}</p>
                </div>
            </div>

        </section>
    );
}

export default AnalysisResult;