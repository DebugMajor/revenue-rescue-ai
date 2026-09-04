function LoadingState({ label = "Loading…" }) {
  return (
    <div className="rr-state-panel" role="status">
      {label}
    </div>
  );
}

export default LoadingState;
