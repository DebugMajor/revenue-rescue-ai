import EmptyState from "../common/EmptyState";

function pivot(rows = []) {
  const bySource = new Map();

  for (const row of rows) {
    const key = row.source || "UNKNOWN";
    if (!bySource.has(key)) bySource.set(key, { label: key, recovered: 0, failed: 0 });
    const entry = bySource.get(key);
    const count = Number(row.count) || 0;
    if (row.outcome === "RECOVERED") entry.recovered += count;
    if (row.outcome === "FAILED" || row.outcome === "RESOLVED_UNRECOVERED") entry.failed += count;
  }

  return Array.from(bySource.values());
}

function RecoveryBySourceChart({ data = null }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Source breakdown not available yet"
        message="This view populates when completed recovery outcomes have an attributed analysis source."
      />
    );
  }

  const rows = pivot(data);

  return (
    <div className="rr-source-performance">
      <div className="rr-source-header">
        <span>Analysis source</span>
        <span>Recovered</span>
        <span>Failed</span>
        <span>Success rate</span>
      </div>

      {rows.map((row) => {
        const total = row.recovered + row.failed;
        const rate = total ? Math.round((row.recovered / total) * 100) : 0;

        return (
          <div className="rr-source-row" key={row.label}>
            <div>
              <strong>{row.label}</strong>
              <span>{total} completed outcome{total === 1 ? "" : "s"}</span>
            </div>
            <strong className="is-recovered">{row.recovered}</strong>
            <strong className="is-failed">{row.failed}</strong>
            <div className="rr-source-rate">
              <strong>{rate}%</strong>
              <span><i className={`rr-source-rate-fill rr-source-rate-fill--${row.label.toLowerCase()}`} style={{ width: `${rate}%` }} /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RecoveryBySourceChart;
