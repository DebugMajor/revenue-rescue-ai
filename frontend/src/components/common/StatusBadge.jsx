
const TONE_MAP = {
  RECOVERED: "success",
  APPROVED: "success",
  SUCCESS: "success",
  LOW: "success",

  FAILED: "danger",
  BLOCKED: "danger",
  HIGH: "danger",

  PENDING: "warning",
  ESCALATED: "warning",
  WAIT_AND_RETRY: "warning",
  HUMAN_REVIEW: "warning",
  MEDIUM: "warning",

  RETRY_NOW: "info",
  SEND_PAYMENT_LINK: "info",
  GEMINI: "info",

  DO_NOT_RETRY: "neutral",
  DETERMINISTIC_FALLBACK: "neutral"
};

function StatusBadge({ status }) {
  if (!status) return <span className="rr-badge neutral">—</span>;
  const tone = TONE_MAP[status] || "neutral";
  return (
    <span className={`rr-badge ${tone}`}>
      <span className="rr-badge-dot" />
      {String(status).replaceAll("_", " ")}
    </span>
  );
}

export default StatusBadge;
