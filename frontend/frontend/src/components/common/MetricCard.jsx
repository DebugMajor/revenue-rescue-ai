function MetricCard({ label, value, accent = "cyan", footnote }) {
  return (
    <div className="rr-metric-card" style={{ "--rr-metric-accent": `var(--rr-${accent})` }}>
      <div className="rr-metric-label">{label}</div>
      <div className={`rr-metric-value accent-${accent} rr-num`}>{value}</div>
      {footnote && <div className="rr-metric-footnote">{footnote}</div>}
    </div>
  );
}

export default MetricCard;
