import PublicNavbar from "../components/homepage/PublicNavbar";
import Hero from "../components/homepage/Hero";
import ProblemScenarios from "../components/homepage/ProblemScenarios";
import DecisionPipeline from "../components/homepage/DecisionPipeline";
import GuardrailsSection from "../components/homepage/Guardrailssection";
import MerchantConsolePreview from "../components/homepage/MerchantConsolePreview";
import DecisionTracePreview from "../components/homepage/DecisionTracePreview";
import EvaluationPreview from "../components/homepage/EvaluationPreview";
import FinalCta from "../components/homepage/Finalcta";
import Footer from "../components/homepage/Footer";
import "../styles/homepage.css";

function Homepage() {
    return (
        <div className="rr-home">
            <PublicNavbar />

            <main>
                <Hero />

                <ProblemScenarios />
                <DecisionPipeline />
                <GuardrailsSection />
                <MerchantConsolePreview />

                <section
                    className="rr-home-section rr-section-bg--trace"
                    id="trace"
                >
                    <p className="rr-eyebrow">Decision trace</p>
                    <h2 className="rr-page-title">
                        Every recovery, fully explainable.
                    </h2>
                    <p className="rr-home-section-sub">
                        Every decision leaves a trace — what happened, why, and
                        what the system actually did about it.
                    </p>
                    <DecisionTracePreview />
                </section>

                <EvaluationPreview />
                <FinalCta />
            </main>

            <Footer />
        </div>
    );
}

export default Homepage;
