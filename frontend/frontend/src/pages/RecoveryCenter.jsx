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

  const activeCount = Array.isArray(queue) ? queue.length : 0;

  return (
    <PageContainer
      title="Recovery Center"
      subtitle="Monitor recovery attempts that are still waiting for retry, payment completion, or resolution."
    >
      <div className="rr-recovery-shell">
        <div className="rr-recovery-toolbar">
          <div className="rr-recovery-scope">
            <div className="rr-recovery-scope-item is-active">
              <span className="rr-recovery-scope-label">Active recovery</span>
              <strong>{activeCount}</strong>
            </div>
            <div className="rr-recovery-scope-divider" />
            <div className="rr-recovery-scope-copy">
              Only unresolved recovery attempts appear here. Completed attempts remain in the transaction ledger.
            </div>
          </div>

          <button
            type="button"
            className="rr-recovery-history-link"
            onClick={() => navigate("/transactions")}
          >
            View transaction history →
          </button>
        </div>

        <div className="rr-card rr-recovery-card">
          {error && <ErrorState title="Couldn't load recovery queue" message={error} />}
          {!error && queue == null && <LoadingState label="Loading recovery queue…" />}
          {!error && queue && queue.length === 0 && (
            <EmptyState
              title="No active recoveries"
              message="The queue is clear. Completed recoveries and failed attempts remain available in Transactions."
            />
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
