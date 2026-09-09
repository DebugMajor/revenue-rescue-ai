import "../../styles/performance-charts.css";

function normaliseRows(data = []) {
  const grouped = new Map();

  data.forEach((row) => {
    if (!row?.date) return;
    const key = String(row.date).slice(0, 10);
    if (!grouped.has(key)) grouped.set(key, { date: key, recovered: 0, failed: 0 });

    const bucket = grouped.get(key);
    const outcome = String(row.outcome || "").toUpperCase();
    const count = Number(row.count) || 0;

    if (outcome === "RECOVERED") bucket.recovered += count;
    if (outcome === "FAILED" || outcome === "RESOLVED_UNRECOVERED") bucket.failed += count;
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function shortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(date);
}

function RecoveryTrendChart({ data = [] }) {
  const rows = normaliseRows(data);

  if (!rows.length) return null;

  const totalRecovered = rows.reduce((sum, row) => sum + row.recovered, 0);
  const totalFailed = rows.reduce((sum, row) => sum + row.failed, 0);
  const max = Math.max(...rows.map((row) => Math.max(row.recovered, row.failed)), 1);

  return (
    <div className="rr-trend-chart">
      <div className="rr-trend-summary">
        <div>
          <span>Completed attempts</span>
          <strong>{totalRecovered + totalFailed}</strong>
        </div>
        <div>
          <span>Recovered</span>
          <strong className="is-success">{totalRecovered}</strong>
        </div>
        <div>
          <span>Failed</span>
          <strong className="is-danger">{totalFailed}</strong>
        </div>
      </div>

      <div className="rr-trend-plot" role="img" aria-label="Recovery activity by day">
        <div className="rr-trend-grid-line line-25" />
        <div className="rr-trend-grid-line line-50" />
        <div className="rr-trend-grid-line line-75" />
        <div className="rr-trend-baseline" />

        <div className="rr-trend-groups">
          {rows.map((row) => (
            <div className="rr-trend-group" key={row.date}>
              <div className="rr-trend-bars">
                <span
                  className="rr-trend-bar recovered"
                  style={{ height: `${Math.max((row.recovered / max) * 100, row.recovered ? 10 : 0)}%` }}
                  title={`${row.recovered} recovered`}
                />
                <span
                  className="rr-trend-bar failed"
                  style={{ height: `${Math.max((row.failed / max) * 100, row.failed ? 10 : 0)}%` }}
                  title={`${row.failed} failed`}
                />
              </div>
              <span className="rr-trend-date">{shortDate(row.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rr-chart-legend">
        <span><i className="legend-dot recovered" />Recovered</span>
        <span><i className="legend-dot failed" />Failed</span>
        <span className="legend-note">Daily completed recovery attempts</span>
      </div>
    </div>
  );
}

export default RecoveryTrendChart;
