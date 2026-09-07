
export function formatRelativeTime(input) {
  if (!input) return "—";

  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return date.toLocaleString("en-IN");
  }

  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
}

export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString("en-IN")}`;
}