import PublicNavbar from "../components/homepage/PublicNavbar";
import Hero from "../components/homepage/Hero";
import ProductSignals from "../components/homepage/ProductSignals";
import RecoveryActivityStrip from "../components/homepage/RecoveryActivityStrip";
import ProblemScenarios from "../components/homepage/ProblemScenarios";
import DecisionPipeline from "../components/homepage/DecisionPipeline";
import RevenueFlow from "../components/homepage/RevenueFlow";
import HowItWorksTimeline from "../components/homepage/HowItWorksTimeline";
import GuardrailsSection from "../components/homepage/GuardrailsSection";
import RecoveryOutcome from "../components/homepage/RecoveryOutcome";
import MerchantConsolePreview from "../components/homepage/MerchantConsolePreview";
import DecisionTracePreview from "../components/homepage/DecisionTracePreview";
import Capabilities from "../components/homepage/Capabilities";
import EvaluationPreview from "../components/homepage/EvaluationPreview";
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
                    <RecoveryActivityStrip />
                </div>

                <ProblemScenarios />
                <DecisionPipeline />
                <RevenueFlow />
                <HowItWorksTimeline />
                <GuardrailsSection />
                <RecoveryOutcome />
                <MerchantConsolePreview />

                <section className="rr-home-section rr-section-bg--trace" id="trace">
                    <p className="rr-eyebrow">Decision trace</p>
                    <h2 className="rr-page-title">Every recovery, fully explainable.</h2>
                    <p className="rr-home-section-sub">
                        Every decision leaves a trace — what happened, why, and what the system
                        actually did about it.
                    </p>
                    <DecisionTracePreview />
                </section>

                <Capabilities />
                <EvaluationPreview />
                <FinalCta />
            </main>

            <Footer />
        </div>
    );
}

export default Homepage;