import { useState, useEffect } from "react";
import { getRecoveryTrend } from "../../services/api";
import RecoveryTrendChart from "../analytics/RecoveryTrendChart";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

function uniqueDateCount(rows) {
    return new Set((rows || []).map((row) => row.date)).size;
}

function RecoveryPerformancePanel() {
    const [trend, setTrend] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        getRecoveryTrend()
            .then((data) => {
                if (!cancelled) setTrend(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return <ErrorState title="Unable to load recovery data" message={error} />;
    }

    if (trend == null) {
        return <LoadingState label="Loading recovery performance…" />;
    }

    const days = uniqueDateCount(trend);

    if (days === 0) {
        return (
            <EmptyState
                title="Nothing to analyze yet"
                message="Recovery performance will appear once recovery attempts with a completed outcome exist."
            />
        );
    }

    if (days === 1) {
        return (
            <EmptyState
                title="Limited recovery history"
                message="More recovery events are needed to establish a meaningful trend. Check back once activity spans multiple days."
            />
        );
    }

    return (
        <div className="rr-reveal">
            <RecoveryTrendChart data={trend} />
        </div>
    );
}

export default RecoveryPerformancePanel;