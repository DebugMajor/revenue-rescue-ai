
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
