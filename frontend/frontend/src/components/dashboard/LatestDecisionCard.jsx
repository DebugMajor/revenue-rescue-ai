import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/time";
import StatusBadge from "../common/StatusBadge";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function LatestDecisionCard({ decision, loading, error }) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="rr-dashboard-state">
        <ErrorState
          title="Unable to load the latest decision"
          message={error}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState label="Loading latest decision…" />;
  }

  if (!decision?.event || !decision?.analysis) {
    return (
      <EmptyState
        title="No recent governed decision"
        message="Process a failed payment to see its diagnosis, policy decision and recovery outcome here."
      />
    );
  }

  const { event, analysis, attempts = [] } = decision;
  const latestAttempt = attempts.length
    ? attempts[attempts.length - 1]
    : null;

  const context = analysis.customerContext;
  const risk = analysis.riskAssessment;

  const customerLabel =
    context?.totalPayments > 0
      ? `${context.successfulPayments} / ${context.totalPayments} successful`
      : "New customer · no prior history";

  const outcome =
    latestAttempt?.outcome ||
    analysis.policyDecision ||
    "PENDING";

  const recommendation =
    analysis.recommendation?.replaceAll("_", " ") ||
    "Unavailable";

  return (
    <div className="rr-decision-content">
      <div className="rr-decision-summary">
        <div>
          <span className="rr-decision-label">Payment failure</span>
          <div className="rr-decision-error">
            {event.errorCode || "UNKNOWN_ERROR"}
          </div>
          <div className="rr-decision-description">
            {event.eventId}
          </div>
        </div>

        <div className="rr-decision-amount">
          {formatCurrency(event.paymentAmount)}
        </div>
      </div>

      <div className="rr-decision-hero">
        <div>
          <span className="rr-dashboard-field-label">
            Recommended action
          </span>
          <strong>{recommendation}</strong>
        </div>

        <div className="rr-decision-confidence">
          <span className="rr-dashboard-field-label">
            Confidence
          </span>
          <strong>
            {analysis.confidence != null
              ? `${Math.round(analysis.confidence * 100)}%`
              : "—"}
          </strong>
        </div>
      </div>

      <div className="rr-decision-grid">
        <div className="rr-decision-field">
          <span>Customer context</span>
          <strong>{customerLabel}</strong>
        </div>

        <div className="rr-decision-field">
          <span>Risk</span>
          <strong className="rr-decision-inline-value">
            {risk ? <StatusBadge status={risk.riskBand} /> : "—"}
            {risk ? <em>{risk.riskScore}</em> : null}
          </strong>
        </div>

        <div className="rr-decision-field">
          <span>Policy</span>
          <strong>
            {analysis.policyDecision ? (
              <StatusBadge status={analysis.policyDecision} />
            ) : (
              "—"
            )}
          </strong>
        </div>

        <div className="rr-decision-field">
          <span>Outcome</span>
          <strong>
            <StatusBadge status={outcome} />
          </strong>
        </div>

        <div className="rr-decision-field">
          <span>Attempt</span>
          <strong>{event.attemptNumber ?? "—"}</strong>
        </div>

        <div className="rr-decision-field">
          <span>Diagnosis source</span>
          <strong>{analysis.source || "—"}</strong>
        </div>
      </div>

      <div className="rr-decision-reason">
        <span className="rr-dashboard-field-label">
          Why this decision
        </span>
        <p>
          {analysis.reasoning ||
            analysis.analysisSummary ||
            "No decision reasoning was recorded."}
        </p>
      </div>

      <button
        type="button"
        className="rr-dashboard-primary-action rr-dashboard-primary-action--full"
        onClick={() =>
          navigate(`/transactions/${event.eventId}`)
        }
      >
        View full decision trace <span>→</span>
      </button>
    </div>
  );
}

export default LatestDecisionCard;
