function ErrorState({ title = "Something went wrong", message }) {
  return (
    <div className="rr-state-panel error">
      <div className="rr-state-title">{title}</div>
      {message && <div>{message}</div>}
    </div>
  );
}

export default ErrorState;
