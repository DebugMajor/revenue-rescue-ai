import { useEffect, useState } from "react";

const NODES = [
    { id: "event", label: "EVENT", accent: "danger", line1: "NETWORK_ERROR", line2: "₹4,000" },
    { id: "context", label: "CONTEXT", accent: "cyan", line1: "6 / 8", line2: "successful" },
    { id: "risk", label: "RISK", accent: "violet", line1: "MEDIUM", line2: "0.52" },
    { id: "ai", label: "AI", accent: "cyan", line1: "WAIT_AND_RETRY", line2: "80%" },
    { id: "policy", label: "POLICY", accent: "blue", line1: "APPROVED", line2: "4 / 4 checks" },
    { id: "recovery", label: "RECOVERY", accent: "success", line1: "PENDING", line2: "deferred" }
];

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function DecisionPipeline() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion()) return undefined;
        const interval = setInterval(() => {
            setActive((i) => (i + 1) % NODES.length);
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="rr-home-section rr-home-section--full rr-section-bg--pipeline" id="pipeline">
            <p className="rr-eyebrow">The decision engine</p>
            <h2 className="rr-page-title">Every failed payment becomes a decision.</h2>
            <p className="rr-home-section-sub">
                Revenue Rescue combines customer context, deterministic risk, AI diagnosis, and
                policy controls before anything executes.
            </p>

            <div className="rr-pipeline">
                {NODES.map((n, i) => (
                    <div className="rr-pipeline-item" key={n.id}>
                        <div className={`rr-pipeline-node accent-${n.accent}${i === active ? " is-active" : ""}`}>
                            <span className="rr-pipeline-node-label">{n.label}</span>
                            <span className="rr-pipeline-node-line1 rr-num">{n.line1}</span>
                            <span className="rr-pipeline-node-line2">{n.line2}</span>
                        </div>
                        {i < NODES.length - 1 && (
                            <div className={`rr-pipeline-connector${i < active ? " is-passed" : ""}`}>
                                <span aria-hidden="true">→</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

export default DecisionPipeline;