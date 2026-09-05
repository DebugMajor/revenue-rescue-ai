import { useEffect, useRef, useState } from "react";

const STAGES = [
    { id: "event", label: "Payment Failure", meta: "NETWORK_ERROR", accent: "danger" },
    { id: "context", label: "Customer Context", meta: "6 successful / 8 total", accent: "cyan" },
    { id: "risk", label: "Risk Engine", meta: "MEDIUM · 0.52", accent: "violet" },
    { id: "ai", label: "AI Recommendation", meta: "WAIT_AND_RETRY · 80%", accent: "cyan" },
    { id: "policy", label: "Policy Gate", meta: "APPROVED", accent: "blue" },
    { id: "recovery", label: "Recovery", meta: "PENDING · deferred retry", accent: "success" }
];

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function RecoveryEngineViz() {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (paused || prefersReducedMotion()) return undefined;

        timerRef.current = setInterval(() => {
            setActive((i) => (i + 1) % STAGES.length);
        }, 2600);

        return () => clearInterval(timerRef.current);
    }, [paused]);

    const stage = STAGES[active];

    return (
        <div
            className="rr-home-engine"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="rr-home-engine-grid" aria-hidden="true" />

            <div className="rr-home-engine-header">
                <div className="rr-home-engine-title">Recovery Decision Engine</div>
                <div className="rr-home-engine-live">
                    <span className="rr-home-engine-live-dot" />
                    Live
                </div>
            </div>

            <div className="rr-home-engine-rail">
                {STAGES.map((s, i) => (
                    <div className="rr-home-engine-item" key={s.id}>
                        <button
                            type="button"
                            className={`rr-home-engine-node accent-${s.accent}${i === active ? " is-active" : ""}`}
                            onClick={() => setActive(i)}
                            aria-pressed={i === active}
                        >
                            <span className="rr-home-engine-dot" />
                            <span className="rr-home-engine-node-text">
                                <span className="rr-home-engine-node-label">{s.label}</span>
                                <span className={`rr-home-engine-node-meta${i === active ? " is-visible" : ""}`}>
                                    {s.meta}
                                </span>
                            </span>
                        </button>
                        {i < STAGES.length - 1 && (
                            <div className={`rr-home-engine-line${i < active ? " is-filled" : ""}${i === active ? " is-pulsing" : ""}`}>
                                <span className="rr-home-engine-line-pulse" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="rr-home-engine-detail" aria-live="polite">
                <div className={`rr-home-engine-detail-tag accent-${stage.accent}`}>{stage.label}</div>
                <div className="rr-home-engine-detail-value rr-num">{stage.meta}</div>
            </div>
        </div>
    );
}

export default RecoveryEngineViz;
