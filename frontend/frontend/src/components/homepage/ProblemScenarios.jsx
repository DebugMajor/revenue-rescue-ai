import StatusBadge from "../common/StatusBadge";

const CATEGORIES = [
    {
        id: "transient",
        label: "TRANSIENT",
        code: "NETWORK_ERROR",
        note: "Retry may work",
        accent: "cyan"
    },
    {
        id: "context",
        label: "CUSTOMER CONTEXT",
        code: "Strong payment history",
        note: "Context changes the decision",
        accent: "violet"
    },
    {
        id: "risk",
        label: "HIGH-RISK",
        code: "Repeated attempts / high-value",
        note: "Automatic recovery may be unsafe",
        accent: "danger"
    }
];

function ProblemScenarios() {
    return (
        <section className="rr-home-section rr-section-bg--problem" id="problem">
            <div className="rr-split">
                <div className="rr-split-text">
                    <p className="rr-eyebrow">Why retry-everything fails</p>
                    <h2 className="rr-page-title rr-page-title--split">
                        Not every failed payment should be retried.
                    </h2>
                    <p className="rr-home-section-sub rr-home-section-sub--tight">
                        Context beats blind retrying. The same error code can call for a
                        different response depending on who the customer is and what already
                        happened.
                    </p>

                    <div className="rr-category-list">
                        {CATEGORIES.map((c) => (
                            <div className={`rr-category-row accent-${c.accent}`} key={c.id}>
                                <div className="rr-category-label">{c.label}</div>
                                <div className="rr-category-code rr-num">{c.code}</div>
                                <div className="rr-category-note">
                                    <span aria-hidden="true">→</span> {c.note}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rr-inspect-panel">
                    <div className="rr-inspect-header">
                        <span>Transaction Inspection</span>
                        <span className="rr-inspect-tag">Illustrative decision</span>
                    </div>

                    <div className="rr-inspect-row rr-inspect-row--lg">
                        <span className="k">Payment</span>
                        <span className="v rr-num">₹4,000</span>
                    </div>
                    <div className="rr-inspect-row">
                        <span className="k">Failure</span>
                        <span className="v rr-num">NETWORK_ERROR</span>
                    </div>
                    <div className="rr-inspect-row">
                        <span className="k">Attempt</span>
                        <span className="v rr-num">01</span>
                    </div>
                    <div className="rr-inspect-row">
                        <span className="k">Customer</span>
                        <span className="v rr-num">6 / 8 successful</span>
                    </div>
                    <div className="rr-inspect-divider" />
                    <div className="rr-inspect-row">
                        <span className="k">Risk</span>
                        <span className="v rr-num accent-violet">MEDIUM · 0.52</span>
                    </div>
                    <div className="rr-inspect-row">
                        <span className="k">AI</span>
                        <span className="v"><StatusBadge status="WAIT_AND_RETRY" /></span>
                    </div>
                    <div className="rr-inspect-row">
                        <span className="k">Policy</span>
                        <span className="v"><StatusBadge status="APPROVED" /></span>
                    </div>
                    <div className="rr-inspect-row">
                        <span className="k">Outcome</span>
                        <span className="v"><StatusBadge status="PENDING" /></span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ProblemScenarios;