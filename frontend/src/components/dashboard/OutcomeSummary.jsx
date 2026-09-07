import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

const OUTCOME_CONFIG = [
    { key: "APPROVED", label: "Approved", accent: "success", sampled: true },
    { key: "PENDING", label: "Pending", accent: "warning", sampled: false },
    { key: "ESCALATED", label: "Escalated", accent: "blue", sampled: true },
    { key: "BLOCKED", label: "Blocked", accent: "danger", sampled: true }
];

function OutcomeSummary({ intelligence, loading, error }) {
    if (error) {
        return <ErrorState title="Unable to load outcome summary" message={error} />;
    }

    if (loading || intelligence == null) {
        return <LoadingState label="Loading outcome summary…" />;
    }

    const counts = {
        APPROVED: intelligence.policyCounts.APPROVED,
        PENDING: intelligence.pendingCount,
        ESCALATED: intelligence.policyCounts.ESCALATED,
        BLOCKED: intelligence.policyCounts.BLOCKED
    };

    return (
        <div className="rr-outcome-strip rr-reveal">
            {OUTCOME_CONFIG.map((item) => (
                <div className="rr-outcome-pill" key={item.key}>
                    <span className={`rr-outcome-dot rr-outcome-dot--${item.accent}`} />
                    <div className="rr-outcome-meta">
                        <div className="rr-outcome-label">{item.label}</div>
                        <div className="rr-outcome-value rr-num">{counts[item.key]}</div>
                    </div>
                </div>
            ))}
            <div className="rr-outcome-note">
                Approved / Escalated / Blocked reflect the last{" "}
                {intelligence.sampleSize} governed decision
                {intelligence.sampleSize === 1 ? "" : "s"}. Pending reflects the
                live recovery queue.
            </div>
        </div>
    );
}

export default OutcomeSummary;