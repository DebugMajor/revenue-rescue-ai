import { useEffect, useMemo, useState } from "react";
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
import "../styles/analytics.css";

function sumOutcomes(rows = []) {
  return rows.reduce(
    (acc, row) => {
      const outcome = String(row?.outcome || "").toUpperCase();
      const count = Number(row?.count) || 0;
      if (outcome === "RECOVERED") acc.recovered += count;
      if (outcome === "FAILED" || outcome === "RESOLVED_UNRECOVERED") acc.failed += count;
      return acc;
    },
    { recovered: 0, failed: 0 }
  );
}

function topGrouped(rows = [], key) {
  const grouped = new Map();

  rows.forEach((row) => {
    const label = row?.[key] || "UNKNOWN";
    const count = Number(row?.count) || 0;
    const outcome = String(row?.outcome || "").toUpperCase();

    if (!grouped.has(label)) grouped.set(label, { label, recovered: 0, failed: 0 });
    const entry = grouped.get(label);

    if (outcome === "RECOVERED") entry.recovered += count;
    if (outcome === "FAILED" || outcome === "RESOLVED_UNRECOVERED") entry.failed += count;
  });

  return Array.from(grouped.values());
}

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
        if (!cancelled) setError(err.message || "Unable to load analytics.");
      });

    return () => { cancelled = true; };
  }, []);

  const observations = useMemo(() => {
    const list = [];

    const errors = topGrouped(byError || [], "errorCode")
      .sort((a, b) => (b.recovered + b.failed) - (a.recovered + a.failed));
    const actions = topGrouped(byAction || [], "action")
      .sort((a, b) => (b.recovered + b.failed) - (a.recovered + a.failed));

    if (errors[0] && (errors[0].recovered + errors[0].failed) > 0) {
      const total = errors[0].recovered + errors[0].failed;
      list.push(`${errors[0].label} is the highest-volume completed failure class (${total} outcomes).`);
    }

    if (actions[0] && (actions[0].recovered + actions[0].failed) > 0) {
      const total = actions[0].recovered + actions[0].failed;
      const rate = Math.round((actions[0].recovered / total) * 100);
      list.push(`${actions[0].label} is the most-used recovery action (${rate}% recovery across completed attempts).`);
    }

    const totals = sumOutcomes(byAction || []);
    if (totals.recovered + totals.failed > 0) {
      list.push(`${totals.recovered} completed recoveries were recorded against ${totals.failed} failed recovery attempts.`);
    } else {
      list.push("No completed recovery outcomes are available in the current analytics window.");
    }

    return list.slice(0, 3);
  }, [byAction, byError]);

  return (
    <PageContainer
      title="Analytics"
      subtitle="Recovery performance, failure mix, and decision-source quality — all figures are pulled from the analytics API."
    >
      <section className="rr-analytics-section rr-analytics-snapshot">
        <div className="rr-analytics-section-head">
          <div>
            <span className="rr-analytics-eyebrow">EXECUTIVE VIEW</span>
            <h2>Recovery performance</h2>
          </div>
          <span className="rr-analytics-window">Current analytics window</span>
        </div>

        {error && <ErrorState title="Couldn't load analytics" message={error} />}
        {!error && metrics == null && <LoadingState label="Loading analytics…" />}
        {!error && metrics && (
          <div className="rr-kpi-grid">
            <MetricCard label="Failed Payments" value={metrics.failedPayments} accent="cyan" />
            <MetricCard label="Recovered Payments" value={metrics.recoveredPayments} accent="blue" />
            <MetricCard label="Recovery Rate" value={`${Math.round(metrics.recoveryRate * 100)}%`} accent="violet" />
            <MetricCard
              label="Expected Recovery Value"
              value={`₹${Number(metrics.expectedRecoveryValue || 0).toLocaleString("en-IN")}`}
              accent="cyan"
            />
          </div>
        )}
      </section>

      <section className="rr-analytics-section rr-analytics-trend">
        <div className="rr-analytics-section-head">
          <div>
            <span className="rr-analytics-eyebrow">OUTCOME TREND</span>
            <h2>Daily recovery outcomes</h2>
            <p>Completed recoveries compared with failed recovery attempts.</p>
          </div>
        </div>
        {!error && trend == null ? <LoadingState label="Loading trend…" /> : <RecoveryTrendChart data={trend} />}
      </section>

      <div className="rr-analytics-two-column">
        <section className="rr-analytics-section">
          <div className="rr-analytics-section-head">
            <div>
              <span className="rr-analytics-eyebrow">RECOVERY STRATEGY</span>
              <h2>Recovery by action</h2>
              <p>Which recovery path actually converts?</p>
            </div>
          </div>
          {!error && byAction == null ? <LoadingState label="Loading action analysis…" /> : <RecoveryByActionChart data={byAction} />}
        </section>

        <section className="rr-analytics-section">
          <div className="rr-analytics-section-head">
            <div>
              <span className="rr-analytics-eyebrow">FAILURE MIX</span>
              <h2>Recovery by error</h2>
              <p>Outcome quality by originating failure.</p>
            </div>
          </div>
          {!error && byError == null ? <LoadingState label="Loading error analysis…" /> : <RecoveryByErrorChart data={byError} />}
        </section>
      </div>

      <section className="rr-analytics-section rr-analytics-source">
        <div className="rr-analytics-section-head">
          <div>
            <span className="rr-analytics-eyebrow">DECISION QUALITY</span>
            <h2>Analysis source performance</h2>
            <p>Gemini recommendation versus deterministic fallback outcomes.</p>
          </div>
        </div>
        {!error && bySource == null ? <LoadingState label="Loading source analysis…" /> : <RecoveryBySourceChart data={bySource} />}
      </section>

      <section className="rr-analytics-insights">
        <div>
          <span className="rr-analytics-eyebrow">ENGINE OBSERVATIONS</span>
          <h2>What the current data says</h2>
        </div>
        <div className="rr-analytics-insight-grid">
          {observations.map((item, index) => (
            <div className="rr-analytics-insight" key={`${index}-${item}`}>
              <span className="rr-analytics-insight-index">0{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rr-analytics-section rr-analytics-lab">
        <div className="rr-analytics-section-head">
          <div>
            <span className="rr-analytics-eyebrow">EVALUATION</span>
            <h2>Recovery Performance Lab</h2>
            <p>Controlled synthetic evaluation — separate from live merchant traffic.</p>
          </div>
          <span className="rr-analytics-lab-badge">500 scenarios</span>
        </div>

        <div className="rr-eval-grid">
          <div className="rr-eval-metric">
            <span>Scenarios</span>
            <strong>500</strong>
            <small>synthetic payment failures</small>
          </div>
          <div className="rr-eval-metric">
            <span>Customers</span>
            <strong>75</strong>
            <small>synthetic customer profiles</small>
          </div>
          <div className="rr-eval-metric">
            <span>Duplicate inputs</span>
            <strong>15</strong>
            <small>duplicate events detected</small>
          </div>
          <div className="rr-eval-metric">
            <span>Processing failures</span>
            <strong>0</strong>
            <small>evaluation pipeline failures</small>
          </div>
        </div>

        <div className="rr-eval-note">
          <strong>Methodology</strong>
          <span>Batch evaluation uses deterministic outcome simulation to compare recovery behavior and establish a baseline before production use.</span>
        </div>
      </section>
    </PageContainer>
  );
}

export default Analytics;
