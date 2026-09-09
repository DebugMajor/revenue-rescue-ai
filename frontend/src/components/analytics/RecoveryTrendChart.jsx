import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import EmptyState from "../common/EmptyState";

function pivot(rows) {
  const byDate = new Map();
  for (const row of rows || []) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { date: row.date, RECOVERED: 0, FAILED: 0 });
    }
    const entry = byDate.get(row.date);
    if (row.outcome === "RECOVERED") entry.RECOVERED += Number(row.count) || 0;
    if (row.outcome === "FAILED" || row.outcome === "RESOLVED_UNRECOVERED") entry.FAILED += Number(row.count) || 0;
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function RecoveryTrendChart({ data = null }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Recovery trend not available yet"
        message="This view populates once completed recovery outcomes exist across the analytics window."
      />
    );
  }

  const chartData = pivot(data).slice(-7);

  return (
    <div className="rr-analytics-chart rr-analytics-trend-chart">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 14, right: 12, left: -12, bottom: 2 }} barGap={6} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--rr-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "var(--rr-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--rr-border)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--rr-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,.025)" }}
            contentStyle={{
              background: "var(--rr-surface-2)",
              border: "1px solid var(--rr-border-strong)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={formatDate}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
          <Bar dataKey="RECOVERED" name="Recovered" fill="#8B7CF6" radius={[5, 5, 0, 0]} maxBarSize={34} />
          <Bar dataKey="FAILED" name="Failed" fill="#F56B7C" radius={[5, 5, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RecoveryTrendChart;
