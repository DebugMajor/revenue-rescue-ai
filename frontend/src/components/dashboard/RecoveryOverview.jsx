import { useState, useEffect } from "react";
import { getDashboardMetrics } from "../../services/api";
import MetricCard from "../common/MetricCard";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

function RecoveryOverview() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getDashboardMetrics();
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <ErrorState title="Couldn't load dashboard metrics" message={error} />;
  }

  if (metrics == null) {
    return <LoadingState label="Loading metrics…" />;
  }

  return (
    <div className="rr-kpi-grid">
      <MetricCard label="Failed Payments" value={metrics.failedPayments} accent="cyan" />
      <MetricCard label="Recovered Payments" value={metrics.recoveredPayments} accent="blue" />
      <MetricCard
        label="Recovery Rate"
        value={`${Math.round(metrics.recoveryRate * 100)}%`}
        accent="violet"
      />
      <MetricCard
        label="Expected Recovery Value"
        value={`₹${metrics.expectedRecoveryValue.toLocaleString("en-IN")}`}
        accent="cyan"
      />
    </div>
  );
}

export default RecoveryOverview;
