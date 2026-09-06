import { useEffect, useState } from "react";
import StatusBadge from "../common/StatusBadge";

const STATES = [
    { key: "failed", label: "FAILED", accent: "danger", fields: [["Amount", "₹4,000"], ["Error", "NETWORK_ERROR"], ["Attempt", "01"]] },
    { key: "analyzing", label: "ANALYZING", accent: "violet", fields: [["Risk", "MEDIUM · 0.52"], ["Model", "Gemini"]] },
    { key: "recommendation", label: "RECOMMENDATION", accent: "cyan", fields: [["Action", "RETRY_NOW"], ["Confidence", "82%"]] },
    { key: "policy", label: "POLICY APPROVED", accent: "blue", fields: [["Decision", "APPROVED"], ["Checks", "4 / 4 passed"]] },
    { key: "recovery", label: "RECOVERY", accent: "success", fields: [["Outcome", "RECOVERED"], ["Amount", "₹4,000 returned"]] }
];

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function RecoveryOutcome() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion()) return undefined;
        const interval = setInterval(() => {
            setActive((i) => (i + 1) % STATES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const state = STATES[active];

    return (
        <section className="rr-home-section rr-section-bg--outcome" id="outcome">
            <p className="rr-eyebrow">From failure to recovery</p>
            <h2 className="rr-page-title">Watch one decision run end to end.</h2>
            <p className="rr-home-section-sub">Illustrative / demo sequence — not a live transaction.</p>

            <div className="rr-statemachine">
                <div className="rr-statemachine-rail">
                    {STATES.map((s, i) => (
                        <button
                            type="button"
                            key={s.key}
                            className={`rr-statemachine-step accent-${s.accent}${i === active ? " is-active" : ""}${i < active ? " is-past" : ""}`}
                            onClick={() => setActive(i)}
                            aria-pressed={i === active}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className={`rr-statemachine-panel accent-${state.accent}`} key={state.key}>
                    {state.fields.map(([k, v]) => (
                        <div className="rr-kv-row" key={k}>
                            <span className="k">{k}</span>
                            <span className="v rr-num">{v}</span>
                        </div>
                    ))}
                    {state.key === "recovery" && (
                        <div className="rr-statemachine-final">
                            <StatusBadge status="RECOVERED" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default RecoveryOutcome;