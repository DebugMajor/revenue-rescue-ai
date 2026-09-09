import { useEffect, useMemo, useState } from "react";
import { getRecoveryTrend } from "../../services/api";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

function addOutcome(bucket, outcome, count) {
  const normalized = String(outcome || "").toUpperCase();
  const value = Number(count);
  if (!Number.isFinite(value) || value <= 0) return;

  if (normalized === "RECOVERED" || normalized === "SUCCESS") {
    bucket.recovered += value;
  }

  if (
    normalized === "FAILED" ||
    normalized === "RESOLVED_UNRECOVERED" ||
    normalized === "UNRECOVERED" ||
    normalized === "FAILURE"
  ) {
    bucket.failed += value;
  }
}

function numberFromRow(row, keys) {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function normalizeTrend(rows) {
  const byDate = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const dateValue = row?.date || row?.day || row?._id;
    if (!dateValue) return;

    const date = String(dateValue).slice(0, 10);
    const current = byDate.get(date) || {
      date,
      recovered: 0,
      failed: 0,
    };

    // Current analytics API shape: { date, outcome, count }.
    if (row?.outcome !== undefined) {
      addOutcome(current, row.outcome, row.count);
    }

    // Backward-compatible support for pre-aggregated rows.
    current.recovered += numberFromRow(row, [
      "recovered",
      "recoveredCount",
      "RECOVERED",
    ]);
    current.failed += numberFromRow(row, [
      "failed",
      "failedCount",
      "FAILED",
    ]);

    byDate.set(date, current);
  });

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function RecoveryPerformancePanel() {
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getRecoveryTrend()
      .then((data) => {
        if (!cancelled) setTrend(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.message || "Unable to load recovery performance."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => normalizeTrend(trend), [trend]);

  if (error) {
    return (
      <div className="rr-performance-inner rr-performance-state">
        <ErrorState
          title="Unable to load recovery activity"
          message={error}
        />
      </div>
    );
  }

  if (trend == null) {
    return (
      <div className="rr-performance-inner rr-performance-state">
        <LoadingState label="Loading recovery activity…" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rr-performance-inner rr-performance-empty">
        <div className="rr-performance-empty-copy">
          <span className="rr-performance-empty-line" />
          <strong>No completed recovery history yet</strong>
          <p>
            Completed recovery attempts will build this view automatically.
          </p>
        </div>
      </div>
    );
  }

  const totals = rows.reduce(
    (acc, row) => ({
      recovered: acc.recovered + row.recovered,
      failed: acc.failed + row.failed,
    }),
    { recovered: 0, failed: 0 }
  );

  const completed = totals.recovered + totals.failed;
  const recoveryRate = completed
    ? Math.round((totals.recovered / completed) * 100)
    : 0;

  const visibleRows = rows.slice(-7);
  const scaleMax = Math.max(
    ...visibleRows.map((row) => Math.max(row.recovered, row.failed)),
    1
  );

  return (
    <div className="rr-performance-inner">
      <div className="rr-performance-summary rr-performance-summary--compact">
        <div>
          <span className="rr-performance-label">Recovery history</span>
          <strong>{rows.length} days of activity</strong>
        </div>

        <div className="rr-performance-metrics">
          <div>
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
          <div>
            <span>Recovered</span>
            <strong className="is-success">{totals.recovered}</strong>
          </div>
          <div>
            <span>Failed</span>
            <strong className="is-danger">{totals.failed}</strong>
          </div>
          <div>
            <span>Recovery</span>
            <strong className="is-success">{recoveryRate}%</strong>
          </div>
        </div>
      </div>

      <div
        className="rr-performance-activity-chart"
        role="img"
        aria-label="Completed recovery attempts by day"
      >
        <div className="rr-performance-chart-guide">
          <span>Daily completed attempts</span>
          <span>{visibleRows.length === 1 ? "1 day" : `Last ${visibleRows.length} days`}</span>
        </div>

        <div className="rr-performance-day-grid">
          {visibleRows.map((row) => {
            const recoveredHeight = row.recovered
              ? Math.max(18, (row.recovered / scaleMax) * 100)
              : 0;
            const failedHeight = row.failed
              ? Math.max(18, (row.failed / scaleMax) * 100)
              : 0;

            const total = row.recovered + row.failed;

            return (
              <div
                className="rr-performance-day-card"
                key={row.date}
                title={`${formatDate(row.date)} · ${row.recovered} recovered · ${row.failed} failed`}
              >
                <div className="rr-performance-day-values">
                  <span className="rr-performance-recovered-value">
                    {row.recovered}
                  </span>
                  <span className="rr-performance-failed-value">
                    {row.failed}
                  </span>
                </div>

                <div className="rr-performance-day-bars">
                  <span
                    className="rr-performance-column rr-performance-column--recovered"
                    style={{ height: `${recoveredHeight}%` }}
                  />
                  <span
                    className="rr-performance-column rr-performance-column--failed"
                    style={{ height: `${failedHeight}%` }}
                  />
                </div>

                <div className="rr-performance-day-footer">
                  <span>{formatDate(row.date)}</span>
                  <strong>{total}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rr-performance-legend">
        <span>
          <i className="rr-performance-dot rr-performance-dot--recovered" />
          Recovered
        </span>
        <span>
          <i className="rr-performance-dot rr-performance-dot--failed" />
          Failed
        </span>
        <span className="rr-performance-legend-note">
          Only completed recovery outcomes are shown
        </span>
      </div>
    </div>
  );
}

export default RecoveryPerformancePanel;
