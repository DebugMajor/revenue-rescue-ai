function EmptyState({ title = "Nothing here yet", message, actions }) {
  return (
    <div className="rr-state-panel">
      <div className="rr-state-title">{title}</div>
      {message && <div>{message}</div>}
      {actions && <div style={{ marginTop: 12 }}>{actions}</div>}
    </div>
  );
}

export default EmptyState;
