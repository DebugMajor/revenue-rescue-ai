const STAGES = [
    { label: "Revenue at Risk", value: "₹21.2K", width: 100, accent: "danger" },
    { label: "Expected Recovery", value: "₹8.0K", width: 74, accent: "violet" },
    { label: "Recovered Revenue", value: "₹6.4K", width: 52, accent: "cyan" },
    { label: "Recovery Rate", value: "76%", width: 52, accent: "success" }
];

const OUTCOMES = [
    { label: "RECOVERED", value: "₹6.4K", accent: "success" },
    { label: "PENDING", value: "₹1.6K", accent: "warning" },
    { label: "ESCALATED", value: "₹3.2K", accent: "violet" }
];

function RevenueFlow() {
    return (
        <section className="rr-home-section" id="revenue">
            <p className="rr-eyebrow">Revenue impact</p>
            <h2 className="rr-page-title">Recover more of the revenue already at risk.</h2>
            <p className="rr-home-section-sub">
                Illustrative scenario — demo data. Actual figures are computed live from your
                account's recovery attempts in Analytics.
            </p>

            <div className="rr-revflow">
                {STAGES.map((s) => (
                    <div className="rr-revflow-row" key={s.label}>
                        <div className="rr-revflow-label">{s.label}</div>
                        <div className="rr-revflow-track">
                            <div
                                className={`rr-revflow-bar accent-${s.accent}`}
                                style={{ width: `${s.width}%` }}
                            />
                        </div>
                        <div className={`rr-revflow-value accent-${s.accent} rr-num`}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="rr-outcome-strip">
                {OUTCOMES.map((o) => (
                    <div className={`rr-outcome-chip accent-${o.accent}`} key={o.label}>
                        <span className="rr-outcome-chip-label">{o.label}</span>
                        <span className="rr-outcome-chip-value rr-num">{o.value}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default RevenueFlow;