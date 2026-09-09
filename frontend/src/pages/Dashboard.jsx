import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/dashboard.css";

import PageContainer from "../components/layout/PageContainer";
import RevenueOverview from "../components/dashboard/RevenueOverview";
import LatestDecisionCard from "../components/dashboard/LatestDecisionCard";
import RecoveryActivityFeed from "../components/dashboard/RecoveryActivityFeed";
import RecoveryPerformancePanel from "../components/dashboard/RecoveryPerformancePanel";
import RecoveryBreakdownPanel from "../components/dashboard/RecoveryBreakdownPanel";
import RecentEvents from "../components/dashboard/RecentEvents";

import TransactionForm from "../components/transactions/TransactionForm";
import AnalysisResult from "../components/transactions/AnalysisResult";
import ErrorState from "../components/common/ErrorState";

import {
  getDashboardMetrics,
  getTransactions,
  getTransactionById,
  getRecoveryQueue,
  processTransaction
} from "../services/api";

const getSimulationSteps = (eventType) => {
  if (eventType === "CHECKOUT_ABANDONED") {
    return [
      { key: "received", label: "Event received" },
      { key: "engine", label: "Checkout evaluated" },
      { key: "policy", label: "Policy evaluated" },
      { key: "recovery", label: "Reminder recorded" }
    ];
  }

  return [
    { key: "received", label: "Event received" },
    { key: "engine", label: "Decision engine" },
    { key: "policy", label: "Policy evaluated" },
    { key: "recovery", label: "Recovery recorded" }
  ];
};

function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recoveryQueue, setRecoveryQueue] = useState([]);
  const [latestDecision, setLatestDecision] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [simError, setSimError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [simulationState, setSimulationState] = useState("idle");
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationEventType, setSimulationEventType] = useState("PAYMENT_FAILURE");
  const [result, setResult] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [metricsData, transactionData, recoveryData] =
        await Promise.all([
          getDashboardMetrics(),
          getTransactions(),
          getRecoveryQueue()
        ]);

      const safeTransactions = Array.isArray(transactionData)
        ? transactionData
        : [];

      const safeRecovery = Array.isArray(recoveryData)
        ? recoveryData
        : [];

      const recentFailed = safeTransactions
        .filter((event) => event?.status === "FAILED")
        .slice(0, 5);

      let decision = null;

      for (const event of recentFailed) {
        try {
          const detail = await getTransactionById(event.eventId);

          if (detail?.event && detail?.analysis) {
            decision = detail;
            break;
          }
        } catch {
          // Continue to the next recent failed event.
        }
      }

      setMetrics(metricsData);
      setTransactions(safeTransactions);
      setRecoveryQueue(safeRecovery);
      setLatestDecision(decision);
    } catch (error) {
      setLoadError(
        error?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activity = useMemo(() => {
    return recoveryQueue
      .slice(0, 5)
      .map((attempt) => {
        const event =
          attempt?.event && typeof attempt.event === "object"
            ? attempt.event
            : null;

        return {
          eventId: event?.eventId || attempt?.eventId,
          errorCode: event?.errorCode || "PAYMENT_RECOVERY",
          paymentAmount:
            event?.paymentAmount ??
            attempt?.paymentAmount ??
            0,
          action: attempt?.action || null,
          outcome: attempt?.outcome || "PENDING",
          timestamp:
            attempt?.createdAt ||
            attempt?.updatedAt ||
            event?.timestamp ||
            null
        };
      })
      .filter((item) => item.eventId);
  }, [recoveryQueue]);

  const handleTransactionSubmit = async (transaction) => {
    setSimError(null);
    setResult(null);
    setSubmitting(true);
    setSimulationState("submitting");
    setSimulationStep(0);
    setSimulationEventType(transaction?.eventType || "PAYMENT_FAILURE");

    const startedAt = Date.now();

    try {
      const data = await processTransaction(transaction);

      // Give the pipeline animation enough time to communicate the four
      // stages even when the API responds very quickly. This is presentation
      // state only; it does not claim that the backend emits stage telemetry.
      const elapsed = Date.now() - startedAt;
      const minimumPresentationTime = 2800;
      const remaining = Math.max(0, minimumPresentationTime - elapsed);

      if (remaining) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }

      setSimulationStep(simulationSteps.length - 1);
      setResult(data);
      setSimulationState("complete");
      setSubmitting(false);
      await loadDashboard();
    } catch (error) {
      setSimulationState("error");
      setSimError(error?.message || "Analysis failed.");
      setSubmitting(false);
    }
  };

  const simulationSteps = getSimulationSteps(simulationEventType);

  useEffect(() => {
    if (!submitting) return undefined;

    const timer = window.setInterval(() => {
      setSimulationStep((current) =>
        Math.min(current + 1, simulationSteps.length - 1)
      );
    }, 700);

    return () => window.clearInterval(timer);
  }, [submitting, simulationSteps.length]);

  return (
    <div className="rr-dashboard-page">
      <PageContainer
        eyebrow="Operations"
        title="Recovery operations"
        subtitle="Monitor recovery opportunity, inspect governed decisions, and run controlled events through the same recovery engine used by the application."
        actions={
          <div className="rr-command-links">
            <button type="button" className="rr-dashboard-link-button" onClick={() => navigate("/transactions")}>
              View transactions <span>→</span>
            </button>
            <span className="rr-command-divider" />
            <button type="button" className="rr-dashboard-link-button" onClick={() => navigate("/analytics")}>
              View analytics <span>→</span>
            </button>
          </div>
        }
      >
        <section className="rr-dashboard-command">

          <div
            className="rr-dashboard-simulator"
            data-event-type={simulationEventType}
          >
            <div className="rr-dashboard-simulator-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">Sandbox</span>
                <h3>Simulate a recovery event</h3>
              </div>
              <span className="rr-dashboard-live-dot">
                {submitting ? "PROCESSING" : result ? "DECISION READY" : "LIVE ENGINE"}
              </span>
            </div>

            <p className="rr-dashboard-panel-description">
              Run a controlled sandbox event through context, risk, recommendation, policy and recovery without touching live payment traffic.
            </p>

            {submitting && (
              <div className="rr-simulation-progress" aria-live="polite">
                {simulationSteps.map((step, index) => (
                  <div className={`rr-simulation-step ${index < simulationStep ? "is-complete" : ""} ${index === simulationStep ? "is-active" : ""}`} key={step.key}>
                    <span className="rr-simulation-step-node">
                      <span className="rr-simulation-step-dot">{index < simulationStep ? "✓" : index + 1}</span>
                      <span>{step.label}</span>
                    </span>
                    {index < simulationSteps.length - 1 && (
                      <span className={`rr-simulation-connector ${index < simulationStep ? "is-complete" : ""}`}>
                        {index === simulationStep && <span className="rr-simulation-travel-dot" />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="rr-dashboard-simulator-grid">
              <div className="rr-dashboard-simulator-form">
                <TransactionForm onSubmit={handleTransactionSubmit} submitting={submitting} />
              </div>

              <div className="rr-dashboard-simulator-result">
                {simError && <ErrorState title="Simulation failed" message={simError} />}

                {!simError && !submitting && !result && (
                  <div className="rr-simulator-placeholder">
                    <span className="rr-simulator-placeholder-line" />
                    <strong>Run a scenario</strong>
                    <p>The returned recommendation, policy decision and recovery outcome will appear here.</p>
                    <div className="rr-simulator-coverage">
                      <span>Risk</span>
                      <span>AI / fallback</span>
                      <span>Policy</span>
                      <span>Recovery</span>
                      <span>Outcome</span>
                    </div>
                  </div>
                )}

                {submitting && (
                  <div className="rr-simulator-processing">
                    <span className="rr-processing-ring" />
                    <div>
                      <strong>
                        {simulationSteps[simulationStep]?.label ||
                          (simulationEventType === "CHECKOUT_ABANDONED"
                            ? "Evaluating abandoned checkout"
                            : "Evaluating payment failure")}
                      </strong>
                      <p>Running the governed recovery pipeline…</p>
                    </div>
                  </div>
                )}

                {result && !submitting && !simError && (
                  <div className="rr-simulator-result-scroll">
                    <div className="rr-simulation-result-banner">
                      <div>
                        <span>Decision returned</span>
                        <strong>Engine run completed</strong>
                      </div>
                      <span className="rr-result-ready">● Ready</span>
                    </div>
                    <AnalysisResult result={result} />
                    {result?.event?.eventId && (
                      <button type="button" className="rr-dashboard-primary-action rr-dashboard-primary-action--full" onClick={() => navigate(`/transactions/${result.event.eventId}`)}>
                        Open decision trace <span>→</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rr-dashboard-section">
          <RevenueOverview
            metrics={metrics}
            recoveryQueue={recoveryQueue}
            loading={loading}
            error={loadError}
          />
        </section>

        <section className="rr-dashboard-section rr-dashboard-workspace">
          <div className="rr-dashboard-panel rr-dashboard-decision">
            <div className="rr-dashboard-panel-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">
                  Latest decision
                </span>
                <h3>Recovery decision</h3>
              </div>

              {latestDecision?.event?.eventId && (
                <button
                  type="button"
                  className="rr-dashboard-link-button"
                  onClick={() =>
                    navigate(
                      `/transactions/${latestDecision.event.eventId}`
                    )
                  }
                >
                  Open trace <span>→</span>
                </button>
              )}
            </div>

            <LatestDecisionCard
              decision={latestDecision}
              loading={loading}
              error={loadError}
            />
          </div>

          <div className="rr-dashboard-panel rr-dashboard-queue">
            <div className="rr-dashboard-panel-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">
                  Recovery queue
                </span>
                <h3>Recent activity</h3>
              </div>

              <button
                type="button"
                className="rr-dashboard-link-button"
                onClick={() => navigate("/recovery")}
              >
                View queue <span>→</span>
              </button>
            </div>

            <RecoveryActivityFeed
              activity={activity}
              loading={loading}
              error={loadError}
            />
          </div>
        </section>

        <section className="rr-dashboard-section rr-dashboard-analytics">
          <div className="rr-dashboard-panel rr-dashboard-performance">
            <div className="rr-dashboard-panel-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">
                  Performance
                </span>
                <h3>Recovery activity</h3>
              </div>

              <span className="rr-dashboard-panel-note">
                Completed recovery attempts
              </span>
            </div>

            <RecoveryPerformancePanel />
          </div>

          <div className="rr-dashboard-panel rr-dashboard-breakdown">
            <div className="rr-dashboard-panel-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">
                  Mix
                </span>
                <h3>Recovery breakdown</h3>
              </div>

              <button
                type="button"
                className="rr-dashboard-link-button"
                onClick={() => navigate("/analytics")}
              >
                Analytics <span>→</span>
              </button>
            </div>

            <RecoveryBreakdownPanel />
          </div>
        </section>

        <section className="rr-dashboard-section">
          <div className="rr-dashboard-panel">
            <div className="rr-dashboard-panel-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">
                  Event stream
                </span>
                <h3>Recent transactions</h3>
              </div>

              <button
                type="button"
                className="rr-dashboard-link-button"
                onClick={() => navigate("/transactions")}
              >
                View all <span>→</span>
              </button>
            </div>

            <RecentEvents
              transactions={transactions}
              loading={loading}
              error={loadError}
            />
          </div>
        </section>
      </PageContainer>
    </div>
  );
}

export default Dashboard;
