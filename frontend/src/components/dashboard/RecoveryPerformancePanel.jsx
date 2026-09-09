import { useEffect, useMemo, useState } from "react";
import { getRecoveryTrend } from "../../services/api";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

function numberFromRow(row, keys) {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function normalizeTrend(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    date: row?.date || row?.day || row?._id || "Unknown",
    recovered: numberFromRow(row, [
      "recovered",
      "recoveredCount",
      "RECOVERED"
    ]),
    failed: numberFromRow(row, [
      "failed",
      "failedCount",
      "FAILED"
    ])
  }));
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

  const rows = useMemo(
    () => normalizeTrend(trend),
    [trend]
  );

  if (error) {
    return (
      <div className="rr-performance-inner">
        <ErrorState
          title="Unable to load recovery activity"
          message={error}
        />
      </div>
    );
  }

  if (trend == null) {
    return (
      <div className="rr-performance-inner">
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
      failed: acc.failed + row.failed
    }),
    { recovered: 0, failed: 0 }
  );

  const max = Math.max(
    totals.recovered,
    totals.failed,
    1
  );

  const latest = rows[rows.length - 1];
  const days = rows.length;

  if (days === 1) {
    return (
      <div className="rr-performance-inner">
        <div className="rr-performance-summary">
          <div>
            <span className="rr-performance-label">
              Recovery history
            </span>
            <strong>1 day of activity</strong>
            <p>
              More history will make the trend more meaningful. The underlying
              recovery events are being recorded normally.
            </p>
          </div>

          <span className="rr-performance-date">
            {latest.date}
          </span>
        </div>

        <div className="rr-performance-bars">
          <div className="rr-performance-bar-row">
            <div className="rr-performance-bar-label">
              <span className="rr-performance-dot rr-performance-dot--recovered" />
              Recovered
              <strong>{totals.recovered}</strong>
            </div>
            <div className="rr-performance-track">
              <span
                className="rr-performance-fill rr-performance-fill--recovered"
                style={{
                  width: `${(totals.recovered / max) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="rr-performance-bar-row">
            <div className="rr-performance-bar-label">
              <span className="rr-performance-dot rr-performance-dot--failed" />
              Failed
              <strong>{totals.failed}</strong>
            </div>
            <div className="rr-performance-track">
              <span
                className="rr-performance-fill rr-performance-fill--failed"
                style={{
                  width: `${(totals.failed / max) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="rr-performance-foot">
          <span>Completed attempts</span>
          <strong>{totals.recovered + totals.failed}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="rr-performance-inner">
      <div className="rr-performance-summary rr-performance-summary--compact">
        <div>
          <span className="rr-performance-label">
            Recovery history
          </span>
          <strong>{days} days of activity</strong>
        </div>

        <div className="rr-performance-totals">
          <span className="rr-total rr-total--recovered">
            Recovered <strong>{totals.recovered}</strong>
          </span>
          <span className="rr-total rr-total--failed">
            Failed <strong>{totals.failed}</strong>
          </span>
        </div>
      </div>

      <div className="rr-performance-mini-chart">
        {rows.slice(-12).map((row) => {
          const rowMax = Math.max(
            row.recovered,
            row.failed,
            1
          );

          return (
            <div
              className="rr-performance-day"
              key={row.date}
              title={`${row.date}: ${row.recovered} recovered, ${row.failed} failed`}
            >
              <div className="rr-performance-columns">
                <span
                  className="rr-performance-column rr-performance-column--recovered"
                  style={{
                    height: `${Math.max(
                      8,
                      (row.recovered / rowMax) * 100
                    )}%`
                  }}
                />
                <span
                  className="rr-performance-column rr-performance-column--failed"
                  style={{
                    height: `${Math.max(
                      8,
                      (row.failed / rowMax) * 100
                    )}%`
                  }}
                />
              </div>
              <span>{row.date}</span>
            </div>
          );
        })}
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
          Showing recent activity
        </span>
      </div>
    </div>
  );
}

export default RecoveryPerformancePanel;
