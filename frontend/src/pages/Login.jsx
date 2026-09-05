import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "../components/layout/Sidebar";
import { Link, Navigate, useNavigate } from "react-router-dom";

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rr-login-shell">
      <div className="rr-login-card">
        <div className="rr-login-brand">
          <div className="rr-sidebar-mark">
            <BrandMark />
          </div>
          <div className="rr-sidebar-name">
            Revenue Rescue
            <span>AI Recovery Console</span>
          </div>
        </div>

        <h1 className="rr-login-title">Log In</h1>
        <p className="rr-login-subtitle">
          Access the revenue recovery operations console.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="rr-field">
            <label className="rr-field-label">Email</label>
            <input
              className="rr-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="rr-field">
            <label className="rr-field-label">Password</label>
            <input
              className="rr-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="rr-login-error">{error}</div>}

          <button
            className="rr-btn rr-btn-primary"
            type="submit"
            disabled={submitting}
            style={{ width: "100%", marginTop: 6 }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="rr-login-footer-link">
          Don't have an account?{" "}
          <Link to="/signup">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
