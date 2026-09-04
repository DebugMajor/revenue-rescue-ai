// Optional `eyebrow` renders a small accent label above the title
// (e.g. "REVENUE INTELLIGENCE" on the Dashboard) for stronger visual
// hierarchy on the primary pages. Purely presentational — no data.
function PageContainer({ eyebrow, title, subtitle, actions, children }) {
  return (
    <div>
      {(eyebrow || title || subtitle || actions) && (
        <div className="rr-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            {eyebrow && <div className="rr-eyebrow">{eyebrow}</div>}
            {title && <h1 className="rr-page-title">{title}</h1>}
            {subtitle && <p className="rr-page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default PageContainer;
