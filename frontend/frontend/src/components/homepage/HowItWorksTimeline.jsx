import { useState } from "react";

const STEPS = [
    {
        n: "01",
        title: "Event",
        status: "Received",
        accent: "danger",
        points: [["Error", "NETWORK_ERROR"], ["Amount", "₹4,000"], ["Attempt", "01"]],
        body: "The system first understands what happened — the failure type, amount, and attempt number."
    },
    {
        n: "02",
        title: "Context + Risk",
        status: "Computed",
        accent: "cyan",
        points: [["Successful", "6"], ["Total", "8"], ["Risk", "MEDIUM · 0.52"]],
        body: "Customer history and a deterministic risk score are calculated before AI is trusted with anything."
    },
    {
        n: "03",
        title: "AI Diagnosis",
        status: "Recommended",
        accent: "violet",
        points: [["Recommendation", "WAIT_AND_RETRY"], ["Confidence", "80%"]],
        body: "Gemini reviews the event and context, then recommends one bounded recovery action.",
        reason: "Temporary failure with strong payment history."
    },
    {
        n: "04",
        title: "Policy Gate",
        status: "Approved",
        accent: "blue",
        points: [],
        checklist: ["Risk acceptable", "Confidence valid", "Amount within limit", "Attempt limit"],
        body: "Deterministic rules — not the AI — decide whether that recommendation is allowed to run."
    },
    {
        n: "05",
        title: "Recovery",
        status: "Executed",
        accent: "success",
        points: [["Outcome", "PENDING"], ["Detail", "Deferred retry scheduled"]],
        body: "Only approved actions execute, and the full reasoning is recorded for review."
    }
];

function HowItWorksTimeline() {
    const [active, setActive] = useState(0);
    const step = STEPS[active];

    return (
        <section className="rr-home-section" id="how-it-works">
            <p className="rr-eyebrow">How it works</p>
            <h2 className="rr-page-title">AI diagnoses. Policy authorizes.</h2>
            <p className="rr-home-section-sub">
                Select a step to inspect what the system actually did at that stage.
            </p>

            <div className="rr-home-timeline">
                <div className="rr-home-timeline-rail">
                    {STEPS.map((s, i) => (
                        <button
                            type="button"
                            key={s.n}
                            className={`rr-home-timeline-node${i === active ? " is-active" : ""}`}
                            onMouseEnter={() => setActive(i)}
                            onFocus={() => setActive(i)}
                            onClick={() => setActive(i)}
                            aria-pressed={i === active}
                        >
                            <span className="rr-home-timeline-n">{s.n}</span>
                            <span className="rr-home-timeline-title">{s.title}</span>
                        </button>
                    ))}
                </div>

                <div className={`rr-home-timeline-panel accent-${step.accent}`} key={step.n}>
                    <div className="rr-home-timeline-panel-top">
                        <div className="rr-home-timeline-panel-n">{step.n}</div>
                        <span className={`rr-badge ${step.accent === "danger" ? "danger" : step.accent === "success" ? "success" : "info"}`}>
                            <span className="rr-badge-dot" />
                            {step.status}
                        </span>
                    </div>
                    <div className="rr-card-title">{step.title}</div>
                    <p className="rr-home-step-body">{step.body}</p>

                    {step.points.length > 0 && (
                        <div className="rr-home-timeline-points">
                            {step.points.map(([k, v]) => (
                                <div className="rr-kv-row" key={k}>
                                    <span className="k">{k}</span>
                                    <span className="v rr-num">{v}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {step.checklist && (
                        <div className="rr-home-timeline-points rr-home-timeline-checklist">
                            {step.checklist.map((c) => (
                                <div className="rr-timeline-check-row" key={c}>
                                    <span className="rr-timeline-check-mark">✓</span>
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}

                    {step.reason && (
                        <div className="rr-home-timeline-reason">
                            <span className="k">Reason</span>
                            <p>"{step.reason}"</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default HowItWorksTimeline;