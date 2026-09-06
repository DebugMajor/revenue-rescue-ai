function RiskBar() {
    return (
        <div className="rr-cap-riskbar" aria-hidden="true">
            <div className="rr-cap-riskbar-fill" style={{ width: "52%" }} />
        </div>
    );
}

const CAPABILITIES = [
    {
        title: "AI Payment Diagnosis",
        body: "Gemini analyzes each failure and explains what likely went wrong.",
        size: "lg",
        signal: (
            <div className="rr-cap-signal">
                <span className="rr-num">NETWORK_ERROR</span>
                <span className="rr-cap-arrow">→</span>
                <span className="accent-cyan rr-num">WAIT_AND_RETRY</span>
                <span className="rr-cap-pct">82%</span>
            </div>
        )
    },
    {
        title: "Risk Assessment",
        body: "A deterministic score from customer history and error type, computed before any AI call.",
        size: "md",
        signal: (
            <div className="rr-cap-signal rr-cap-signal--risk">
                <span className="rr-num">0.52</span>
                <span className="accent-violet">MEDIUM</span>
                <RiskBar />
            </div>
        )
    },
    {
        title: "Automated Recovery",
        body: "Retries, deferred retries, and payment links execute once approved.",
        size: "md",
        signal: (
            <div className="rr-cap-signal">
                <span className="rr-num">RETRY</span>
                <span className="rr-cap-arrow">→</span>
                <span className="accent-success rr-num">RECOVERED</span>
            </div>
        )
    },
    {
        title: "Decision Trace",
        body: "Every event, risk score, recommendation, and policy decision is viewable end to end.",
        size: "lg",
        signal: (
            <div className="rr-cap-trace-dots" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="rr-cap-trace-dot" />
                ))}
            </div>
        )
    },
    {
        title: "Recovery Center",
        body: "A live queue of recovery attempts still pending an outcome.",
        size: "sm"
    },
    {
        title: "Recovery Analytics",
        body: "Recovery rate, trend, and outcomes by action, error code, and source.",
        size: "sm",
        signal: (
            <svg className="rr-cap-spark" viewBox="0 0 80 24" aria-hidden="true">
                <polyline points="0,20 14,14 28,16 42,8 56,10 70,3 80,5" />
            </svg>
        )
    },
    {
        title: "Razorpay Integration",
        body: "Recovery actions and webhook lifecycle events run against Razorpay.",
        size: "sm",
        signal: (
            <div className="rr-cap-signal">
                <span className="rr-num">payment.failed</span>
                <span className="rr-cap-arrow">→</span>
                <span className="accent-success rr-num">payment_link.paid</span>
            </div>
        )
    },
    {
        title: "Multi-user Isolation",
        body: "Every account only ever sees its own events and recovery attempts.",
        size: "sm",
        signal: (
            <div className="rr-cap-signal">
                <span className="rr-num">USER A</span>
                <span className="rr-cap-arrow">≠</span>
                <span className="rr-num">USER B</span>
            </div>
        )
    }
];

function Capabilities() {
    return (
        <section className="rr-home-section" id="product">
            <p className="rr-eyebrow">Product capabilities</p>
            <h2 className="rr-page-title">Everything already built into the console</h2>

            <div className="rr-home-bento">
                {CAPABILITIES.map((cap) => (
                    <div className={`rr-card rr-home-bento-item rr-home-bento-item--${cap.size}`} key={cap.title}>
                        <div className="rr-card-title">{cap.title}</div>
                        <p className="rr-home-step-body">{cap.body}</p>
                        {cap.signal && <div className="rr-cap-signal-wrap">{cap.signal}</div>}
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Capabilities;