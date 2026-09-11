import { NavLink } from "react-router-dom";

const OPERATIONS = [
  { to: "/dashboard", label: "Dashboard", icon: "◱" },
  { to: "/transactions", label: "Transactions", icon: "▤" },
  { to: "/recovery", label: "Recovery Center", icon: "↻" }
];

const INTELLIGENCE = [
  { to: "/analytics", label: "Analytics", icon: "◈" }
];

const SYSTEM = [
  { to: "/settings", label: "Settings", icon: "⚙" }
];

function NavGroup({ label, links }) {
  return (
    <div className="rr-nav-group">
      <div className="rr-nav-label">{label}</div>

      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            "rr-nav-link" + (isActive ? " active" : "")
          }
        >
          <span className="rr-nav-icon">{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
export function BrandMark() {
  return (
    <div className="rr-brand-mark" aria-label="Revenue Rescue AI">
      RR
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="rr-sidebar">
      <NavLink
        to="/"
        className="rr-sidebar-brand"
        aria-label="Return to Revenue Rescue AI homepage"
      >
        <img
          src="/logo-wordmark.png"
          alt="Revenue Rescue AI"
          className="rr-sidebar-logo"
        />
      </NavLink>

      <NavGroup label="OPERATIONS" links={OPERATIONS} />
      <NavGroup label="INTELLIGENCE" links={INTELLIGENCE} />
      <NavGroup label="SYSTEM" links={SYSTEM} />

      <div className="rr-sidebar-footer">
        <span>AI recommends</span>
        <span>Policy decides</span>
        <span>Code executes</span>
      </div>
    </aside>
  );
}

export default Sidebar;
