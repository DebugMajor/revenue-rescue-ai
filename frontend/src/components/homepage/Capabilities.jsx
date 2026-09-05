const CAPABILITIES = [
    { title: "AI Payment Diagnosis", body: "Gemini analyzes each failure and explains what likely went wrong.", size: "lg" },
    { title: "Risk Assessment", body: "A deterministic score from customer history and error type, computed before any AI call.", size: "md" },
    { title: "Automated Recovery", body: "Retries, deferred retries, and payment links execute once approved.", size: "md" },
    { title: "Decision Trace", body: "Every event, risk score, recommendation, and policy decision is viewable end to end.", size: "lg" },
    { title: "Recovery Center", body: "A live queue of recovery attempts still pending an outcome.", size: "sm" },
    { title: "Recovery Analytics", body: "Recovery rate, trend, and outcomes by action, error code, and source.", size: "sm" },
    { title: "Razorpay Integration", body: "Recovery actions and webhook lifecycle events run against Razorpay.", size: "sm" },
    { title: "Multi-user Isolation", body: "Every account only ever sees its own events and recovery attempts.", size: "sm" }
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
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Capabilities;