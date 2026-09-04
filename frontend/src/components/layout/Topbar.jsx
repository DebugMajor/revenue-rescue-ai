import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getHealth } from "../../services/api";

const TITLES = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/recovery": "Recovery Center",
  "/analytics": "Analytics",
  "/settings": "Settings"
};

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/transactions/")) return "Transaction Detail";
  return "Revenue Rescue AI";
}

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // "online" | "offline" | "checking"
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await getHealth();
        if (!cancelled) setStatus("online");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="rr-topbar">
      <div className="rr-topbar-title">{titleFor(location.pathname)}</div>
      <div className="rr-topbar-right">
        <div className="rr-status-pill">
          <span className={`rr-status-dot${status !== "online" ? " rr-status-dot--off" : ""}`} />
          <span>{status === "checking" ? "Checking…" : status === "online" ? "API Online" : "API Unreachable"}</span>
        </div>

        {user?.email && (
          <div className="rr-user-pill" title={user.email}>
            {user.email}
          </div>
        )}

        <button className="rr-btn rr-btn-secondary rr-logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

export default Topbar;
