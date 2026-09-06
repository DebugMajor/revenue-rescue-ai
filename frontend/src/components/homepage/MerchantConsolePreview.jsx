import StatusBadge from "../common/StatusBadge";

const ROWS = [
    { error: "NETWORK_ERROR", amount: "₹9,800", action: "RETRY_NOW", outcome: "RECOVERED" },
    { error: "INSUFFICIENT_FUNDS", amount: "₹3,000", action: "SEND_PAYMENT_LINK", outcome: "PENDING" },
    { error: "TIMEOUT", amount: "₹6,150", action: "WAIT_AND_RETRY", outcome: "PENDING" }
];

function MerchantConsolePreview() {
    return (
        <section className="rr-home-section rr-section-bg--merchant" id="merchant-view">
            <p className="rr-eyebrow">What the merchant actually sees</p>
            <h2 className="rr-page-title">One console. Every recovery decision.</h2>
            <p className="rr-home-section-sub">Demo data — not live production numbers.</p>

            <div className="rr-merchant-mock">
                <div className="rr-merchant-mock-header">
                    <span>Recovery Overview</span>
                    <span className="rr-merchant-mock-tag">Demo data</span>
                </div>

                <div className="rr-merchant-mock-metrics">
                    <div className="rr-merchant-metric">
                        <div className="rr-merchant-metric-label">Revenue at Risk</div>
                        <div className="rr-merchant-metric-value accent-danger rr-num">₹1.06M</div>
                    </div>
                    <div className="rr-merchant-metric">
                        <div className="rr-merchant-metric-label">Expected Recovery</div>
                        <div className="rr-merchant-metric-value accent-violet rr-num">₹193K</div>
                    </div>
                    <div className="rr-merchant-metric">
                        <div className="rr-merchant-metric-label">Recovered</div>
                        <div className="rr-merchant-metric-value accent-cyan rr-num">₹97K</div>
                    </div>
                    <div className="rr-merchant-metric">
                        <div className="rr-merchant-metric-label">Recovery Rate</div>
                        <div className="rr-merchant-metric-value accent-success rr-num">33.9%</div>
                    </div>
                </div>

                <div className="rr-merchant-body">
                    <div className="rr-merchant-activity">
                        <div className="rr-merchant-activity-header">Recovery Activity</div>
                        {ROWS.map((r) => (
                            <div className="rr-merchant-activity-row" key={r.error + r.amount}>
                                <span className="rr-num">{r.error}</span>
                                <span className="rr-num">{r.amount}</span>
                                <span>{r.action}</span>
                                <StatusBadge status={r.outcome} />
                            </div>
                        ))}
                    </div>

                    <div className="rr-merchant-decision">
                        <div className="rr-merchant-decision-header">Current Decision</div>
                        <div className="rr-kv-row"><span className="k">Risk</span><span className="v">MEDIUM</span></div>
                        <div className="rr-kv-row"><span className="k">AI</span><span className="v rr-num">WAIT_AND_RETRY</span></div>
                        <div className="rr-kv-row"><span className="k">Policy</span><span className="v"><StatusBadge status="APPROVED" /></span></div>
                        <div className="rr-kv-row"><span className="k">Outcome</span><span className="v"><StatusBadge status="PENDING" /></span></div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MerchantConsolePreview;