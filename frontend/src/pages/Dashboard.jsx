import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import RecoveryOverview from "../components/dashboard/RecoveryOverview";
import RecentEvents from "../components/dashboard/RecentEvents";
import TransactionForm from "../components/transactions/TransactionForm";
import AnalysisResult from "../components/transactions/AnalysisResult";
import ErrorState from "../components/common/ErrorState";
import { processTransaction } from "../services/api";

function Dashboard() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleTransactionSubmit = async (transaction) => {
    setError(null);
    setResult(null);
    setSubmitting(true);

    try {
      const data = await processTransaction(transaction);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      eyebrow="Revenue Intelligence"
      title="Recover revenue. Intelligently."
      subtitle="Analyze failed payments, assess recovery potential, and turn failures into measurable recovery opportunities."
    >
      <div style={{ marginBottom: 24 }}>
        <RecoveryOverview />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: 18,
          marginBottom: 24
        }}
        className="rr-dashboard-grid"
      >
        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">Transaction Simulator</div>
              <div className="rr-card-title-sub">Submit a simulated payment failure event</div>
            </div>
          </div>
          <TransactionForm onSubmit={handleTransactionSubmit} submitting={submitting} />
        </div>

        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">Latest Transaction Intelligence</div>
              <div className="rr-card-title-sub">AI recommendation, risk, policy and recovery outcome</div>
            </div>
          </div>

          {error && <ErrorState title="Analysis failed" message={error} />}

          {!error && !result && (
            <p style={{ color: "var(--rr-muted)", fontSize: 13.5 }}>
              Submit a transaction on the left to see its full decision trace here.
            </p>
          )}

          {result && (
            <>
              <AnalysisResult result={result} />
              <button
                className="rr-btn rr-btn-secondary"
                style={{ marginTop: 14 }}
                onClick={() =>
                  navigate(`/transactions/${result.event.eventId}`, { state: { trace: result } })
                }
              >
                View full decision trace
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rr-card">
        <div className="rr-card-header">
          <div>
            <div className="rr-card-title">Recent Events</div>
            <div className="rr-card-title-sub">Latest processed events</div>
          </div>
        </div>
        <RecentEvents />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .rr-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}

export default Dashboard;
