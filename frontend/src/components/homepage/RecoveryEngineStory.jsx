import { useState } from "react";

const STAGES = [
    { id: "event", label: "Payment Event", accent: "danger", meta: [["Amount", "₹4,000"], ["Error", "NETWORK_ERROR"]] },
    { id: "context", label: "Customer Context", accent: "cyan", meta: [["Prior payments", "8 total, 6 successful"]] },
    { id: "risk", label: "Risk Engine", accent: "violet", meta: [["Risk", "0.52 · MEDIUM"]] },
    { id: "ai", label: "AI Diagnosis", accent: "cyan", meta: [["Recommendation", "WAIT_AND_RETRY"], ["Confidence", "80%"]] },
    { id: "policy", label: "Policy Gate", accent: "blue", meta: [["Policy", "APPROVED"]] },
    { id: "recovery", label: "Recovery", accent: "success", meta: [["Outcome", "PENDING · deferred retry"]] }
];

function RecoveryEngineStory() {
    const [active, setActive] = useState(0);
    const stage = STAGES[active];

    return (
        <section className="rr-home-section rr-section-bg--engine" id="engine">
            <p className="rr-eyebrow">The recovery engine</p>
            <h2 className="rr-page-title">Every failed payment becomes a decision.</h2>
            <p className="rr-home-section-sub">
                Each stage narrows down what actually happened and what should happen next —
                before anything is allowed to execute.
            </p>

            <div className="rr-engine-story">
                <div className="rr-engine-story-rail">
                    {STAGES.map((s, i) => (
                        <div className="rr-engine-story-item" key={s.id}>
                            <button
                                type="button"
                                className={`rr-engine-story-node accent-${s.accent}${i === active ? " is-active" : ""}`}
                                onClick={() => setActive(i)}
                                onMouseEnter={() => setActive(i)}
                                aria-pressed={i === active}
                            >
                                <span className="rr-engine-story-dot" />
                                {s.label}
                            </button>
                            {i < STAGES.length - 1 && (
                                <div className={`rr-engine-story-line${i < active ? " is-filled" : ""}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className={`rr-engine-story-panel accent-${stage.accent}`} key={stage.id}>
                    <div className="rr-engine-story-panel-label">{stage.label}</div>
                    {stage.meta.map(([k, v]) => (
                        <div className="rr-kv-row" key={k}>
                            <span className="k">{k}</span>
                            <span className="v rr-num">{v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RecoveryEngineStory;