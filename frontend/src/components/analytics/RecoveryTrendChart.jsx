import "../../styles/analytics-trend-polish.css";

function normaliseRows(data = []) {
  const grouped = new Map();

  data.forEach((row) => {
    if (!row?.date) return;

    const key = String(row.date).slice(0, 10);

    if (!grouped.has(key)) {
      grouped.set(key, { date: key, recovered: 0, failed: 0 });
    }

    const bucket = grouped.get(key);
    const outcome = String(row.outcome || "").toUpperCase();
    const count = Number(row.count) || 0;

    if (outcome === "RECOVERED") bucket.recovered += count;
    if (outcome === "FAILED" || outcome === "RESOLVED_UNRECOVERED") {
      bucket.failed += count;
    }
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function shortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function RecoveryTrendChart({ data = [] }) {
  const rows = normaliseRows(data);

  if (!rows.length) return null;

  const totalRecovered = rows.reduce(
    (sum, row) => sum + row.recovered,
    0
  );
  const totalFailed = rows.reduce(
    (sum, row) => sum + row.failed,
    0
  );

  const maxValue = Math.max(
    ...rows.map((row) => Math.max(row.recovered, row.failed)),
    1
  );

  const chartMax = Math.max(4, Math.ceil(maxValue / 2) * 2);
  const ticks = [chartMax, chartMax / 2, 0];

  return (
    <div className="rr-trend-chart rr-trend-chart-polished">
      <div className="rr-trend-summary">
        <div className="rr-trend-stat">
          <span>Completed attempts</span>
          <strong>{totalRecovered + totalFailed}</strong>
        </div>

        <div className="rr-trend-stat">
          <span>Recovered</span>
          <strong className="is-success">{totalRecovered}</strong>
        </div>

        <div className="rr-trend-stat">
          <span>Failed</span>
          <strong className="is-danger">{totalFailed}</strong>
        </div>
      </div>

      <div
        className="rr-trend-plot rr-trend-plot-polished"
        role="img"
        aria-label="Daily recovered and failed recovery attempts"
      >
        <div className="rr-trend-y-axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="rr-trend-chart-area">
          <div className="rr-trend-grid">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="rr-trend-grid-row"
                style={{ bottom: `${(tick / chartMax) * 100}%` }}
              />
            ))}
          </div>

          <div className="rr-trend-groups">
            {rows.map((row) => {
              const recoveredHeight =
                row.recovered > 0
                  ? Math.max((row.recovered / chartMax) * 100, 7)
                  : 0;

              const failedHeight =
                row.failed > 0
                  ? Math.max((row.failed / chartMax) * 100, 7)
                  : 0;

              return (
                <div className="rr-trend-group" key={row.date}>
                  <div className="rr-trend-bars">
                    <div className="rr-trend-bar-wrap">
                      <span
                        className="rr-trend-bar recovered"
                        style={{ height: `${recoveredHeight}%` }}
                        title={`${row.recovered} recovered on ${shortDate(row.date)}`}
                      />
                    </div>

                    <div className="rr-trend-bar-wrap">
                      <span
                        className="rr-trend-bar failed"
                        style={{ height: `${failedHeight}%` }}
                        title={`${row.failed} failed on ${shortDate(row.date)}`}
                      />
                    </div>
                  </div>

                  <span className="rr-trend-date">{shortDate(row.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
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
        <span className="legend-note">
          Daily completed recovery attempts
        </span>
      </div>
    </div>
  );
}

export default RecoveryTrendChart;
