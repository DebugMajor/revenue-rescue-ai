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
        <section className="rr-home-section rr-section-bg--guardrails" id="guardrails">
            <p className="rr-eyebrow">Guardrails</p>
            <h2 className="rr-page-title">AI can recommend. It cannot bypass the policy.</h2>
            <p className="rr-home-section-sub">
                Deterministic rules provide bounded execution — AI is never given unrestricted
                authority over financial actions.
            </p>

            <div className="rr-guard-module">
                <div className="rr-guard-flow">
                    <div className="rr-guard-stage">
                        <div className="rr-guard-stage-tag accent-violet">AI Recommendation</div>
                        <div className="rr-guard-stage-headline rr-num">WAIT_AND_RETRY</div>
                        <div className="rr-guard-stage-sub">80% confidence</div>
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
                            <li>Retry, deferred retry, or Razorpay Payment Link</li>
                            <li>Blocks unsupported or unsafe actions</li>
                            <li>Caps repeated attempts and escalates when needed</li>
                        </ul>
                    </div>
                </div>

                <div className="rr-guard-alt-outcomes">
                    <div className="rr-guard-alt-chip accent-violet">
                        <span className="rr-guard-alt-label">ESCALATED</span>
                        <span className="rr-guard-alt-note">High risk / high value</span>
                    </div>
                    <div className="rr-guard-alt-chip accent-danger">
                        <span className="rr-guard-alt-label">BLOCKED</span>
                        <span className="rr-guard-alt-note">Unsafe / unsupported / limit exceeded</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default GuardrailsSection;