import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";

import RevenueOverview from "../components/dashboard/RevenueOverview";
import OutcomeSummary from "../components/dashboard/OutcomeSummary";
import LatestDecisionCard from "../components/dashboard/LatestDecisionCard";
import RecoveryActivityFeed from "../components/dashboard/RecoveryActivityFeed";
import RecoveryPerformancePanel from "../components/dashboard/RecoveryPerformancePanel";
import RecoveryBreakdownPanel from "../components/dashboard/RecoveryBreakdownPanel";
import PolicyIntelligencePanel from "../components/dashboard/PolicyIntelligencePanel";
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

  const [metrics, setMetrics] = useState(null);
  const [intelligence, setIntelligence] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [result, setResult] = useState(null);
  const [simError, setSimError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [
        metricsRes,
        transactionsRes,
        recoveryQueue
      ] = await Promise.all([
        getDashboardMetrics(),
        getTransactions(),
        getRecoveryQueue()
      ]);

      /*
       * The dashboard already has authoritative aggregate metrics
       * from /analytics/dashboard.
       *
       * For the "Latest Decision" and "Recent Activity" UI we only
       * inspect a small number of recent transactions because the
       * existing transaction-list endpoint does not include the full
       * analysis/recovery chain.
       */
      const recent = Array.isArray(transactionsRes)
        ? transactionsRes.slice(0, 5)
        : [];

      const details = (
        await Promise.all(
          recent.map(async (event) => {
            try {
              return await getTransactionById(event.eventId);
            } catch {
              return null;
            }
          })
        )
      ).filter(Boolean);

      const analyzed = details.filter(
        (detail) => detail?.event && detail?.analysis
      );

      const latestDecision =
        analyzed.length > 0
          ? analyzed[0]
          : null;

      const recentActivity = analyzed.map(
        (detail) => {
          const attempts =
            Array.isArray(detail.attempts)
              ? detail.attempts
              : [];

          const latestAttempt =
            attempts.length > 0
              ? attempts[attempts.length - 1]
              : null;

          return {
            eventId:
              detail.event.eventId,

            errorCode:
              detail.event.errorCode,

            paymentAmount:
              detail.event.paymentAmount,

            timestamp:
              detail.event.timestamp,

            action:
              latestAttempt?.action || null,

            outcome:
              latestAttempt?.outcome || null,

            policyDecision:
              detail.analysis?.policyDecision ||
              null
          };
        }
      );

      /*
       * We do NOT manufacture all-time policy counts.
       *
       * These are only recent decision samples and are used only by
       * components that explicitly label them as recent.
       */
      const policyCounts = {
        APPROVED: 0,
        ESCALATED: 0,
        BLOCKED: 0
      };

      for (const detail of analyzed) {
        const decision =
          detail.analysis?.policyDecision;

        if (
          decision &&
          policyCounts[decision] !== undefined
        ) {
          policyCounts[decision] += 1;
        }
      }

      const intelligenceData = {
        sampleSize: analyzed.length,

        latestDecision,

        recentActivity,

        policyCounts,

        reasonCounts: {
          HIGH_RISK: 0,
          HIGH_VALUE: 0,
          MAX_ATTEMPTS: 0,
          LOW_CONFIDENCE: 0,
          OTHER: 0
        },

        pendingCount: Array.isArray(
          recoveryQueue
        )
          ? recoveryQueue.length
          : 0
      };

      setMetrics(metricsRes);
      setIntelligence(
        intelligenceData
      );
    } catch (error) {
      setLoadError(
        error?.message ||
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleTransactionSubmit =
    async (transaction) => {
      setSimError(null);
      setResult(null);
      setSubmitting(true);

      try {
        const data =
          await processTransaction(
            transaction
          );

        setResult(data);

        /*
         * Refresh dashboard so the newly processed
         * event appears in the UI.
         */
        await loadDashboard();
      } catch (error) {
        setSimError(
          error?.message ||
          "Analysis failed."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <PageContainer
      eyebrow="Revenue Intelligence"
      title="Recover revenue. Intelligently."
      subtitle="A governed view of every failed payment: what the AI recommends, what policy allows, and what actually executes."
    >
      <section className="rr-dash-section">
        <RevenueOverview
          metrics={metrics}
          intelligence={intelligence}
          loading={loading}
          error={loadError}
        />
      </section>

      <section className="rr-dash-section">
        <OutcomeSummary
          intelligence={
            intelligence
          }
          loading={loading}
          error={loadError}
        />
      </section>

      <section className="rr-dash-section rr-intelligence-grid">
        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Latest Recovery Decision
              </div>

              <div className="rr-card-title-sub">
                AI recommends → policy decides → code executes
              </div>
            </div>
          </div>

          <LatestDecisionCard
            intelligence={
              intelligence
            }
            loading={loading}
            error={loadError}
          />
        </div>

        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Recent Recovery Activity
              </div>

              <div className="rr-card-title-sub">
                Recent decisions and recovery attempts
              </div>
            </div>
          </div>

          <RecoveryActivityFeed
            intelligence={
              intelligence
            }
            loading={loading}
            error={loadError}
          />
        </div>
      </section>

      <section className="rr-dash-section">
        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Recovery Performance
              </div>

              <div className="rr-card-title-sub">
                Recovery outcomes over time
              </div>
            </div>
          </div>

          <RecoveryPerformancePanel />
        </div>
      </section>

      <section className="rr-dash-section rr-policy-breakdown-grid">
        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Policy Intelligence
              </div>

              <div className="rr-card-title-sub">
                Recent decisions held back from automatic execution
              </div>
            </div>
          </div>

          <PolicyIntelligencePanel
            intelligence={
              intelligence
            }
            loading={loading}
            error={loadError}
          />
        </div>

        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Recovery Breakdown
              </div>

              <div className="rr-card-title-sub">
                Recovery by error type and action
              </div>
            </div>
          </div>

          <RecoveryBreakdownPanel />
        </div>
      </section>

      <section className="rr-dash-section">
        <div className="rr-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Recent Events
              </div>

              <div className="rr-card-title-sub">
                Latest processed payment events
              </div>
            </div>
          </div>

          <RecentEvents />
        </div>
      </section>

      <section className="rr-dash-section">
        <div className="rr-card rr-simulator-card">
          <div className="rr-card-header">
            <div>
              <div className="rr-card-title">
                Simulate Payment Failure
              </div>

              <div className="rr-card-title-sub">
                Testing tool — submit a simulated event through the recovery engine
              </div>
            </div>
          </div>

          <div className="rr-simulator-grid">
            <div className="rr-simulator-form">
              <TransactionForm
                onSubmit={
                  handleTransactionSubmit
                }
                submitting={
                  submitting
                }
              />
            </div>

            <div className="rr-simulator-result">
              {simError && (
                <ErrorState
                  title="Analysis failed"
                  message={
                    simError
                  }
                />
              )}

              {!simError &&
                !result && (
                  <p
                    style={{
                      color:
                        "var(--rr-muted)",
                      fontSize:
                        13.5
                    }}
                  >
                    Submit a transaction to see its decision and recovery result here.
                  </p>
                )}

              {result && (
                <>
                  <AnalysisResult
                    result={
                      result
                    }
                  />

                  <button
                    type="button"
                    className="rr-btn rr-btn-secondary"
                    style={{
                      marginTop: 14
                    }}
                    onClick={() =>
                      navigate(
                        `/transactions/${result.event.eventId}`,
                        {
                          state: {
                            trace: result
                          }
                        }
                      )
                    }
                  >
                    View full decision trace
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

export default Dashboard;