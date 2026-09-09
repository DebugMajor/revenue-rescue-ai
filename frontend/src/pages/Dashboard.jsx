import { useEffect, useMemo, useRef, useState } from "react";
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

function Dashboard() {
  const navigate = useNavigate();
  const resultRef = useRef(null);

  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recoveryQueue, setRecoveryQueue] = useState([]);
  const [latestDecision, setLatestDecision] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [result, setResult] = useState(null);
  const [simError, setSimError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [simulationState, setSimulationState] = useState("idle");

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

    try {
      const data = await processTransaction(transaction);

      setSimulationState("complete");
      setResult(data);

      await loadDashboard();

      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    } catch (error) {
      setSimulationState("error");
      setSimError(error?.message || "Analysis failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const simulationSteps = [
    {
      key: "submitting",
      label: "Event received"
    },
    {
      key: "analyzing",
      label: "Decision engine"
    },
    {
      key: "policy",
      label: "Policy evaluated"
    },
    {
      key: "recovery",
      label: "Recovery recorded"
    }
  ];

  const simulationStepIndex =
    simulationState === "submitting" ? 1 :
    simulationState === "complete" ? 4 :
    simulationState === "error" ? 2 : 0;

  return (
    <div className="rr-dashboard-page">
      <PageContainer
        eyebrow="Operations"
        title="Recovery overview"
        subtitle="Monitor recovery opportunity, inspect governed decisions, and run a payment failure through the same engine used by the application."
      >
        <section className="rr-dashboard-command">
          <div className="rr-dashboard-command-copy">
            <span className="rr-dashboard-kicker">Today</span>
            <h2>Recovery operations at a glance</h2>
            <p>
              Start with the live engine, inspect the most recent decision,
              then follow what happened through the recovery queue.
            </p>

            <div className="rr-command-links">
              <button
                type="button"
                className="rr-dashboard-link-button"
                onClick={() => navigate("/transactions")}
              >
                View transactions <span>→</span>
              </button>

              <span className="rr-command-divider" />

              <button
                type="button"
                className="rr-dashboard-link-button"
                onClick={() => navigate("/analytics")}
              >
                View analytics <span>→</span>
              </button>
            </div>
          </div>

          <div className="rr-dashboard-simulator">
            <div className="rr-dashboard-simulator-head">
              <div>
                <span className="rr-dashboard-panel-eyebrow">
                  Sandbox
                </span>
                <h3>Simulate a payment failure</h3>
              </div>

              <span className="rr-dashboard-live-dot">
                {submitting ? "PROCESSING" : "LIVE ENGINE"}
              </span>
            </div>

            <p className="rr-dashboard-panel-description">
              Run a controlled failure through context, risk, recommendation,
              policy and recovery without touching live payment traffic.
            </p>

            {submitting && (
              <div className="rr-simulation-progress">
                {simulationSteps.map((step, index) => (
                  <div
                    className={`rr-simulation-step ${
                      index < simulationStepIndex
                        ? "is-complete"
                        : index === simulationStepIndex - 1
                          ? "is-active"
                          : ""
                    }`}
                    key={step.key}
                  >
                    <span className="rr-simulation-step-dot">
                      {index < simulationStepIndex ? "✓" : index + 1}
                    </span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="rr-dashboard-simulator-grid">
              <div className="rr-dashboard-simulator-form">
                <TransactionForm
                  onSubmit={handleTransactionSubmit}
                  submitting={submitting}
                />
              </div>

              <div
                className="rr-dashboard-simulator-result"
                ref={resultRef}
              >
                {simError && (
                  <ErrorState
                    title="Simulation failed"
                    message={simError}
                  />
                )}

                {!simError && !result && !submitting && (
                  <div className="rr-simulator-placeholder">
                    <span className="rr-simulator-placeholder-line" />
                    <strong>Run a scenario</strong>
                    <p>
                      The returned recommendation, policy decision and
                      recovery outcome will appear here.
                    </p>
                  </div>
                )}

                {submitting && (
                  <div className="rr-simulator-processing">
                    <span className="rr-processing-ring" />
                    <div>
                      <strong>Evaluating payment failure</strong>
                      <p>
                        Running the live recovery pipeline…
                      </p>
                    </div>
                  </div>
                )}

                {result && !submitting && (
                  <div className="rr-simulator-result-content rr-simulation-complete">
                    <div className="rr-simulation-result-banner">
                      <span>Decision returned</span>
                      <strong>Engine run completed</strong>
                    </div>

                    <AnalysisResult result={result} />

                    {result?.event?.eventId && (
                      <button
                        type="button"
                        className="rr-dashboard-primary-action"
                        onClick={() =>
                          navigate(
                            `/transactions/${result.event.eventId}`,
                            { state: { trace: result } }
                          )
                        }
                      >
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
