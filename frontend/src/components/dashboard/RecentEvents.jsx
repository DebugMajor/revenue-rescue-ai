import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentEvents } from "../../services/api";
import StatusBadge from "../common/StatusBadge";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function RecentEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getRecentEvents();
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <ErrorState title="Couldn't load recent events" message={error} />;
  }

  if (events == null) {
    return <LoadingState label="Loading recent events…" />;
  }

  if (events.length === 0) {
    return <EmptyState title="No recent events" message="Processed transactions will show up here." />;
  }

  return (
    <div className="rr-table-wrap">
      <table className="rr-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Amount</th>
            <th>Error</th>
            <th>Status</th>
            <th>Attempt</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.eventId}
              className="clickable"
              onClick={() => navigate(`/transactions/${event.eventId}`)}
            >
              <td>{event.customerId}</td>
              <td className="rr-num-cell">₹{event.paymentAmount}</td>
              <td>{event.errorCode || "—"}</td>
              <td><StatusBadge status={event.status} /></td>
              <td className="rr-num-cell">{event.attemptNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentEvents;
