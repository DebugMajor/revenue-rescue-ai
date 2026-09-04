import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import EmptyState from "../common/EmptyState";

// data: [{ action, outcome, count }] from GET /analytics/recovery-by-action
// (recoveryAnalyticsService.getRecoveryByAction). Pivoted client-side
// into one row per action with recovered/failed columns — no values
// are invented, only regrouped for charting.
function pivot(rows) {
  const byAction = new Map();
  for (const row of rows) {
    if (!byAction.has(row.action)) {
      byAction.set(row.action, { action: row.action, RECOVERED: 0, FAILED: 0 });
    }
    const entry = byAction.get(row.action);
    if (row.outcome === "RECOVERED") entry.RECOVERED = row.count;
    if (row.outcome === "FAILED") entry.FAILED = row.count;
  }
  return Array.from(byAction.values());
}

function RecoveryByActionChart({ data = null }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No recovery attempts yet"
        message="This chart populates once recovery attempts with a completed outcome (RECOVERED or FAILED) exist."
      />
    );
  }

  const chartData = pivot(data);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rr-border)" />
        <XAxis dataKey="action" tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--rr-muted)", fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "var(--rr-surface-2)", border: "1px solid var(--rr-border-strong)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="RECOVERED" fill="var(--rr-success)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="FAILED" fill="var(--rr-danger)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RecoveryByActionChart;
