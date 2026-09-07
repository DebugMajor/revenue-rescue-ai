import { useNavigate } from "react-router-dom";
import { formatCurrency, formatRelativeTime } from "../../utils/time";
import StatusBadge from "../common/StatusBadge";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function formatAction(value) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function RecoveryActivityFeed({ activity, loading, error }) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="rr-dashboard-state">
        <ErrorState
          title="Unable to load recovery activity"
          message={error}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState label="Loading recovery activity…" />;
  }

  if (!activity?.length) {
    return (
      <EmptyState
        title="Recovery queue is clear"
        message="Pending recovery attempts will appear here when the engine has work in flight."
      />
    );
  }

  return (
    <div className="rr-activity-table">
      <div className="rr-activity-head">
        <span>Event</span>
        <span>Amount</span>
        <span>Action</span>
        <span>Outcome</span>
        <span>Time</span>
      </div>

      {activity.map((item) => (
        <button
          key={item.eventId}
          type="button"
          className="rr-activity-row"
          onClick={() =>
            navigate(`/transactions/${item.eventId}`)
          }
        >
          <span className="rr-activity-event">
            {item.errorCode || "PAYMENT_RECOVERY"}
          </span>

          <span className="rr-activity-amount rr-num">
            {formatCurrency(item.paymentAmount || 0)}
          </span>

          <span className="rr-activity-action">
            {formatAction(item.action)}
          </span>

          <span className="rr-activity-outcome">
            <StatusBadge
              status={item.outcome || "PENDING"}
            />
          </span>

          <span className="rr-activity-time">
            {item.timestamp
              ? formatRelativeTime(item.timestamp)
              : "—"}
          </span>
        </button>
      ))}
    </div>
  );
}

export default RecoveryActivityFeed;
