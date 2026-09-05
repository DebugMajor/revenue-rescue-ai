import { useEffect, useRef, useState } from "react";

const STAGES = [
    { id: "event", label: "Payment Failure", detail: "NETWORK_ERROR detected", accent: "danger" },
    { id: "context", label: "Customer Context", detail: "6 successful / 8 total", accent: "cyan" },
    { id: "risk", label: "Risk Engine", detail: "MEDIUM risk", accent: "violet" },
    { id: "ai", label: "AI Recommendation", detail: "WAIT_AND_RETRY · 80% confidence", accent: "cyan" },
    { id: "policy", label: "Policy Gate", detail: "APPROVED", accent: "blue" },
    { id: "recovery", label: "Recovery", detail: "PENDING · deferred retry", accent: "success" }
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
                            {s.label}
                        </button>
                        {i < STAGES.length - 1 && (
                            <div className={`rr-home-engine-line${i < active ? " is-filled" : ""}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="rr-home-engine-detail" aria-live="polite">
                <div className={`rr-home-engine-detail-tag accent-${stage.accent}`}>{stage.label}</div>
                <div className="rr-home-engine-detail-value rr-num">{stage.detail}</div>
            </div>
        </div>
    );
}

export default RecoveryEngineViz;