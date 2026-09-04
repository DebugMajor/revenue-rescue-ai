import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import EmptyState from "../common/EmptyState";

// data: [{ date, outcome, count }] from GET /analytics/recovery-trend
// Pivoted into one row per date with recovered/failed columns.
function pivot(rows) {
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { date: row.date, RECOVERED: 0, FAILED: 0 });
    }
    const entry = byDate.get(row.date);
    if (row.outcome === "RECOVERED") entry.RECOVERED = row.count;
    if (row.outcome === "FAILED") entry.FAILED = row.count;
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function RecoveryTrendChart({ data = null }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Recovery trend not available yet"
        message="This chart populates once recovery attempts with a completed outcome exist across multiple days."
      />
    );
  }

  const chartData = pivot(data);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rr-border)" />
        <XAxis dataKey="date" tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "var(--rr-surface-2)", border: "1px solid var(--rr-border-strong)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="RECOVERED" stroke="var(--rr-cyan)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="FAILED" stroke="var(--rr-danger)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default RecoveryTrendChart;
