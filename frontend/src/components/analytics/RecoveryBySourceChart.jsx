import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import EmptyState from "../common/EmptyState";

// data: [{ source, outcome, count }] from GET /analytics/recovery-by-source
// (recoveryAnalyticsService.getRecoveryBySource). This endpoint now
// exists in the backend contract, so the "not available" placeholder
// the old frontend used here is stale — replaced with a real chart.
function pivot(rows) {
  const bySource = new Map();
  for (const row of rows) {
    const key = row.source || "UNKNOWN";
    if (!bySource.has(key)) {
      bySource.set(key, { source: key, RECOVERED: 0, FAILED: 0 });
    }
    const entry = bySource.get(key);
    if (row.outcome === "RECOVERED") entry.RECOVERED = row.count;
    if (row.outcome === "FAILED") entry.FAILED = row.count;
  }
  return Array.from(bySource.values());
}

function RecoveryBySourceChart({ data = null }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Source breakdown not available yet"
        message="This chart populates once recovery attempts exist whose analysis has a completed outcome."
      />
    );
  }

  const chartData = pivot(data);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rr-border)" />
        <XAxis dataKey="source" tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "var(--rr-surface-2)", border: "1px solid var(--rr-border-strong)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="RECOVERED" fill="var(--rr-violet)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="FAILED" fill="var(--rr-danger)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RecoveryBySourceChart;
