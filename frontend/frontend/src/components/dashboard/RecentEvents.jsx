import { useNavigate } from "react-router-dom";
import { formatCurrency, formatRelativeTime } from "../../utils/time";
import StatusBadge from "../common/StatusBadge";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function RecentEvents({
  transactions = [],
  loading = false,
  error = null
}) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="rr-dashboard-state">
        <ErrorState
          title="Couldn't load recent events"
          message={error}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState label="Loading recent transactions…" />;
  }

  if (!transactions.length) {
    return (
      <EmptyState
        title="No recent events"
        message="Processed payment events will appear here."
      />
    );
  }

  return (
    <div className="rr-events-table-wrap">
      <table className="rr-events-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Amount</th>
            <th>Error</th>
            <th>Status</th>
            <th>Attempt</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {transactions.slice(0, 10).map((event) => (
            <tr
              key={event.eventId}
              onClick={() =>
                navigate(`/transactions/${event.eventId}`)
              }
            >
              <td
                className="rr-events-customer"
                title={event.customerId}
              >
                {event.customerId}
              </td>

              <td className="rr-num">
                {formatCurrency(event.paymentAmount || 0)}
              </td>

              <td className="rr-events-error">
                {event.errorCode || "—"}
              </td>

              <td>
                <StatusBadge status={event.status} />
              </td>

              <td className="rr-num">
                {event.attemptNumber ?? "—"}
              </td>

              <td className="rr-events-time">
                {event.timestamp
                  ? formatRelativeTime(event.timestamp)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentEvents;
