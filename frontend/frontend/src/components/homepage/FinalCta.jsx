import { Link } from "react-router-dom";

function FinalCta() {
    return (
        <section className="rr-home-final-cta">
            <div className="rr-home-final-cta-glow" aria-hidden="true" />
            <h2>Recover more revenue. Keep control deterministic.</h2>
            <p>See how Revenue Rescue AI turns a failed payment into a governed recovery decision.</p>
            <div className="rr-home-hero-ctas">
                <Link to="/signup" className="rr-btn rr-btn-primary">Get Started</Link>
                <Link to="/login" className="rr-btn rr-btn-secondary">Login</Link>
            </div>
        </section>
    );
}

export default FinalCta;