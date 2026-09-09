import EmptyState from "../common/EmptyState";

function pivot(rows = []) {
  const byAction = new Map();
  for (const row of rows) {
    const key = row.action || "UNKNOWN";
    if (!byAction.has(key)) byAction.set(key, { label: key, recovered: 0, failed: 0 });
    const entry = byAction.get(key);
    const count = Number(row.count) || 0;
    if (row.outcome === "RECOVERED") entry.recovered += count;
    if (row.outcome === "FAILED" || row.outcome === "RESOLVED_UNRECOVERED") entry.failed += count;
  }
  return Array.from(byAction.values()).sort((a, b) =>
    (b.recovered + b.failed) - (a.recovered + a.failed)
  );
}

function RecoveryByActionChart({ data = null }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No recovery attempts yet" message="Completed action outcomes will appear here." />;
  }

  const rows = pivot(data);
  const max = Math.max(...rows.map((row) => row.recovered + row.failed), 1);

  return (
    <div className="rr-analytics-breakdown">
      {rows.map((row) => {
        const total = row.recovered + row.failed;
        const rate = total ? Math.round((row.recovered / total) * 100) : 0;
        const width = (total / max) * 100;

        return (
          <div className={`rr-breakdown-item rr-breakdown-item--${row.label.toLowerCase()}`} key={row.label}>
            <div className="rr-breakdown-head">
              <span>{row.label}</span>
              <strong>{total}</strong>
            </div>
            <div className="rr-breakdown-track">
              <span
                className="rr-breakdown-failed"
                style={{ width: `${(row.failed / Math.max(max, 1)) * 100}%` }}
              />
              <span
                className="rr-breakdown-recovered"
                style={{ width: `${(row.recovered / Math.max(max, 1)) * 100}%` }}
              />
            </div>
            <div className="rr-breakdown-foot">
              <span>{row.recovered} recovered · {row.failed} failed</span>
              <strong>{rate}% recovery</strong>
            </div>
          </div>
        );
      })}
      <div className="rr-breakdown-legend">
        <span><i className="recovered" /> Recovered</span>
        <span><i className="failed" /> Failed</span>
      </div>
    </div>
  );
}

export default RecoveryByActionChart;
