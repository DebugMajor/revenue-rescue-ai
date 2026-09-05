import { Link } from "react-router-dom";
import RecoveryEngineViz from "./RecoveryEngineViz";
import FloatingPanels from "./FloatingPanels";

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
                    Recover revenue. Keep <span className="accent-violet">AI</span> under control.
                </h1>
                <p className="rr-home-hero-sub">
                    Revenue Rescue AI diagnoses failed payments, evaluates recovery risk, and recommends
                    the next action. A deterministic policy engine decides what is actually allowed to
                    execute.
                </p>
                <p className="rr-home-hero-tenet">
                    <span className="accent-cyan">AI recommends.</span> <span className="accent-blue">Code decides.</span>
                </p>
                <div className="rr-home-hero-ctas">
                    <Link to="/signup" className="rr-btn rr-btn-primary">Get Started</Link>
                    <a href="#trace" className="rr-btn rr-btn-secondary">Explore the Decision Engine</a>
                </div>
            </div>

            <div className="rr-home-hero-viz">
                <FloatingPanels />
                <RecoveryEngineViz />
            </div>
        </section>
    );
}

export default Hero;
