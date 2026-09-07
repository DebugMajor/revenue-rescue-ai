import { useEffect, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import MetricCard from "../components/common/MetricCard";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import RecoveryTrendChart from "../components/analytics/RecoveryTrendChart";
import RecoveryByActionChart from "../components/analytics/RecoveryByActionChart";
import RecoveryByErrorChart from "../components/analytics/RecoveryByErrorChart";
import RecoveryBySourceChart from "../components/analytics/RecoveryBySourceChart";
import {
  getDashboardMetrics,
  getRecoveryByAction,
  getRecoveryByError,
  getRecoveryTrend,
  getRecoveryBySource
} from "../services/api";

function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [byAction, setByAction] = useState(null);
  const [byError, setByError] = useState(null);
  const [trend, setTrend] = useState(null);
  const [bySource, setBySource] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getDashboardMetrics(),
      getRecoveryByAction(),
      getRecoveryByError(),
      getRecoveryTrend(),
      getRecoveryBySource()
    ])
      .then(([metricsRes, actionRes, errorRes, trendRes, sourceRes]) => {
        if (cancelled) return;
        setMetrics(metricsRes);
        setByAction(actionRes);
        setByError(errorRes);
        setTrend(trendRes);
        setBySource(sourceRes);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <PageContainer
      title="Analytics"
      subtitle="Recovery performance across the engine — all figures are pulled live from the analytics API."
    >
      <div className="rr-card" style={{ marginBottom: 18 }}>
        <div className="rr-card-header">
          <div className="rr-card-title">Recovery Snapshot</div>
        </div>

        {error && <ErrorState title="Couldn't load analytics" message={error} />}
        {!error && metrics == null && <LoadingState label="Loading analytics…" />}
        {metrics && (
          <div className="rr-kpi-grid">
            <MetricCard label="Failed Payments" value={metrics.failedPayments} accent="cyan" />
            <MetricCard label="Recovered Payments" value={metrics.recoveredPayments} accent="blue" />
            <MetricCard label="Recovery Rate" value={`${Math.round(metrics.recoveryRate * 100)}%`} accent="violet" />
            <MetricCard label="Expected Recovery Value" value={`₹${metrics.expectedRecoveryValue.toLocaleString("en-IN")}`} accent="cyan" />
          </div>
        )}
      </div>

      <div className="rr-card" style={{ marginBottom: 18 }}>
        <div className="rr-card-header">
          <div>
            <div className="rr-card-title">Recovery Trend</div>
            <div className="rr-card-title-sub">Recovered vs. failed recovery attempts by day</div>
          </div>
        </div>
        {!error && trend == null ? <LoadingState label="Loading trend…" /> : <RecoveryTrendChart data={trend} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="rr-analytics-grid">
        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">Recovery by Action</div>
              <div className="rr-card-title-sub">RETRY_NOW / WAIT_AND_RETRY / SEND_PAYMENT_LINK</div>
            </div>
          </div>
          {!error && byAction == null ? <LoadingState label="Loading…" /> : <RecoveryByActionChart data={byAction} />}
        </div>

        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">Recovery by Error Code</div>
              <div className="rr-card-title-sub">Outcomes grouped by originating error</div>
            </div>
          </div>
          {!error && byError == null ? <LoadingState label="Loading…" /> : <RecoveryByErrorChart data={byError} />}
        </div>
      </div>

      <div className="rr-card" style={{ marginTop: 18 }}>
        <div className="rr-card-header">
          <div>
            <div className="rr-card-title">Gemini vs Deterministic Fallback</div>
            <div className="rr-card-title-sub">Outcomes by analysis source</div>
          </div>
        </div>
        {!error && bySource == null ? <LoadingState label="Loading…" /> : <RecoveryBySourceChart data={bySource} />}
      </div>

      <style>{`
        @media (max-width: 800px) {
          .rr-analytics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageContainer>
  );
}

export default Analytics;
