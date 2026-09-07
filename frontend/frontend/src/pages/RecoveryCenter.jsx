import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { getRecoveryQueue } from "../services/api";

function RecoveryCenter() {
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getRecoveryQueue()
      .then((data) => { if (!cancelled) setQueue(data); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageContainer
      title="Recovery Center"
      subtitle="Recovery attempts currently in flight — awaiting a deferred retry or a customer completing a payment link."
    >
      <div className="rr-card">
        {error && <ErrorState title="Couldn't load recovery queue" message={error} />}
        {!error && queue == null && <LoadingState label="Loading recovery queue…" />}
        {!error && queue && queue.length === 0 && (
          <EmptyState title="Recovery queue is empty" message="No recovery attempts are currently pending." />
        )}
        {!error && queue && queue.length > 0 && (
          <div className="rr-table-wrap">
            <table className="rr-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Error</th>
                  <th>Action</th>
                  <th>Attempt #</th>
                  <th>Outcome</th>
                  <th>Next Retry</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((attempt) => {
                  const event = attempt.event || {};
                  return (
                    <tr
                      key={attempt._id}
                      className={event.eventId ? "clickable" : ""}
                      onClick={() => event.eventId && navigate(`/transactions/${event.eventId}`)}
                    >
                      <td>{event.customerId ?? "—"}</td>
                      <td className="rr-num-cell">{event.paymentAmount != null ? `₹${event.paymentAmount}` : "—"}</td>
                      <td>{event.errorCode ?? "—"}</td>
                      <td><StatusBadge status={attempt.action} /></td>
                      <td className="rr-num-cell">{attempt.recoveryAttemptNumber ?? "—"}</td>
                      <td><StatusBadge status={attempt.outcome} /></td>
                      <td>{attempt.nextRetryAt ? new Date(attempt.nextRetryAt).toLocaleString("en-IN") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default RecoveryCenter;
