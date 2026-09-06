import StatusBadge from "../common/StatusBadge";

function ProductConsolePreview() {
    return (
        <section className="rr-home-section rr-section-bg--console" id="console">
            <p className="rr-eyebrow">Inside the console</p>
            <h2 className="rr-page-title">This is what a recovery decision looks like.</h2>
            <p className="rr-home-section-sub">
                Illustrative product preview — the same layout every recovery decision renders
                in the authenticated app.
            </p>

            <div className="rr-console-wrap">
                <div className="rr-console-panel">
                    <div className="rr-console-panel-header">
                        <span>Recovery Decision</span>
                        <span className="rr-console-panel-amount rr-num">₹4,000</span>
                    </div>

                    <div className="rr-console-panel-row">
                        <span className="k">Error Code</span>
                        <span className="v rr-num">NETWORK_ERROR</span>
                    </div>

                    <div className="rr-console-section">
                        <div className="rr-console-section-label">Customer Context</div>
                        <div className="rr-kv-row"><span className="k">Successful payments</span><span className="v rr-num">6</span></div>
                        <div className="rr-kv-row"><span className="k">Total payments</span><span className="v rr-num">8</span></div>
                    </div>

                    <div className="rr-console-section">
                        <div className="rr-console-section-label">Risk</div>
                        <div className="rr-kv-row"><span className="k">Score</span><span className="v rr-num">0.52</span></div>
                        <div className="rr-kv-row"><span className="k">Band</span><span className="v"><StatusBadge status="MEDIUM" /></span></div>
                    </div>

                    <div className="rr-console-section">
                        <div className="rr-console-section-label">AI Recommendation</div>
                        <div className="rr-kv-row"><span className="k">Recommendation</span><span className="v"><StatusBadge status="WAIT_AND_RETRY" /></span></div>
                        <div className="rr-kv-row"><span className="k">Confidence</span><span className="v rr-num">80%</span></div>
                    </div>

                    <div className="rr-console-section">
                        <div className="rr-console-section-label">Policy</div>
                        <div className="rr-kv-row"><span className="k">Decision</span><span className="v"><StatusBadge status="APPROVED" /></span></div>
                    </div>

                    <div className="rr-console-section rr-console-section--recovery">
                        <div className="rr-console-section-label">Recovery</div>
                        <div className="rr-kv-row"><span className="k">Outcome</span><span className="v"><StatusBadge status="PENDING" /></span></div>
                    </div>
                </div>

                <div className="rr-console-side">
                    <div className="rr-console-side-card">
                        <div className="rr-console-side-label">Customer history</div>
                        <div className="rr-console-side-value rr-num">8 payments</div>
                    </div>
                    <div className="rr-console-side-card">
                        <div className="rr-console-side-label">Recovery attempt</div>
                        <div className="rr-console-side-value rr-num">#1</div>
                    </div>
                    <div className="rr-console-side-card">
                        <div className="rr-console-side-label">Policy checks</div>
                        <div className="rr-console-side-value">4 / 4 passed</div>
                    </div>
                    <div className="rr-console-side-card">
                        <div className="rr-console-side-label">Status</div>
                        <div className="rr-console-side-value"><StatusBadge status="PENDING" /></div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ProductConsolePreview;