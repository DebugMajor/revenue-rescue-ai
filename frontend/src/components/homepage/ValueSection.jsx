const STAGES = [
    { label: "Revenue at Risk", width: 100, accent: "danger", note: "Failed payments entering the engine" },
    { label: "Expected Recovery", width: 74, accent: "violet", note: "Modeled from historical recovery probability" },
    { label: "Recovered Revenue", width: 52, accent: "cyan", note: "Actually returned via retry or payment link" },
    { label: "Recovery Rate", width: 52, accent: "success", note: "Recovered ÷ completed attempts" }
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
                        <div className="rr-home-funnel-note">{s.note}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ValueSection;