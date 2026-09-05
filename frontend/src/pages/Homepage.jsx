import PublicNavbar from "../components/homepage/PublicNavbar";
import Hero from "../components/homepage/Hero";
import ProductSignals from "../components/homepage/ProductSignals";
import ValueSection from "../components/homepage/ValueSection";
import HowItWorksTimeline from "../components/homepage/HowItWorksTimeline.jsx";
import GuardrailsSection from "../components/homepage/Guardrailssection.jsx";
import DecisionTracePreview from "../components/homepage/DecisionTracePreview";
import Capabilities from "../components/homepage/Capabilities";
import FinalCta from "../components/homepage/FinalCta";
import Footer from "../components/homepage/Footer";
import "../styles/homepage.css";

function Homepage() {
    return (
        <div className="rr-home">
            <PublicNavbar />

            <main>
                <Hero />

                <div className="rr-home-signals-wrap">
                    <ProductSignals />
                </div>

                <ValueSection />
                <HowItWorksTimeline />
                <GuardrailsSection />

                <section className="rr-home-section" id="trace">
                    <p className="rr-eyebrow">Decision trace</p>
                    <h2 className="rr-page-title">Every recovery, fully explainable</h2>
                    <DecisionTracePreview />
                </section>

                <Capabilities />
                <FinalCta />
            </main>

            <Footer />
        </div>
    );
}

export default Homepage;