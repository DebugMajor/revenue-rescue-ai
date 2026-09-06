import { useState } from "react";

const STEPS = [
    {
        label: "Payment Event",
        accent: "danger",
        rows: [["Error", "NETWORK_ERROR"], ["Amount", "₹4,000"]]
    },
    {
        label: "Customer Context",
        accent: "cyan",
        rows: [["Successful", "6"], ["Total", "8"]]
    },
    {
        label: "Risk Engine",
        accent: "violet",
        rows: [["Band", "MEDIUM"], ["Score", "0.52"]]
    },
    {
        label: "AI Recommendation",
        accent: "cyan",
        rows: [["Recommendation", "WAIT_AND_RETRY"], ["Confidence", "80%"]]
    },
    {
        label: "Policy Gate",
        accent: "blue",
        rows: [["Decision", "APPROVED"], ["Reason", "Passed all execution checks"]]
    },
    {
        label: "Recovery Outcome",
        accent: "success",
        rows: [["Outcome", "PENDING"], ["Detail", "Deferred retry scheduled"]]
    }
];

function DecisionTracePreview() {
    const [active, setActive] = useState(0);
    const step = STEPS[active];

    return (
        <div className="rr-card rr-home-trace-card">
            <p className="rr-home-trace-note">
                Illustrative preview — not live data. Every real recovery decision produces this
                same trace, viewable per transaction in the app.
            </p>

            <div className="rr-home-trace-steps">
                {STEPS.map((s, i) => (
                    <button
                        type="button"
                        key={s.label}
                        className={`rr-home-trace-step-btn accent-${s.accent}${i === active ? " is-active" : ""}`}
                        onClick={() => setActive(i)}
                        onMouseEnter={() => setActive(i)}
                        aria-pressed={i === active}
                    >
                        {s.label}
                        {i < STEPS.length - 1 && <span className="rr-home-trace-arrow">→</span>}
                    </button>
                ))}
            </div>

            <div className={`rr-home-trace-panel accent-${step.accent}`} aria-live="polite" key={step.label}>
                {step.rows.map(([k, v]) => (
                    <div className="rr-kv-row" key={k}>
                        <span className="k">{k}</span>
                        <span className="v">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DecisionTracePreview;