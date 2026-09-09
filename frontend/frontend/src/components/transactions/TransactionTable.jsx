import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function TransactionTable({ events }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [errorFilter, setErrorFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const statuses = useMemo(
    () => [
      "ALL",
      ...new Set(events.map((event) => event?.status).filter(Boolean)),
    ],
    [events]
  );

  const errors = useMemo(
    () => [
      "ALL",
      ...new Set(events.map((event) => event?.errorCode).filter(Boolean)),
    ],
    [events]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return events.filter((event) => {
      if (statusFilter !== "ALL" && event?.status !== statusFilter) {
        return false;
      }

      if (errorFilter !== "ALL" && event?.errorCode !== errorFilter) {
        return false;
      }

      if (!needle) return true;

      return [event?.eventId, event?.customerId, event?.errorCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [events, statusFilter, errorFilter, query]);

  const hasFilters =
    query.trim() !== "" ||
    statusFilter !== "ALL" ||
    errorFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setErrorFilter("ALL");
  };

  const openTransaction = (eventId) => {
    if (eventId) navigate(`/transactions/${eventId}`);
  };

  const handleRowKeyDown = (event, eventId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTransaction(eventId);
    }
  };

  return (
    <div className="rr-transaction-ledger">
      <div className="rr-transaction-toolbar">
        <label className="rr-transaction-search">
          <span className="rr-transaction-search-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" strokeWidth="1.6" />
              <path d="m12.7 12.7 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transaction, customer, or error code"
            aria-label="Search transactions"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="rr-transaction-search-clear"
            >
              ×
            </button>
          )}
        </label>

        <div className="rr-transaction-filters">
          <label>
            <span className="visually-hidden">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="visually-hidden">Filter by error code</span>
            <select
              value={errorFilter}
              onChange={(event) => setErrorFilter(event.target.value)}
              aria-label="Filter by error code"
            >
              {errors.map((code) => (
                <option key={code} value={code}>
                  {code === "ALL" ? "All error codes" : code}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rr-transaction-toolbar-meta">
        <span>
          Showing <strong>{filtered.length}</strong> of <strong>{events.length}</strong> events
        </span>

        {hasFilters && (
          <button
            type="button"
            className="rr-transaction-clear"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching transactions"
          message="Try clearing the filters or changing your search."
        />
      ) : (
        <div className="rr-table-wrap rr-transaction-table-wrap">
          <table className="rr-table rr-transaction-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Error</th>
                <th>Attempt</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th aria-label="Open" />
              </tr>
            </thead>

            <tbody>
              {filtered.map((event) => (
                <tr
                  key={event.eventId}
                  className="clickable rr-transaction-row"
                  onClick={() => openTransaction(event.eventId)}
                  onKeyDown={(keyboardEvent) =>
                    handleRowKeyDown(keyboardEvent, event.eventId)
                  }
                  tabIndex={0}
                  aria-label={`Open transaction ${event.eventId || "record"}`}
                >
                  <td className="rr-transaction-id rr-num-cell">
                    {event.eventId || "—"}
                  </td>
                  <td>{event.customerId || "—"}</td>
                  <td className="rr-transaction-amount rr-num-cell">
                    {formatAmount(event.paymentAmount)}
                  </td>
                  <td>
                    <span className="rr-error-code">
                      {event.errorCode || "—"}
                    </span>
                  </td>
                  <td className="rr-num-cell">
                    {event.attemptNumber ?? "—"}
                  </td>
                  <td>
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="rr-transaction-time">
                    {formatDate(event.timestamp)}
                  </td>
                  <td className="rr-transaction-open" aria-hidden="true">
                    →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionTable;
