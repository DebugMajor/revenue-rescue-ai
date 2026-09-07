import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

function OutcomeSummary({ metrics, recoveryQueue, loading, error }) {
    if (error) {
        return <ErrorState title="Unable to load recovery status" message={error} />;
    }

    if (loading || metrics == null) {
        return <LoadingState label="Loading recovery status…" />;
    }

    const pending = Array.isArray(recoveryQueue)
        ? recoveryQueue.length
        : 0;

    const items = [
        {
            label: "Failed",
            value: metrics.failedPayments || 0,
            detail: "Payments needing recovery",
            tone: "danger"
        },
        {
            label: "Recovered",
            value: metrics.recoveredPayments || 0,
            detail: "Payments recovered",
            tone: "success"
        },
        {
            label: "Pending",
            value: pending,
            detail: "Recovery attempts in queue",
            tone: "warning"
        },
        {
            label: "Expected value",
            value: `₹${Number(metrics.expectedRecoveryValue || 0).toLocaleString("en-IN")}`,
            detail: "Projected recovery",
            tone: "violet"
        }
    ];

    return (
        <div className="rr-status-strip rr-reveal">
            {items.map((item) => (
                <div className="rr-status-item" key={item.label}>
                    <span className={`rr-status-marker rr-status-marker--${item.tone}`} />
                    <div>
                        <span className="rr-status-label">{item.label}</span>
                        <strong className="rr-status-value rr-num">
                            {item.value}
                        </strong>
                        <span className="rr-status-detail">{item.detail}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default OutcomeSummary;
