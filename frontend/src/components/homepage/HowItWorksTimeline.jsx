import { useState } from "react";

const STEPS = [
    { n: "01", title: "Event", body: "A payment failure or recovery event enters the system, from a webhook or a manual trigger." },
    { n: "02", title: "Context + Risk", body: "Customer history and a deterministic risk score are calculated before any AI involvement." },
    { n: "03", title: "AI Diagnosis", body: "Gemini reviews the event and context, then recommends one bounded recovery action." },
    { n: "04", title: "Policy Gate", body: "Deterministic rules — not the AI — decide whether that recommendation is allowed to run." },
    { n: "05", title: "Recovery + Audit", body: "The approved action executes within limits, and the full reasoning is recorded for review." }
];

function HowItWorksTimeline() {
    const [active, setActive] = useState(0);

    return (
        <section className="rr-home-section" id="how-it-works">
            <p className="rr-eyebrow">How it works</p>
            <h2 className="rr-page-title">From failure to recovery, in five governed steps</h2>

            <div className="rr-home-timeline">
                <div className="rr-home-timeline-rail">
                    {STEPS.map((step, i) => (
                        <button
                            type="button"
                            key={step.n}
                            className={`rr-home-timeline-node${i === active ? " is-active" : ""}`}
                            onMouseEnter={() => setActive(i)}
                            onFocus={() => setActive(i)}
                            onClick={() => setActive(i)}
                            aria-pressed={i === active}
                        >
                            <span className="rr-home-timeline-n">{step.n}</span>
                            <span className="rr-home-timeline-title">{step.title}</span>
                        </button>
                    ))}
                </div>

                <div className="rr-home-timeline-panel">
                    <div className="rr-home-timeline-panel-n">{STEPS[active].n}</div>
                    <div className="rr-card-title">{STEPS[active].title}</div>
                    <p className="rr-home-step-body">{STEPS[active].body}</p>
                </div>
            </div>
        </section>
    );
}

export default HowItWorksTimeline;