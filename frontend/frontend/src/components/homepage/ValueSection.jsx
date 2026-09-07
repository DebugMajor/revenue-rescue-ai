const METRICS = [
    { label: "Revenue at Risk", value: "₹21.2K", accent: "danger" },
    { label: "Expected Recovery", value: "₹8.0K", accent: "violet" },
    { label: "Recovered Revenue", value: "₹6.4K", accent: "cyan" },
    { label: "Recovery Rate", value: "76%", accent: "success" }
];

const STAGES = [
    { label: "Revenue at Risk", width: 100, accent: "danger" },
    { label: "Expected Recovery", width: 74, accent: "violet" },
    { label: "Recovered Revenue", width: 52, accent: "cyan" },
    { label: "Recovery Rate", width: 52, accent: "success" }
];

function ValueSection() {
    return (
        <section className="rr-home-section" id="value">
            <p className="rr-eyebrow">Revenue impact</p>
            <h2 className="rr-page-title">
                Turn payment failures into measurable recovery opportunities.
            </h2>
            <p className="rr-home-section-sub">
                Illustrative example — actual figures are computed live from your account's recovery
                attempts in Analytics.
            </p>

            <div className="rr-value-metrics">
                {METRICS.map((m) => (
                    <div className="rr-value-metric" key={m.label}>
                        <div className={`rr-value-metric-figure accent-${m.accent} rr-num`}>{m.value}</div>
                        <div className="rr-value-metric-label">{m.label}</div>
                    </div>
                ))}
            </div>

            <div className="rr-home-funnel">
                {STAGES.map((s) => (
                    <div className="rr-home-funnel-row" key={s.label}>
                        <div className="rr-home-funnel-label">{s.label}</div>
                        <div className="rr-home-funnel-track">
                            <div
                                className={`rr-home-funnel-bar accent-${s.accent}`}
                                style={{ width: `${s.width}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ValueSection;
