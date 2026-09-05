const SIGNALS = [
    "AI-guided",
    "Deterministic policy",
    "Razorpay integrated",
    "Fully auditable",
    "Multi-user isolated"
];

function ProductSignals() {
    return (
        <div className="rr-home-signals" role="list">
            {SIGNALS.map((s) => (
                <div className="rr-home-signal" role="listitem" key={s}>
                    <span className="rr-home-signal-dot" />
                    {s}
                </div>
            ))}
        </div>
    );
}

export default ProductSignals;