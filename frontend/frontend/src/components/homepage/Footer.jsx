import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="rr-home-footer">
            <div className="rr-home-footer-brand">
                <img
                    src="/logo-wordmark.png"
                    alt="Revenue Rescue AI"
                    className="rr-home-footer-wordmark"
                />

                <p>
                    AI-assisted payment recovery, governed by a deterministic policy engine.
                </p>
            </div>

            <nav className="rr-home-footer-links" aria-label="Footer">
                <a href="#product">Product</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#guardrails">Guardrails</a>
                <a href="#trace">Decision Trace</a>
                <Link to="/login">Login</Link>
                <Link to="/signup">Signup</Link>
            </nav>

            <p className="rr-home-footer-copy">
                © {new Date().getFullYear()} Revenue Rescue AI.
            </p>
        </footer>
    );
}

export default Footer;