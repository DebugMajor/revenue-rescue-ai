import { useEffect, useRef, useState } from "react";

const STAGES = [
    {
        id: "event",
        label: "Payment Failure",
        meta: "NETWORK_ERROR",
        detail: "₹4,000",
        accent: "danger"
    },
    {
        id: "context",
        label: "Customer Context",
        meta: "6 successful / 8 total",
        detail: "0 prior recovery attempts",
        accent: "cyan"
    },
    {
        id: "risk",
        label: "Risk",
        meta: "MEDIUM",
        detail: "0.52",
        accent: "violet"
    },
    {
        id: "ai",
        label: "AI Recommendation",
        meta: "WAIT_AND_RETRY",
        detail: "80% confidence",
        accent: "cyan"
    },
    {
        id: "policy",
        label: "Policy Gate",
        meta: "APPROVED",
        detail: "4 / 4 checks passed",
        accent: "blue"
    },
    {
        id: "recovery",
        label: "Recovery",
        meta: "PENDING",
        detail: "Deferred retry scheduled",
        accent: "success"
    }
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
                <div className="rr-home-engine-title-group">
                    <div className="rr-home-engine-title">Recovery Decision Engine</div>
                    <div className="rr-home-engine-subid rr-num">evt_9f21ac · Attempt 01</div>
                </div>
                <div className="rr-home-engine-live">
                    <span className="rr-home-engine-live-dot" />
                    Illustrative
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
                <div className="rr-home-engine-detail-sub rr-num">{stage.detail}</div>
            </div>
        </div>
    );
}

export default RecoveryEngineViz;