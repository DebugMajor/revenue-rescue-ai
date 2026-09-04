import { useEffect, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getHealth } from "../services/api";

// Real, backend-verifiable information only: the authenticated
// account (decoded from the JWT already held by the client) and live
// API health via GET /health. No configurable thresholds, API keys,
// or notification preferences are shown — none of that is backed by
// a settings endpoint on the frozen backend.
function Settings() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => { if (!cancelled) setHealth(data); })
      .catch((err) => { if (!cancelled) setHealthError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageContainer
      title="Settings"
      subtitle="Account and system information for the recovery engine."
    >
      <div className="rr-card" style={{ marginBottom: 18 }}>
        <div className="rr-card-header">
          <div className="rr-card-title">Account</div>
        </div>
        <div className="rr-kv-row"><span className="k">Email</span><span className="v">{user?.email || "—"}</span></div>
        <div className="rr-kv-row"><span className="k">User ID</span><span className="v">{user?.userId || "—"}</span></div>
        <button className="rr-btn rr-btn-secondary" style={{ marginTop: 14 }} onClick={logout}>
          Log out
        </button>
      </div>

      <div className="rr-card" style={{ marginBottom: 18 }}>
        <div className="rr-card-header">
          <div className="rr-card-title">System Status</div>
        </div>
        {healthError && <div className="rr-kv-row"><span className="k">API</span><span className="v" style={{ color: "var(--rr-danger)" }}>Unreachable</span></div>}
        {!healthError && !health && <div className="rr-kv-row"><span className="k">API</span><span className="v">Checking…</span></div>}
        {health && (
          <div className="rr-kv-row"><span className="k">API</span><span className="v" style={{ color: "var(--rr-success)" }}>Online</span></div>
        )}
      </div>

      <div className="rr-card">
        <EmptyState
          title="No configurable settings yet"
          message="Policy thresholds, API credentials, and notification preferences currently live in server-side code and environment variables, not in a settings API. This page will grow once such an endpoint exists."
        />
      </div>
    </PageContainer>
  );
}

export default Settings;
