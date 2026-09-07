import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import EmptyState from "../common/EmptyState";

// data: [{ errorCode, outcome, count }] from GET /analytics/recovery-by-error
function pivot(rows) {
  const byError = new Map();
  for (const row of rows) {
    const key = row.errorCode || "UNKNOWN";
    if (!byError.has(key)) {
      byError.set(key, { errorCode: key, RECOVERED: 0, FAILED: 0 });
    }
    const entry = byError.get(key);
    if (row.outcome === "RECOVERED") entry.RECOVERED = row.count;
    if (row.outcome === "FAILED") entry.FAILED = row.count;
  }
  return Array.from(byError.values());
}

function RecoveryByErrorChart({ data = null }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No recovery attempts yet"
        message="This chart populates once recovery attempts with a completed outcome exist, grouped by the originating error code."
      />
    );
  }

  const chartData = pivot(data);

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 42)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--rr-border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <YAxis type="category" dataKey="errorCode" width={130} tick={{ fill: "var(--rr-muted)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "var(--rr-surface-2)", border: "1px solid var(--rr-border-strong)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="RECOVERED" fill="var(--rr-cyan)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="FAILED" fill="var(--rr-danger)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RecoveryByErrorChart;
