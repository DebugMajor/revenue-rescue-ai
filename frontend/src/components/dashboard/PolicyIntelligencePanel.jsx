import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

const REASON_LABELS = {
    HIGH_RISK: "High Risk",
    HIGH_VALUE: "High Value",
    MAX_ATTEMPTS: "Max Attempts",
    LOW_CONFIDENCE: "Low Confidence",
    OTHER: "Other"
};

function PolicyIntelligencePanel({ intelligence, loading, error }) {
    if (error) {
        return <ErrorState title="Unable to load policy intelligence" message={error} />;
    }

    if (loading || intelligence == null) {
        return <LoadingState label="Loading policy intelligence…" />;
    }

    const { reasonCounts, policyCounts, sampleSize } = intelligence;
    const totalReasons = Object.values(reasonCounts).reduce((sum, n) => sum + n, 0);

    if (sampleSize === 0) {
        return (
            <EmptyState
                title="Nothing to analyze yet"
                message="Policy reasons appear once the engine has evaluated failed payments."
            />
        );
    }

    if (totalReasons === 0) {
        return (
            <EmptyState
                title="No holds in recent decisions"
                message={`All ${sampleSize} recent governed decision${sampleSize === 1 ? " was" : "s were"} approved for automatic execution — nothing has been escalated or blocked.`}
            />
        );
    }

    const maxCount = Math.max(...Object.values(reasonCounts));

    return (
        <div className="rr-policy-panel rr-reveal">
            <div className="rr-policy-note">
                {policyCounts.ESCALATED + policyCounts.BLOCKED} of {sampleSize} recent decisions
                were held back from automatic execution — here's why.
            </div>
            {Object.entries(reasonCounts)
                .filter(([, count]) => count > 0)
                .map(([key, count]) => (
                    <div className="rr-policy-row" key={key}>
                        <span className="rr-policy-label">{REASON_LABELS[key]}</span>
                        <div className="rr-policy-bar-track">
                            <div
                                className="rr-policy-bar-fill"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                        </div>
                        <span className="rr-policy-count rr-num">{count}</span>
                    </div>
                ))}
        </div>
    );
}

export default PolicyIntelligencePanel;