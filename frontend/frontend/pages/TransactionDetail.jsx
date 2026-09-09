import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import StatusBadge from "../components/common/StatusBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { getTransactionById } from "../services/api";
import "../styles/transaction-detail.css";

function Step({ number, label, node = "cyan", isLast, contentClass = "", children }) {
  return (
    <section className="rr-dt-step">
      <div className="rr-dt-rail" aria-hidden="true">
        <div className={`rr-dt-node${node === "dim" ? " is-dim" : ""}`}>
          {number}
        </div>
        {!isLast && <div className="rr-dt-line" />}
      </div>

      <div className="rr-dt-step-body">
        <div className="rr-dt-step-label">
          <span>{number.toString().padStart(2, "0")}</span>
          {label}
        </div>
        <div className={`rr-dt-content ${contentClass}`.trim()}>
          {children}
        </div>
      </div>
    </section>
  );
}

function KV({ label, value, emphasis = false }) {
  return (
    <div className="rr-dt-kv">
      <span className="rr-dt-k">{label}</span>
      <span className={`rr-dt-v${emphasis ? " is-emphasis" : ""}`}>{value}</span>
    </div>
  );
}

function Unavailable({ note }) {
  return <div className="rr-dt-unavailable">{note}</div>;
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        if (!data?.event) {
          setError("Transaction not found.");
          return;
        }
        setEvent(data.event);
        setAnalysis(data.analysis || null);
        setAttempts(Array.isArray(data.attempts) ? data.attempts : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Unable to load transaction.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const latestAttempt = attempts.length ? attempts[attempts.length - 1] : null;

  const decisionSummary = useMemo(() => {
    if (!event) return null;

    const policy = analysis?.policyDecision || "Not available";
    const recommendation = analysis?.recommendation || "Not available";
    const confidence =
      analysis?.confidence == null
        ? "Not available"
        : `${Math.round(analysis.confidence * 100)}%`;
    const riskScore =
      analysis?.riskAssessment?.riskScore == null
        ? "Not available"
        : Number(analysis.riskAssessment.riskScore).toFixed(2);
    const riskBand = analysis?.riskAssessment?.riskBand || "Not available";

    let outcome = "Not available";
    if (policy === "BLOCKED" || policy === "ESCALATED") {
      outcome = "NOT EXECUTED";
    } else if (latestAttempt?.outcome) {
      outcome = latestAttempt.outcome;
    } else if (latestAttempt) {
      outcome = "RECOVERY RECORDED";
    }

    return { policy, recommendation, confidence, riskScore, riskBand, outcome };
  }, [event, analysis, latestAttempt]);

  return (
    <PageContainer
      eyebrow="DECISION TRACE"
      title="Transaction decision"
      subtitle={`Transaction ${id}`}
      actions={
        <Link to="/transactions" className="rr-btn rr-btn-secondary">
          ← Back to Transactions
        </Link>
      }
    >
      {error && <ErrorState title="Couldn't load this transaction" message={error} />}

      {!error && loading && <LoadingState label="Loading decision trace…" />}

      {!error && !loading && event && decisionSummary && (
        <div className="rr-decision-trace-page">
          <div className="rr-dt-summary">
            <div className="rr-dt-summary-top">
              <div>
                <div className="rr-dt-summary-kicker">TRANSACTION SUMMARY</div>
                <h2>Recovery decision</h2>
                <p>Recorded outcome and governed decision for this payment event.</p>
              </div>
              <StatusBadge status={event.status} />
            </div>

            <div className="rr-dt-summary-grid">
              <div className="rr-dt-summary-item">
                <span>Customer</span>
                <strong>{event.customerId}</strong>
              </div>
              <div className="rr-dt-summary-item">
                <span>Amount</span>
                <strong>{formatAmount(event.paymentAmount)}</strong>
              </div>
              <div className="rr-dt-summary-item">
                <span>Failure</span>
                <strong className="rr-dt-mono">{event.errorCode || "—"}</strong>
              </div>
              <div className="rr-dt-summary-item">
                <span>Attempt</span>
                <strong>{event.attemptNumber ?? "—"}</strong>
              </div>
            </div>
          </div>

          <div className="rr-dt-layout">
            <main className="rr-dt-trace-column" aria-label="Decision trace">
              <div className="rr-dt-trace-card">
                <div className="rr-dt-trace-card-head">
                  <div>
                    <span className="rr-dt-section-kicker">AUDIT TRAIL</span>
                    <h2>How the decision was made</h2>
                  </div>
                  <span className="rr-dt-sequence">6 stages</span>
                </div>

                <div className="rr-trace rr-dt-trace">
                  <Step number={1} label="Payment Event">
                    <KV label="Customer" value={event.customerId || "Not available"} />
                    <KV label="Amount" value={formatAmount(event.paymentAmount)} emphasis />
                    <KV label="Error Code" value={event.errorCode || "Not available"} />
                    <KV label="Attempt" value={event.attemptNumber ?? "Not available"} />
                    <KV label="Status" value={<StatusBadge status={event.status} />} />
                  </Step>

                  <Step
                    number={2}
                    label="Customer Context"
                    node={analysis?.customerContext ? "cyan" : "dim"}
                  >
                    {analysis?.customerContext ? (
                      <>
                        <KV label="Successful Payments" value={analysis.customerContext.successfulPayments} />
                        <KV label="Total Payments" value={analysis.customerContext.totalPayments} />
                        <KV label="Prior Recovery Attempts" value={analysis.customerContext.recoveryAttempts} />
                      </>
                    ) : (
                      <Unavailable note="Customer context is not available for this event." />
                    )}
                  </Step>

                  <Step
                    number={3}
                    label="Risk Assessment"
                    node={analysis?.riskAssessment ? "cyan" : "dim"}
                    contentClass="rr-dt-content--risk"
                  >
                    {analysis?.riskAssessment ? (
                      <>
                        <KV label="Risk Score" value={Number(analysis.riskAssessment.riskScore).toFixed(2)} emphasis />
                        <KV label="Risk Band" value={<StatusBadge status={analysis.riskAssessment.riskBand} />} />
                      </>
                    ) : (
                      <Unavailable note="Risk assessment is not available for this event." />
                    )}
                  </Step>

                  <Step
                    number={4}
                    label="AI Recommendation"
                    node={analysis ? "cyan" : "dim"}
                    contentClass="rr-dt-content--ai"
                  >
                    {analysis ? (
                      <>
                        <div className="rr-dt-ai-topline">
                          <span className="rr-dt-ai-source">{analysis.source || "Not available"}</span>
                          <StatusBadge status={analysis.recommendation} />
                        </div>
                        <KV
                          label="Confidence"
                          value={
                            analysis.confidence == null
                              ? "Not available"
                              : `${Math.round(analysis.confidence * 100)}%`
                          }
                          emphasis
                        />
                        <div className="rr-dt-copy-block">
                          <div className="rr-dt-copy-label">Analysis Summary</div>
                          <p>{analysis.analysisSummary || "No summary was recorded."}</p>
                        </div>
                        <div className="rr-dt-copy-block">
                          <div className="rr-dt-copy-label">Reasoning</div>
                          <p>{analysis.reasoning || "No reasoning was recorded."}</p>
                        </div>
                      </>
                    ) : (
                      <Unavailable note="No AI analysis record exists for this event." />
                    )}
                  </Step>

                  <Step
                    number={5}
                    label="Policy Decision"
                    node={analysis?.policyDecision ? "cyan" : "dim"}
                    contentClass="rr-dt-content--policy"
                  >
                    {analysis?.policyDecision ? (
                      <>
                        <div className="rr-dt-policy-topline">
                          <span className="rr-dt-policy-label">Deterministic gate</span>
                          <StatusBadge status={analysis.policyDecision} />
                        </div>
                        <div className="rr-dt-copy-block">
                          <div className="rr-dt-copy-label">Reason</div>
                          <p>{analysis.policyReason || "No policy reason was recorded."}</p>
                        </div>
                      </>
                    ) : (
                      <Unavailable note="No policy decision was recorded for this event." />
                    )}
                  </Step>

                  <Step
                    number={6}
                    label="Recovery Outcome"
                    node={latestAttempt && analysis?.policyDecision !== "BLOCKED" && analysis?.policyDecision !== "ESCALATED" ? "cyan" : "dim"}
                    contentClass="rr-dt-content--recovery"
                    isLast
                  >
                    {analysis?.policyDecision === "BLOCKED" || analysis?.policyDecision === "ESCALATED" ? (
                      <div className="rr-dt-outcome-block is-muted">
                        <div>
                          <span className="rr-dt-outcome-title">NOT EXECUTED</span>
                          <span className="rr-dt-outcome-subtitle">
                            Policy prevented automatic recovery.
                          </span>
                        </div>
                        <StatusBadge status={analysis.policyDecision} />
                        <p>{analysis.policyReason || "Human review or a non-automatic outcome was required."}</p>
                      </div>
                    ) : latestAttempt ? (
                      <div className="rr-dt-outcome-block">
                        <div className="rr-dt-outcome-main">
                          <div>
                            <span className="rr-dt-outcome-title">{latestAttempt.outcome || "RECOVERY RECORDED"}</span>
                            <span className="rr-dt-outcome-subtitle">
                              {latestAttempt.action || "Action not available"}
                            </span>
                          </div>
                          {latestAttempt.outcome && <StatusBadge status={latestAttempt.outcome} />}
                        </div>
                        {latestAttempt.outcomeDetails && <p>{latestAttempt.outcomeDetails}</p>}
                        {latestAttempt.nextRetryAt && (
                          <KV label="Next Retry" value={formatDate(latestAttempt.nextRetryAt)} />
                        )}
                        {latestAttempt.paymentLinkId && (
                          <KV label="Payment Link ID" value={latestAttempt.paymentLinkId} />
                        )}
                      </div>
                    ) : (
                      <Unavailable note="No recovery attempt has been recorded for this event." />
                    )}
                  </Step>
                </div>
              </div>
            </main>

            <aside className="rr-dt-summary-column" aria-label="Decision summary">
              <div className="rr-dt-side-card rr-dt-side-card--primary">
                <span className="rr-dt-section-kicker">DECISION SUMMARY</span>
                <div className="rr-dt-decision-hero">
                  <span>Recommendation</span>
                  <strong>{decisionSummary.recommendation}</strong>
                </div>

                <div className="rr-dt-side-rows">
                  <KV label="Confidence" value={decisionSummary.confidence} emphasis />
                  <KV label="Risk" value={`${decisionSummary.riskBand} · ${decisionSummary.riskScore}`} />
                  <KV label="Policy" value={<StatusBadge status={decisionSummary.policy} />} />
                  <KV label="Outcome" value={<StatusBadge status={decisionSummary.outcome} />} />
                </div>
              </div>

              <div className="rr-dt-side-card">
                <span className="rr-dt-section-kicker">GOVERNANCE</span>
                <div className="rr-dt-governance">
                  <div className="rr-dt-governance-step is-ai">
                    <span>01</span>
                    <div>
                      <strong>AI recommends</strong>
                      <small>{analysis?.source || "No analysis source recorded"}</small>
                    </div>
                  </div>
                  <div className="rr-dt-governance-connector" />
                  <div className="rr-dt-governance-step is-policy">
                    <span>02</span>
                    <div>
                      <strong>Policy governs</strong>
                      <small>{decisionSummary.policy}</small>
                    </div>
                  </div>
                  <div className="rr-dt-governance-connector" />
                  <div className="rr-dt-governance-step is-execution">
                    <span>03</span>
                    <div>
                      <strong>Code executes</strong>
                      <small>
                        {latestAttempt?.action || "No automatic action recorded"}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rr-dt-side-card">
                <span className="rr-dt-section-kicker">EVENT METADATA</span>
                <div className="rr-dt-side-rows">
                  <KV label="Transaction ID" value={id} />
                  <KV label="Recorded" value={formatDate(event.timestamp)} />
                  <KV label="Recovery attempts" value={attempts.length} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default TransactionDetail;
