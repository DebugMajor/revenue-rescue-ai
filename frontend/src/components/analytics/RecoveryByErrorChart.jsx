import "../../styles/performance-charts.css";

function normalise(data = []) {
  const grouped = new Map();

  data.forEach((row) => {
    const label = row?.errorCode || row?.error || "UNKNOWN_ERROR";
    if (!grouped.has(label)) {
      grouped.set(label, { label, recovered: 0, failed: 0 });
    }
    const item = grouped.get(label);
    const outcome = String(row?.outcome || "").toUpperCase();
    const count = Number(row?.count) || 0;

    if (outcome === "RECOVERED") item.recovered += count;
    if (outcome === "FAILED" || outcome === "RESOLVED_UNRECOVERED") {
      item.failed += count;
    }
  });

  return Array.from(grouped.values())
    .sort((a, b) => {
      const aTotal = a.recovered + a.failed;
      const bTotal = b.recovered + b.failed;
      return bTotal - aTotal;
    });
}

function RecoveryByErrorChart({ data = [] }) {
  const rows = normalise(data);

  if (!rows.length) {
    return (
      <div className="rr-breakdown-empty">
        No recovery outcomes recorded yet.
      </div>
    );
  }

  const max = Math.max(
    ...rows.map((row) => row.recovered + row.failed),
    1
  );

  return (
    <div className="rr-breakdown-chart">
      <div className="rr-breakdown-rows">
        {rows.map((row) => {
          const total = row.recovered + row.failed;
          const recoveredWidth =
            total > 0 ? (row.recovered / max) * 100 : 0;
          const failedWidth = total > 0 ? (row.failed / max) * 100 : 0;

          return (
            <div className="rr-breakdown-row" key={row.label}>
              <div className="rr-breakdown-row-head">
                <span title={row.label}>{row.label}</span>
                <strong>{total}</strong>
              </div>

              <div className="rr-breakdown-track" aria-label={`${row.label}: ${total} outcomes`}>
                <span
                  className="rr-breakdown-segment recovered"
                  style={{ width: `${recoveredWidth}%` }}
                />
                <span
                  className="rr-breakdown-segment failed"
                  style={{ width: `${failedWidth}%` }}
                />
              </div>

              <div className="rr-breakdown-meta">
                <span className="is-recovered">
                  {row.recovered} recovered
                </span>
                <span className="is-failed">
                  {row.failed} failed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rr-chart-legend">
        <span>
          <i className="legend-dot recovered" />
          Recovered
        </span>
        <span>
          <i className="legend-dot failed" />
          Failed
        </span>
      </div>
    </div>
  );
}

export default RecoveryByErrorChart;
