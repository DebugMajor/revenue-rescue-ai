import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/time";
import StatusBadge from "../common/StatusBadge";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function LatestDecisionCard({ intelligence, loading, error }) {
    const navigate = useNavigate();

    if (error) {
        return <ErrorState title="Unable to load the latest decision" message={error} />;
    }

    if (loading || intelligence == null) {
        return <LoadingState label="Loading latest decision…" />;
    }

    const decision = intelligence.latestDecision;

    if (!decision) {
        return (
            <EmptyState
                title="Nothing to analyze yet"
                message="Once a failed payment is processed, its full recovery decision will appear here."
            />
        );
    }

    const { event, analysis, attempts } = decision;
    const latestAttempt = attempts?.length ? attempts[attempts.length - 1] : null;
    const context = analysis?.customerContext;
    const risk = analysis?.riskAssessment;
    const isBlockedOrEscalated =
        analysis?.policyDecision === "BLOCKED" || analysis?.policyDecision === "ESCALATED";

    return (
        <div className="rr-latest-decision rr-reveal">
            <div className="rr-latest-decision-head">
                <div className="rr-latest-decision-error">{event.errorCode || "UNKNOWN_ERROR"}</div>
                <div className="rr-latest-decision-amount rr-num">
                    {formatCurrency(event.paymentAmount)}
                </div>
            </div>

            <div className="rr-latest-decision-grid">
                <div className="rr-latest-decision-field">
                    <div className="k">Customer</div>
                    <div className="v">
                        {context
                            ? `${context.successfulPayments} / ${context.totalPayments} successful`
                            : "—"}
                    </div>
                </div>

                <div className="rr-latest-decision-field">
                    <div className="k">Risk</div>
                    <div className="v">
                        {risk ? (
                            <>
                                <StatusBadge status={risk.riskBand} /> <span className="rr-num">{risk.riskScore}</span>
                            </>
                        ) : (
                            "—"
                        )}
                    </div>
                </div>

                <div className="rr-latest-decision-field">
                    <div className="k">AI Recommendation</div>
                    <div className="v">
                        {analysis?.recommendation ? <StatusBadge status={analysis.recommendation} /> : "—"}
                    </div>
                </div>

                <div className="rr-latest-decision-field">
                    <div className="k">Confidence</div>
                    <div className="v rr-num">
                        {analysis?.confidence != null ? `${Math.round(analysis.confidence * 100)}%` : "—"}
                    </div>
                </div>

                <div className="rr-latest-decision-field">
                    <div className="k">Policy</div>
                    <div className="v">
                        {analysis?.policyDecision ? <StatusBadge status={analysis.policyDecision} /> : "—"}
                    </div>
                </div>

                <div className="rr-latest-decision-field">
                    <div className="k">Outcome</div>
                    <div className="v">
                        {isBlockedOrEscalated ? (
                            <StatusBadge status={analysis.policyDecision} />
                        ) : latestAttempt ? (
                            <StatusBadge status={latestAttempt.outcome} />
                        ) : (
                            "—"
                        )}
                    </div>
                </div>

                <div className="rr-latest-decision-field">
                    <div className="k">Attempt</div>
                    <div className="v rr-num">{event.attemptNumber}</div>
                </div>
            </div>

            <button
                className="rr-btn rr-btn-secondary rr-latest-decision-cta"
                onClick={() => navigate(`/transactions/${event.eventId}`)}
            >
                View Decision Trace →
            </button>
        </div>
    );
}

export default LatestDecisionCard;