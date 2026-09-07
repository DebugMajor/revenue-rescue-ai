import { useNavigate } from "react-router-dom";
import { formatCurrency, formatRelativeTime } from "../../utils/time";
import StatusBadge from "../common/StatusBadge";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function RecoveryActivityFeed({ intelligence, loading, error }) {
    const navigate = useNavigate();

    if (error) {
        return <ErrorState title="Unable to load recovery activity" message={error} />;
    }

    if (loading || intelligence == null) {
        return <LoadingState label="Loading recovery activity…" />;
    }

    const activity = intelligence.recentActivity;

    if (!activity || activity.length === 0) {
        return (
            <EmptyState
                title="No recovery activity yet"
                message="Recovery actions taken on failed payments will appear here."
            />
        );
    }

    return (
        <div className="rr-activity-feed rr-reveal">
            {activity.map((item) => (
                <div
                    key={item.eventId}
                    className="rr-activity-row"
                    onClick={() => navigate(`/transactions/${item.eventId}`)}
                >
                    <div className="rr-activity-main">
                        <span className="rr-activity-error">{item.errorCode || "UNKNOWN_ERROR"}</span>
                        <span className="rr-activity-amount rr-num">{formatCurrency(item.paymentAmount)}</span>
                    </div>
                    <div className="rr-activity-meta">
                        <StatusBadge status={item.action || item.policyDecision} />
                        <StatusBadge status={item.outcome || item.policyDecision} />
                        <span className="rr-activity-time">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default RecoveryActivityFeed;