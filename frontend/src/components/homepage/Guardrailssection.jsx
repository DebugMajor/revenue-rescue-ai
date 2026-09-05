function GuardrailsSection() {
    return (
        <section className="rr-home-section" id="guardrails">
            <p className="rr-eyebrow">Safety / guardrails</p>
            <h2 className="rr-page-title">AI recommends. Code decides.</h2>

            <div className="rr-home-compare">
                <div className="rr-home-compare-col">
                    <div className="rr-home-compare-tag accent-violet">AI</div>
                    <ul className="rr-home-list">
                        <li>Diagnoses why a payment failed</li>
                        <li>Recommends one bounded recovery action</li>
                        <li>Explains its reasoning in plain language</li>
                    </ul>
                </div>

                <div className="rr-home-compare-flow" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>

                <div className="rr-home-compare-col">
                    <div className="rr-home-compare-tag accent-blue">Deterministic System</div>
                    <ul className="rr-home-list">
                        <li>Enforces limits on amount, risk, and confidence</li>
                        <li>Blocks unsafe or unsupported actions</li>
                        <li>Controls what actually executes</li>
                        <li>Runs a safe fallback if the AI call fails</li>
                        <li>Caps repeated retries and escalates when necessary</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}

export default GuardrailsSection;