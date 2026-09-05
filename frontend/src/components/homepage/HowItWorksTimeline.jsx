import { useState } from "react";

const STEPS = [
    {
        n: "01",
        title: "Event",
        status: "Received",
        accent: "danger",
        points: [["Source", "Razorpay webhook"], ["Error", "NETWORK_ERROR"], ["Amount", "₹12,345"]],
        body: "A payment failure or recovery event enters the system, from a webhook or a manual trigger."
    },
    {
        n: "02",
        title: "Context + Risk",
        status: "Computed",
        accent: "cyan",
        points: [["Prior payments", "8 total, 6 successful"], ["Risk band", "MEDIUM"], ["Risk score", "0.52"]],
        body: "Customer history and a deterministic risk score are calculated before any AI involvement."
    },
    {
        n: "03",
        title: "AI Diagnosis",
        status: "Recommended",
        accent: "violet",
        points: [["Model", "Gemini"], ["Recommendation", "WAIT_AND_RETRY"], ["Confidence", "80%"]],
        body: "Gemini reviews the event and context, then recommends one bounded recovery action."
    },
    {
        n: "04",
        title: "Policy Gate",
        status: "Approved",
        accent: "blue",
        points: [["Risk check", "Passed"], ["Confidence check", "Passed"], ["Amount limit", "Within threshold"]],
        body: "Deterministic rules — not the AI — decide whether that recommendation is allowed to run."
    },
    {
        n: "05",
        title: "Recovery + Audit",
        status: "Executed",
        accent: "success",
        points: [["Action", "Deferred retry scheduled"], ["Outcome", "PENDING"], ["Trace", "Fully logged"]],
        body: "The approved action executes within limits, and the full reasoning is recorded for review."
    }
];

function HowItWorksTimeline() {
    const [active, setActive] = useState(0);
    const step = STEPS[active];

    return (
        <section className="rr-home-section" id="how-it-works">
            <p className="rr-eyebrow">How it works</p>
            <h2 className="rr-page-title">From failure to recovery, in five governed steps</h2>

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

                    <div className="rr-home-timeline-points">
                        {step.points.map(([k, v]) => (
                            <div className="rr-kv-row" key={k}>
                                <span className="k">{k}</span>
                                <span className="v">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HowItWorksTimeline;
