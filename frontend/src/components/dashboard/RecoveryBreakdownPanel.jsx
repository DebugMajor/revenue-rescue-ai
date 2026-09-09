import { useEffect, useState } from "react";
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
      .then(([errorData, actionData]) => {
        if (cancelled) return;
        setByError(Array.isArray(errorData) ? errorData : []);
        setByAction(Array.isArray(actionData) ? actionData : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Unable to load recovery breakdown.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <ErrorState
        title="Unable to load recovery breakdown"
        message={error}
      />
    );
  }

  if (byError == null || byAction == null) {
    return <LoadingState label="Loading recovery mix…" />;
  }

  return (
    <div className="rr-breakdown-content rr-reveal">
      <section className="rr-breakdown-module">
        <div className="rr-breakdown-title-row">
          <div>
            <span className="rr-breakdown-kicker">Failure mix</span>
            <div className="rr-breakdown-title">Recovery by error</div>
          </div>
        </div>
        <RecoveryByErrorChart data={byError} />
      </section>

      <section className="rr-breakdown-module rr-breakdown-module--action">
        <div className="rr-breakdown-title-row">
          <div>
            <span className="rr-breakdown-kicker">Outcome mix</span>
            <div className="rr-breakdown-title">Recovery by action</div>
          </div>
        </div>
        <RecoveryByActionChart data={byAction} />
      </section>
    </div>
  );
}

export default RecoveryBreakdownPanel;
