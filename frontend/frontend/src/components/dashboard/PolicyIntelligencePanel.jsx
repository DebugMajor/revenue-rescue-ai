function PolicyIntelligencePanel() {
    return (
        <div className="rr-policy-principle">
            <div className="rr-policy-principle-mark">
                <span />
                <span />
                <span />
            </div>

            <div>
                <span className="rr-policy-principle-eyebrow">
                    Governed execution
                </span>
                <strong>Recommendation is not authorization.</strong>
                <p>
                    The model can suggest a recovery action, but deterministic
                    policy checks decide whether that action is allowed to execute.
                </p>
            </div>
        </div>
    );
}

export default PolicyIntelligencePanel;