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

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 13.5A8 8 0 1 1 12 20"
        stroke="#061013"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M4 13.5V9M4 13.5H8.3"
        stroke="#061013"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5L15 12.2L17.2 14.3L21 10"
        stroke="#061013"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavGroup({ label, links }) {
  return (
    <div className="rr-nav-group">
      <div className="rr-nav-label">{label}</div>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => "rr-nav-link" + (isActive ? " active" : "")}
        >
          <span className="rr-nav-icon">{link.icon}</span>
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="rr-sidebar">
      <div className="rr-sidebar-brand">
        <div className="rr-sidebar-mark">
          <BrandMark />
        </div>
        <div className="rr-sidebar-name">
          Revenue Rescue
          <span>AI Recovery Console</span>
        </div>
      </div>

      <NavGroup label="OPERATIONS" links={OPERATIONS} />
      <NavGroup label="INTELLIGENCE" links={INTELLIGENCE} />
      <NavGroup label="SYSTEM" links={SYSTEM} />

      <div className="rr-sidebar-footer">
        AI recommends → Policy decides → Code executes
      </div>
    </aside>
  );
}

export { BrandMark };
export default Sidebar;
