import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TITLES = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/recovery": "Recovery Center",
  "/analytics": "Analytics",
  "/settings": "Settings"
};

const MOBILE_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "◱" },
  { to: "/transactions", label: "Transactions", icon: "▤" },
  { to: "/recovery", label: "Recovery Center", icon: "↻" },
  { to: "/analytics", label: "Analytics", icon: "◈" },
  { to: "/settings", label: "Settings", icon: "⚙" }
];

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/transactions/")) return "TransactionDetail";
  return "Revenue Rescue AI";
}

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="rr-topbar">
      <div className="rr-topbar-title">{titleFor(location.pathname)}</div>

      <div className="rr-topbar-right">
        <div className="rr-status-pill">
          <span className="rr-status-dot" />
          <span>API Online</span>
        </div>

        {user?.email && (
          <div className="rr-user-pill" title={user.email}>
            {user.email}
          </div>
        )}

        <button
          className="rr-btn rr-btn-secondary rr-logout-btn"
          onClick={handleLogout}
        >
          Log out
        </button>

        <button
          type="button"
          className="rr-mobile-menu-btn"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="rr-mobile-nav" aria-label="Mobile navigation">
          {MOBILE_NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                "rr-mobile-nav-link" + (isActive ? " active" : "")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="rr-mobile-nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

export default Topbar;
