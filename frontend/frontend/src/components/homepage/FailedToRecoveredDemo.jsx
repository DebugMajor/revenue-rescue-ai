import { useEffect, useState } from "react";

// Purely illustrative state sequence — not connected to any live event.
const FRAMES = [
    { key: "failed", label: "Payment Failed", detail: "₹12,345 · NETWORK_ERROR", accent: "danger" },
    { key: "analyzing", label: "Analyzing", detail: "Gemini reviewing customer context", accent: "violet" },
    { key: "recommended", label: "WAIT_AND_RETRY", detail: "80% confidence", accent: "cyan" },
    { key: "policy", label: "Policy Approved", detail: "Within all execution limits", accent: "blue" },
    { key: "recovered", label: "Recovered", detail: "₹12,345 recovered", accent: "success" }
];

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function FailedToRecoveredDemo() {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion()) return undefined;
        const interval = setInterval(() => {
            setFrame((f) => (f + 1) % FRAMES.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="rr-demo">
            <p className="rr-demo-note">Illustrative sequence — not a live transaction.</p>
            <div className="rr-demo-frames">
                {FRAMES.map((f, i) => (
                    <div
                        key={f.key}
                        className={`rr-demo-frame accent-${f.accent}${i === frame ? " is-active" : ""}${i < frame ? " is-past" : ""}`}
                    >
                        <span className="rr-demo-frame-dot" />
                        <div className="rr-demo-frame-text">
                            <div className="rr-demo-frame-label">{f.label}</div>
                            {i === frame && <div className="rr-demo-frame-detail rr-num">{f.detail}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FailedToRecoveredDemo;
