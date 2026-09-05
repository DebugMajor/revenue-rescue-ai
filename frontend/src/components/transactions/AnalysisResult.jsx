import StatusBadge from "../common/StatusBadge";


function AnalysisResult({ result }) {
    const {
        event,
        risk,
        analysis,
        policy,
        recoveryAttempt
    } = result;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
                <div className="rr-trace-label">TRANSACTION</div>
                <div className="rr-trace-content">
                    <div className="rr-kv-row">
                        <span className="k">Payment Amount</span>
                        <span className="v rr-num">₹{event.paymentAmount}</span>
                    </div>
                    <div className="rr-kv-row">
                        <span className="k">Error Code</span>
                        <span className="v">{event.errorCode}</span>
                    </div>
                    <div className="rr-kv-row">
                        <span className="k">Attempt Number</span>
                        <span className="v rr-num">{event.attemptNumber}</span>
                    </div>
                </div>
            </div>

            {analysis && (
                <div>
                    <div className="rr-trace-label">AI ANALYSIS</div>
                    <div className="rr-trace-content rr-trace-content--ai">
                        <div className="rr-kv-row">
                            <span className="k">Recommendation</span>
                            <span className="v"><StatusBadge status={analysis.recommendation} /></span>
                        </div>
                        <div className="rr-kv-row">
                            <span className="k">Confidence</span>
                            <span className="v rr-num">{Math.round(analysis.confidence * 100)}%</span>
                        </div>
                        <div className="rr-kv-row">
                            <span className="k">Source</span>
                            <span className="v"><StatusBadge status={analysis.source} /></span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <div className="k" style={{ marginBottom: 3 }}>Analysis Summary</div>
                            <p style={{ color: "var(--rr-text-dim)" }}>{analysis.analysisSummary}</p>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <div className="k" style={{ marginBottom: 3 }}>Reasoning</div>
                            <p style={{ color: "var(--rr-text-dim)" }}>{analysis.reasoning}</p>
                        </div>
                    </div>
                </div>
            )}

            {risk && (
                <div>
                    <div className="rr-trace-label">RISK ASSESSMENT</div>
                    <div className="rr-trace-content rr-trace-content--risk">
                        <div className="rr-kv-row">
                            <span className="k">Risk Score</span>
                            <span className="v rr-num">{risk.riskScore}</span>
                        </div>
                        <div className="rr-kv-row">
                            <span className="k">Risk Band</span>
                            <span className="v"><StatusBadge status={risk.riskBand} /></span>
                        </div>
                    </div>
                </div>
            )}

            {policy && (
                <div>
                    <div className="rr-trace-label">POLICY DECISION</div>
                    <div className="rr-trace-content rr-trace-content--policy">
                        <div className="rr-kv-row">
                            <span className="k">Decision</span>
                            <span className="v"><StatusBadge status={policy.decision} /></span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <div className="k" style={{ marginBottom: 3 }}>Reason</div>
                            <p style={{ color: "var(--rr-text-dim)" }}>{policy.reason}</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <div className="rr-trace-label">RECOVERY</div>
                <div className="rr-trace-content rr-trace-content--recovery">
                    <div className="rr-kv-row">
                        <span className="k">Action</span>
                        <span className="v">{recoveryAttempt?.action || "None"}</span>
                    </div>
                    <div className="rr-kv-row">
                        <span className="k">Outcome</span>
                        <span className="v">
                            {recoveryAttempt?.outcome
                                ? <StatusBadge status={recoveryAttempt.outcome} />
                                : "None"}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default AnalysisResult;
