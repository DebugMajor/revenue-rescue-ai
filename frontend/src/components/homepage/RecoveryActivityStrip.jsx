import { useEffect, useState } from "react";

// Illustrative demo rows only — never fetched from the API.
const ROWS = [
    { error: "NETWORK_ERROR", amount: "₹12,345", action: "RETRY_NOW", outcome: "RECOVERED", tone: "success" },
    { error: "CARD_DECLINED", amount: "₹4,200", action: "HUMAN_REVIEW", outcome: "ESCALATED", tone: "warning" },
    { error: "INSUFFICIENT_FUNDS", amount: "₹3,000", action: "SEND_PAYMENT_LINK", outcome: "PENDING", tone: "warning" },
    { error: "NETWORK_ERROR", amount: "₹9,800", action: "RETRY_NOW", outcome: "RECOVERED", tone: "success" },
    { error: "TIMEOUT", amount: "₹6,150", action: "WAIT_AND_RETRY", outcome: "PENDING", tone: "warning" }
];

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function RecoveryActivityStrip() {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion()) return undefined;
        const interval = setInterval(() => {
            setOffset((o) => (o + 1) % ROWS.length);
        }, 3200);
        return () => clearInterval(interval);
    }, []);

    const visible = [0, 1, 2].map((i) => ROWS[(offset + i) % ROWS.length]);

    return (
        <div className="rr-activity">
            <div className="rr-activity-header">
                <span>Recent Recovery Activity</span>
                <span className="rr-activity-tag">Illustrative recovery activity</span>
            </div>
            <div className="rr-activity-rows">
                {visible.map((row, i) => (
                    <div
                        className={`rr-activity-row${i === 0 ? " is-newest" : ""}`}
                        key={`${row.error}-${offset}-${i}`}
                    >
                        <span className={`rr-activity-dot accent-${row.tone}`} />
                        <span className="rr-activity-error">{row.error}</span>
                        <span className="rr-activity-amount rr-num">{row.amount}</span>
                        <span className="rr-activity-action">{row.action}</span>
                        <span className={`rr-badge ${row.tone}`}>
                            <span className="rr-badge-dot" />
                            {row.outcome}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RecoveryActivityStrip;
