import { useEffect, useMemo, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";
import { getHealth } from "../services/api";
import "../styles/settings.css";

function StatusPill({ tone = "neutral", children }) {
  return <span className={`rr-settings-pill rr-settings-pill--${tone}`}>{children}</span>;
}

function SettingRow({ label, value, mono = false, tone }) {
  return (
    <div className="rr-settings-row">
      <span className="rr-settings-row-label">{label}</span>
      <span className={`rr-settings-row-value${mono ? " is-mono" : ""}${tone ? ` is-${tone}` : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ServiceRow({ mark, name, description, status, tone }) {
  return (
    <div className="rr-settings-service-row">
      <div className={`rr-settings-service-mark ${tone ? `is-${tone}` : ""}`}>{mark}</div>
      <div className="rr-settings-service-copy">
        <strong>{name}</strong>
        <span>{description}</span>
      </div>
      <StatusPill tone={tone === "purple" ? "violet" : "success"}>{status}</StatusPill>
    </div>
  );
}

function Settings() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch((err) => {
        if (!cancelled) setHealthError(err.message || "API unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const apiStatus = healthError ? "UNAVAILABLE" : health ? "ONLINE" : "CHECKING";
  const apiTone = healthError ? "danger" : health ? "success" : "neutral";
  const environment = useMemo(() => {
    const mode = import.meta.env.MODE || "development";
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  }, []);

  return (
    <PageContainer
      title="Settings"
      subtitle="Account, system status, and application configuration."
    >
      <div className="rr-settings-grid">
        <section className="rr-card rr-settings-card rr-settings-account">
          <div className="rr-settings-card-head">
            <div>
              <span className="rr-settings-eyebrow">ACCOUNT</span>
              <h2>Account</h2>
            </div>
            <StatusPill>READ ONLY</StatusPill>
          </div>

          <div className="rr-settings-compact-list">
            <SettingRow label="Email" value={user?.email || "—"} />
            <SettingRow label="User ID" value={user?.userId || "—"} mono />
            <SettingRow label="Session" value="Active" tone="success" />
          </div>

          <div className="rr-settings-card-action">
            <button className="rr-btn rr-btn-secondary" onClick={logout}>Log out</button>
          </div>
        </section>

        <section className="rr-card rr-settings-card rr-settings-system">
          <div className="rr-settings-card-head">
            <div>
              <span className="rr-settings-eyebrow">SYSTEM</span>
              <h2>System status</h2>
            </div>
            <StatusPill tone={apiTone}>{apiStatus}</StatusPill>
          </div>

          <div className="rr-settings-compact-list">
            <SettingRow label="Recovery API" value={apiStatus === "ONLINE" ? "Online" : apiStatus === "UNAVAILABLE" ? "Unavailable" : "Checking…"} tone={apiTone} />
            <SettingRow label="Environment" value={environment} />
            <SettingRow label="Evaluation mode" value="Controlled · Synthetic" />
          </div>
        </section>

        <section className="rr-card rr-settings-card">
          <div className="rr-settings-card-head">
            <div>
              <span className="rr-settings-eyebrow">RECOVERY</span>
              <h2>Recovery policy</h2>
            </div>
            <StatusPill tone="amber">SERVER CONTROLLED</StatusPill>
          </div>

          <div className="rr-settings-compact-list">
            <SettingRow label="AI analysis" value="Gemini + deterministic fallback" mono />
            <SettingRow label="Policy engine" value="Deterministic approval / escalation" mono />
            <SettingRow label="Execution" value="Approved actions only" mono />
          </div>
        </section>

        <section className="rr-card rr-settings-card">
          <div className="rr-settings-card-head">
            <div>
              <span className="rr-settings-eyebrow">INTEGRATIONS</span>
              <h2>Integrations</h2>
            </div>
            <StatusPill tone="neutral">SERVER-SIDE</StatusPill>
          </div>

          <div className="rr-settings-service-list">
            <ServiceRow
              mark="R"
              name="Razorpay"
              description="Webhook and payment-recovery integration"
              status="Configured"
              tone="cyan"
            />
            <ServiceRow
              mark="G"
              name="Gemini"
              description="AI diagnosis and recommendation"
              status="Configured"
              tone="purple"
            />
          </div>

          <p className="rr-settings-footnote">
            Credentials are managed through server-side environment variables and are never exposed here.
          </p>
        </section>

        <section className="rr-card rr-settings-card">
          <div className="rr-settings-card-head">
            <div>
              <span className="rr-settings-eyebrow">EVALUATION</span>
              <h2>Evaluation mode</h2>
            </div>
            <StatusPill tone="violet">CONTROLLED</StatusPill>
          </div>

          <div className="rr-settings-eval-inline">
            <div>
              <span>Mode</span>
              <strong>Controlled / Synthetic</strong>
            </div>
            <div>
              <span>Dataset</span>
              <strong>500 scenarios</strong>
            </div>
          </div>
        </section>

        <section className="rr-card rr-settings-card">
          <div className="rr-settings-card-head">
            <div>
              <span className="rr-settings-eyebrow">SECURITY</span>
              <h2>Security</h2>
            </div>
            <StatusPill tone="success">PROTECTED</StatusPill>
          </div>

          <div className="rr-settings-compact-list">
            <SettingRow label="Authentication" value="JWT session" />
            <SettingRow label="API secrets" value="Server-side environment variables" />
            <SettingRow label="Transaction access" value="User-scoped" />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

export default Settings;
