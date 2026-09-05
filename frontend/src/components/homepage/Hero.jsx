import { Link } from "react-router-dom";
import RecoveryEngineViz from "./RecoveryEngineViz";

function Hero() {
    return (
        <section className="rr-home-hero">
            <div className="rr-home-hero-bg" aria-hidden="true">
                <div className="rr-home-hero-grid" />
                <div className="rr-home-hero-glow rr-home-hero-glow--cyan" />
                <div className="rr-home-hero-glow rr-home-hero-glow--violet" />
            </div>

            <div className="rr-home-hero-copy">
                <p className="rr-eyebrow">Revenue Intelligence</p>
                <h1>
                    Recover lost <span className="accent-cyan">revenue</span> without giving{" "}
                    <span className="accent-violet">AI</span> <span className="accent-blue">control</span> over
                    your money.
                </h1>
                <p className="rr-home-hero-sub">
                    Payment failures need context, not guesses. Revenue Rescue AI diagnoses each one and
                    recommends a fix — but a deterministic policy engine, not the model, decides what actually
                    executes. Every step of that decision is logged and auditable.
                </p>
                <div className="rr-home-hero-ctas">
                    <Link to="/signup" className="rr-btn rr-btn-primary">Get Started</Link>
                    <a href="#trace" className="rr-btn rr-btn-secondary">Explore the Decision Engine</a>
                </div>
            </div>

            <div className="rr-home-hero-viz">
                <RecoveryEngineViz />
            </div>
        </section>
    );
}

export default Hero;