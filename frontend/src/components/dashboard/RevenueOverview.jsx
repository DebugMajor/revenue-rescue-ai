import { formatCurrency } from "../../utils/time";
import MetricCard from "../common/MetricCard";
import ErrorState from "../common/ErrorState";

function RevenueOverview({ metrics, intelligence, loading, error }) {
    if (error) {
        return <ErrorState title="Unable to load recovery data" message={error} />;
    }

    if (loading || metrics == null || intelligence == null) {
        return (
            <div className="rr-kpi-grid">
                <div className="rr-metric-skeleton" />
                <div className="rr-metric-skeleton" />
                <div className="rr-metric-skeleton" />
                <div className="rr-metric-skeleton" />
            </div>
        );
    }

    const sampleNote =
        intelligence.sampleSize > 0
            ? `Last ${intelligence.sampleSize} failed event${intelligence.sampleSize === 1 ? "" : "s"}`
            : "No recent failed events";

    return (
        <div className="rr-kpi-grid rr-reveal">
            <MetricCard
                label="Revenue At Risk"
                value={formatCurrency(intelligence.revenueAtRiskSample)}
                accent="danger"
                footnote={sampleNote}
            />
            <MetricCard
                label="Expected Recovery"
                value={formatCurrency(metrics.expectedRecoveryValue)}
                accent="violet"
                footnote="AI-projected, all failed events"
            />
            <MetricCard
                label="Recovered Revenue"
                value={formatCurrency(intelligence.recoveredRevenueSample)}
                accent="success"
                footnote={sampleNote}
            />
            <MetricCard
                label="Recovery Rate"
                value={`${Math.round(metrics.recoveryRate * 100)}%`}
                accent="cyan"
                footnote={`${metrics.recoveredPayments} recovered of ${metrics.failedPayments} failed`}
            />
        </div>
    );
}

export default RevenueOverview;