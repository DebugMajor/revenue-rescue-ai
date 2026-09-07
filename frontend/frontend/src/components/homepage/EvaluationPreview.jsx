const STATS = [
    { value: "500", label: "synthetic scenarios" },
    { value: "75", label: "customers" },
    { value: "15", label: "duplicate events" },
    { value: "0", label: "processing failures" }
];

const OUTCOMES = [
    { label: "RECOVERED", value: 100, accent: "success" },
    { label: "PENDING", value: 86, accent: "warning" },
    { label: "ESCALATED", value: 179, accent: "violet" },
    { label: "BLOCKED", value: 50, accent: "danger" }
];

const MAX = Math.max(...OUTCOMES.map((o) => o.value));

function EvaluationPreview() {
    return (
        <section className="rr-home-section rr-section-bg--evaluation" id="evaluation">
            <p className="rr-eyebrow">Engineering / evaluation</p>
            <h2 className="rr-page-title">Built to be evaluated, not just demoed.</h2>
            <p className="rr-home-section-sub">
                Controlled synthetic evaluation — not production traffic. Demo values shown
                below; they are not measured production results.
            </p>

            <div className="rr-eval-card">
                <div className="rr-eval-stats">
                    {STATS.map((s) => (
                        <div className="rr-eval-stat" key={s.label}>
                            <div className="rr-eval-stat-value rr-num">{s.value}</div>
                            <div className="rr-eval-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="rr-eval-divider" />

                <div className="rr-eval-outcomes">
                    <div className="rr-eval-outcomes-label">Policy Outcomes</div>
                    {OUTCOMES.map((o) => (
                        <div className="rr-eval-outcome-row" key={o.label}>
                            <span className={`rr-eval-outcome-name accent-${o.accent}`}>{o.label}</span>
                            <div className="rr-eval-outcome-track">
                                <div
                                    className={`rr-eval-outcome-bar accent-${o.accent}`}
                                    style={{ width: `${(o.value / MAX) * 100}%` }}
                                />
                            </div>
                            <span className="rr-eval-outcome-value rr-num">{o.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default EvaluationPreview;