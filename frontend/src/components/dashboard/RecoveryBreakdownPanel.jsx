import { useState, useEffect } from "react";
import { getRecoveryByError, getRecoveryByAction } from "../../services/api";
import RecoveryByErrorChart from "../analytics/RecoveryByErrorChart";
import RecoveryByActionChart from "../analytics/RecoveryByActionChart";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

function RecoveryBreakdownPanel() {
    const [byError, setByError] = useState(null);
    const [byAction, setByAction] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        Promise.all([getRecoveryByError(), getRecoveryByAction()])
            .then(([errorRes, actionRes]) => {
                if (cancelled) return;
                setByError(errorRes);
                setByAction(actionRes);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return <ErrorState title="Unable to load recovery breakdown" message={error} />;
    }

    return (
        <div className="rr-breakdown-grid">
            <div>
                <div className="rr-breakdown-title">Recovery by Error Type</div>
                {byError == null ? (
                    <LoadingState label="Loading…" />
                ) : (
                    <RecoveryByErrorChart data={byError} />
                )}
            </div>
            <div>
                <div className="rr-breakdown-title">Recovery by Action</div>
                {byAction == null ? (
                    <LoadingState label="Loading…" />
                ) : (
                    <RecoveryByActionChart data={byAction} />
                )}
            </div>
        </div>
    );
}

export default RecoveryBreakdownPanel;