import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


const LINKS = [
    { href: "#product", label: "Product" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#guardrails", label: "Guardrails" },
    { href: "#trace", label: "Decision Trace" }
];

function PublicNavbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const closeMenu = () => setOpen(false);

    return (
        <header className={`rr-home-nav${scrolled ? " is-scrolled" : ""}`}>
            <div className="rr-home-nav-inner">
                <Link to="/" className="rr-home-nav-brand" onClick={closeMenu}>
                    <img
                        src="/logo-wordmark.png"
                        alt="Revenue Rescue AI"
                        className="rr-home-nav-wordmark"
                    />
                </Link>

                <nav className="rr-home-nav-links" aria-label="Primary">
                    {LINKS.map((link) => (
                        <a key={link.href} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="rr-home-nav-actions">
                    <Link to="/login" className="rr-btn rr-btn-secondary">
                        Login
                    </Link>
                    <Link to="/signup" className="rr-btn rr-btn-primary">
                        Get Started
                    </Link>
                </div>

                <button
                    type="button"
                    className={`rr-home-nav-toggle${open ? " is-open" : ""}`}
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <div className={`rr-home-nav-mobile${open ? " is-open" : ""}`}>
                <div className="rr-home-nav-mobile-inner">
                    {LINKS.map((link) => (
                        <a key={link.href} href={link.href} onClick={closeMenu}>
                            {link.label}
                        </a>
                    ))}
                    <div className="rr-home-nav-mobile-actions">
                        <Link to="/login" className="rr-btn rr-btn-secondary" onClick={closeMenu}>
                            Login
                        </Link>
                        <Link to="/signup" className="rr-btn rr-btn-primary" onClick={closeMenu}>
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default PublicNavbar;