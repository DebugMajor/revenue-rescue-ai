import { formatCurrency } from "../../utils/time";
import ErrorState from "../common/ErrorState";

function RevenueOverview({ metrics, recoveryQueue, loading, error }) {
  if (error) {
    return (
      <div className="rr-dashboard-state">
        <ErrorState
          title="Unable to load recovery overview"
          message={error}
        />
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="rr-revenue-overview rr-dashboard-skeleton-row">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rr-dashboard-kpi rr-dashboard-kpi-skeleton"
            key={index}
          />
        ))}
      </div>
    );
  }

  const pending = Array.isArray(recoveryQueue)
    ? recoveryQueue.length
    : 0;

  return (
    <div className="rr-revenue-overview" aria-label="Recovery metrics">
      <article className="rr-dashboard-kpi rr-dashboard-kpi--expected">
        <div className="rr-dashboard-kpi-top">
          <span className="rr-dashboard-kpi-label">
            Expected recovery
          </span>
          <span className="rr-dashboard-kpi-marker" />
        </div>
        <strong className="rr-dashboard-kpi-value">
          {formatCurrency(metrics.expectedRecoveryValue || 0)}
        </strong>
        <span className="rr-dashboard-kpi-meta">
          Projected recovery opportunity
        </span>
      </article>

      <article className="rr-dashboard-kpi rr-dashboard-kpi--failed">
        <div className="rr-dashboard-kpi-top">
          <span className="rr-dashboard-kpi-label">
            Failed payments
          </span>
          <span className="rr-dashboard-kpi-marker" />
        </div>
        <strong className="rr-dashboard-kpi-value">
          {metrics.failedPayments ?? 0}
        </strong>
        <span className="rr-dashboard-kpi-meta">
          Payment failures recorded
        </span>
      </article>

      <article className="rr-dashboard-kpi rr-dashboard-kpi--recovered">
        <div className="rr-dashboard-kpi-top">
          <span className="rr-dashboard-kpi-label">
            Recovered payments
          </span>
          <span className="rr-dashboard-kpi-marker" />
        </div>
        <strong className="rr-dashboard-kpi-value">
          {metrics.recoveredPayments ?? 0}
        </strong>
        <span className="rr-dashboard-kpi-meta">
          Successful recovery outcomes
        </span>
      </article>

      <article className="rr-dashboard-kpi rr-dashboard-kpi--rate">
        <div className="rr-dashboard-kpi-top">
          <span className="rr-dashboard-kpi-label">
            Recovery rate
          </span>
          <span className="rr-dashboard-kpi-marker" />
        </div>
        <strong className="rr-dashboard-kpi-value">
          {Math.round((metrics.recoveryRate || 0) * 100)}%
        </strong>
        <span className="rr-dashboard-kpi-meta">
          {pending} {pending === 1 ? "recovery" : "recoveries"} in flight
        </span>
      </article>
    </div>
  );
}

export default RevenueOverview;
