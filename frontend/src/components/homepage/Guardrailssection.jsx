import { useEffect, useState } from "react";

const CHECKS = [
    "Risk acceptable",
    "Confidence acceptable",
    "Amount within limit",
    "Attempts within limit"
];

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function GuardrailsSection() {
    const [checked, setChecked] = useState(prefersReducedMotion() ? CHECKS.length : 0);

    useEffect(() => {
        if (prefersReducedMotion()) return undefined;

        if (checked >= CHECKS.length) {
            const reset = setTimeout(() => setChecked(0), 2200);
            return () => clearTimeout(reset);
        }

        const step = setTimeout(() => setChecked((c) => c + 1), 550);
        return () => clearTimeout(step);
    }, [checked]);

    const allPassed = checked >= CHECKS.length;

    return (
        <section className="rr-home-section" id="guardrails">
            <p className="rr-eyebrow">Safety / guardrails</p>
            <h2 className="rr-page-title">AI recommends. Code decides.</h2>

            <div className="rr-guard-flow">
                <div className="rr-guard-stage">
                    <div className="rr-guard-stage-tag accent-violet">AI</div>
                    <ul className="rr-home-list">
                        <li>Diagnoses why a payment failed</li>
                        <li>Recommends one bounded recovery action</li>
                        <li>Explains its reasoning in plain language</li>
                    </ul>
                </div>

                <div className="rr-guard-connector" aria-hidden="true">
                    <span className="rr-guard-connector-line" />
                </div>

                <div className="rr-guard-stage rr-guard-stage--policy">
                    <div className="rr-guard-stage-tag accent-blue">Policy Gate</div>
                    <ul className="rr-guard-checklist">
                        {CHECKS.map((c, i) => (
                            <li key={c} className={i < checked ? "is-passed" : ""}>
                                <span className="rr-guard-check-mark">{i < checked ? "✓" : "·"}</span>
                                {c}
                            </li>
                        ))}
                    </ul>
                    <div className={`rr-guard-verdict${allPassed ? " is-visible" : ""}`}>
                        <span className="rr-badge success">
                            <span className="rr-badge-dot" />
                            Approved
                        </span>
                    </div>
                </div>

                <div className="rr-guard-connector" aria-hidden="true">
                    <span className="rr-guard-connector-line" />
                </div>

                <div className="rr-guard-stage">
                    <div className="rr-guard-stage-tag accent-cyan">Executor</div>
                    <ul className="rr-home-list">
                        <li>Enforces limits on amount, risk, and confidence</li>
                        <li>Blocks unsafe or unsupported actions</li>
                        <li>Runs a safe deterministic fallback if the AI call fails</li>
                        <li>Caps repeated retries and escalates when necessary</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}

export default GuardrailsSection;
