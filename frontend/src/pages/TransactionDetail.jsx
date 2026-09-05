import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { getTransactionById } from "../services/api";

function Step({
  label,
  node = "cyan",
  isLast,
  contentClass = "",
  children
}) {
  return (
    <div className="rr-trace-step">
      <div className="rr-trace-rail">
        <div
          className={`rr-trace-node${node === "dim" ? " dim" : ""}`}
        />
        {!isLast && <div className="rr-trace-line" />}
      </div>

      <div className="rr-trace-body">
        <div className="rr-trace-label">{label}</div>

        <div className={`rr-trace-content ${contentClass}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Unavailable({ note }) {
  return (
    <div className="rr-unavailable-note">
      {note}
    </div>
  );
}

function TransactionDetail() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getTransactionById(id)
      .then((data) => {
        if (cancelled) return;

        if (!data.event) {
          setError("Transaction not found.");
          return;
        }

        setEvent(data.event);
        setAnalysis(data.analysis || null);
        setAttempts(data.attempts || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const latestAttempt =
    attempts.length > 0
      ? attempts[attempts.length - 1]
      : null;

  return (
    <PageContainer
      title="Decision Trace"
      subtitle={`Transaction ${id}`}
      actions={
        <Link
          to="/transactions"
          className="rr-btn rr-btn-secondary"
        >
          Back to Transactions
        </Link>
      }
    >
      <div className="rr-card">
        {error && (
          <ErrorState
            title="Couldn't load this transaction"
            message={error}
          />
        )}

        {!error && loading && (
          <LoadingState label="Loading decision trace…" />
        )}

        {!error && !loading && event && (
          <div className="rr-trace">
            <Step label="1 · Payment Event">
              <div className="rr-kv-row">
                <span className="k">Customer</span>
                <span className="v">
                  {event.customerId}
                </span>
              </div>

              <div className="rr-kv-row">
                <span className="k">Amount</span>
                <span className="v rr-num">
                  ₹{event.paymentAmount}
                </span>
              </div>

              <div className="rr-kv-row">
                <span className="k">Error Code</span>
                <span className="v">
                  {event.errorCode || "—"}
                </span>
              </div>

              <div className="rr-kv-row">
                <span className="k">Attempt</span>
                <span className="v rr-num">
                  {event.attemptNumber}
                </span>
              </div>

              <div className="rr-kv-row">
                <span className="k">Status</span>
                <span className="v">
                  <StatusBadge status={event.status} />
                </span>
              </div>
            </Step>

            <Step
              label="2 · Customer Context"
              node={analysis?.customerContext ? "cyan" : "dim"}
            >
              {analysis?.customerContext ? (
                <>
                  <div className="rr-kv-row">
                    <span className="k">
                      Successful Payments
                    </span>
                    <span className="v rr-num">
                      {analysis.customerContext.successfulPayments}
                    </span>
                  </div>

                  <div className="rr-kv-row">
                    <span className="k">
                      Total Payments
                    </span>
                    <span className="v rr-num">
                      {analysis.customerContext.totalPayments}
                    </span>
                  </div>

                  <div className="rr-kv-row">
                    <span className="k">
                      Prior Recovery Attempts
                    </span>
                    <span className="v rr-num">
                      {analysis.customerContext.recoveryAttempts}
                    </span>
                  </div>
                </>
              ) : (
                <Unavailable note="Customer context is not available for this event." />
              )}
            </Step>

            <Step
              label="3 · Risk Assessment"
              node={analysis?.riskAssessment ? "cyan" : "dim"}
              contentClass="rr-trace-content--risk"
            >
              {analysis?.riskAssessment ? (
                <>
                  <div className="rr-kv-row">
                    <span className="k">
                      Risk Score
                    </span>
                    <span className="v rr-num">
                      {analysis.riskAssessment.riskScore}
                    </span>
                  </div>

                  <div className="rr-kv-row">
                    <span className="k">
                      Risk Band
                    </span>
                    <span className="v">
                      <StatusBadge
                        status={analysis.riskAssessment.riskBand}
                      />
                    </span>
                  </div>
                </>
              ) : (
                <Unavailable note="Risk assessment is not available for this event." />
              )}
            </Step>

            <Step
              label="4 · AI Recommendation (Gemini / Deterministic Fallback)"
              node={analysis ? "cyan" : "dim"}
              contentClass="rr-trace-content--ai"
            >
              {analysis ? (
                <>
                  <div className="rr-kv-row">
                    <span className="k">
                      Source
                    </span>
                    <span className="v">
                      {analysis.source}
                    </span>
                  </div>

                  <div className="rr-kv-row">
                    <span className="k">
                      Recommendation
                    </span>
                    <span className="v">
                      <StatusBadge
                        status={analysis.recommendation}
                      />
                    </span>
                  </div>

                  <div className="rr-kv-row">
                    <span className="k">
                      Confidence
                    </span>
                    <span className="v rr-num">
                      {Math.round(
                        (analysis.confidence ?? 0) * 100
                      )}
                      %
                    </span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div
                      className="k"
                      style={{ marginBottom: 3 }}
                    >
                      Analysis Summary
                    </div>

                    <p style={{ color: "var(--rr-text-dim)" }}>
                      {analysis.analysisSummary}
                    </p>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div
                      className="k"
                      style={{ marginBottom: 3 }}
                    >
                      Reasoning
                    </div>

                    <p style={{ color: "var(--rr-text-dim)" }}>
                      {analysis.reasoning}
                    </p>
                  </div>
                </>
              ) : (
                <Unavailable note="No AI analysis record exists for this event." />
              )}
            </Step>

            <Step
              label="5 · Policy Decision"
              node={analysis?.policyDecision ? "cyan" : "dim"}
              contentClass="rr-trace-content--policy"
            >
              {analysis?.policyDecision ? (
                <>
                  <div className="rr-kv-row">
                    <span className="k">
                      Decision
                    </span>
                    <span className="v">
                      <StatusBadge
                        status={analysis.policyDecision}
                      />
                    </span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div
                      className="k"
                      style={{ marginBottom: 3 }}
                    >
                      Reason
                    </div>

                    <p style={{ color: "var(--rr-text-dim)" }}>
                      {analysis.policyReason}
                    </p>
                  </div>
                </>
              ) : (
                <Unavailable note="No policy decision recorded for this event." />
              )}
            </Step>

            <Step
              label="6 · Recovery Outcome"
              node={
                analysis?.policyDecision === "BLOCKED" ||
                  analysis?.policyDecision === "ESCALATED"
                  ? "dim"
                  : latestAttempt
                    ? "cyan"
                    : "dim"
              }
              contentClass="rr-trace-content--recovery"
              isLast
            >
              {analysis?.policyDecision === "BLOCKED" ||
                analysis?.policyDecision === "ESCALATED" ? (
                <Unavailable
                  note={
                    `No recovery action was executed — the policy decision (${analysis.policyDecision}) does not permit automatic execution.`
                  }
                />
              ) : latestAttempt ? (
                <>
                  <div className="rr-kv-row">
                    <span className="k">Action</span>
                    <span className="v">
                      {latestAttempt.action}
                    </span>
                  </div>

                  <div className="rr-kv-row">
                    <span className="k">Outcome</span>
                    <span className="v">
                      <StatusBadge status={latestAttempt.outcome} />
                    </span>
                  </div>

                  {latestAttempt.outcomeDetails && (
                    <div style={{ marginTop: 8 }}>
                      <div
                        className="k"
                        style={{ marginBottom: 3 }}
                      >
                        Details
                      </div>

                      <p style={{ color: "var(--rr-text-dim)" }}>
                        {latestAttempt.outcomeDetails}
                      </p>
                    </div>
                  )}

                  {latestAttempt.nextRetryAt && (
                    <div className="rr-kv-row">
                      <span className="k">Next Retry</span>
                      <span className="v">
                        {new Date(
                          latestAttempt.nextRetryAt
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {latestAttempt.paymentLinkId && (
                    <div className="rr-kv-row">
                      <span className="k">Payment Link ID</span>
                      <span className="v">
                        {latestAttempt.paymentLinkId}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <Unavailable note="No recovery attempt has been recorded for this event." />
              )}
            </Step>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default TransactionDetail;