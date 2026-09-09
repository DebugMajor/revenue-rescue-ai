import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatTimestamp = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function TransactionTable({ events }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [errorFilter, setErrorFilter] = useState("ALL");

  const statuses = useMemo(
    () => ["ALL", ...new Set(events.map((event) => event.status).filter(Boolean))],
    [events]
  );

  const errors = useMemo(
    () => ["ALL", ...new Set(events.map((event) => event.errorCode).filter(Boolean))],
    [events]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus =
        statusFilter === "ALL" || event.status === statusFilter;

      const matchesError =
        errorFilter === "ALL" || event.errorCode === errorFilter;

      const haystack = [
        event.eventId,
        event.customerId,
        event.errorCode,
        event.status,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesStatus && matchesError && matchesQuery;
    });
  }, [events, query, statusFilter, errorFilter]);

  const hasFilters =
    query.trim() || statusFilter !== "ALL" || errorFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setErrorFilter("ALL");
  };

  const openTransaction = (event) => {
    if (event?.eventId != null) {
      navigate(`/transactions/${encodeURIComponent(event.eventId)}`);
    }
  };

  return (
    <div className="rr-transaction-table">
      <div className="rr-transaction-toolbar">
        <div className="rr-transaction-search">
          <span className="rr-search-icon" aria-hidden="true">⌕</span>
          <input
            className="rr-transaction-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transaction, customer or error"
            aria-label="Search transactions"
          />
          {query && (
            <button
              type="button"
              className="rr-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="rr-transaction-filters">
          <select
            className="rr-transaction-filter-select"
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

          <select
            className="rr-transaction-filter-select"
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

          {hasFilters && (
            <button
              type="button"
              className="rr-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="rr-transaction-meta">
        <span>
          Showing <strong>{filtered.length}</strong> of {events.length} events
        </span>

        {hasFilters && (
          <span className="rr-filter-state">
            Filters active
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching transactions"
          message="Try clearing the filters or using a different search."
        />
      ) : (
        <div className="rr-transaction-table-wrap">
          <table className="rr-transaction-table-grid">
            <thead>
              <tr>
                <th>TRANSACTION</th>
                <th>CUSTOMER</th>
                <th>AMOUNT</th>
                <th>ERROR</th>
                <th>ATTEMPT</th>
                <th>STATUS</th>
                <th>TIMESTAMP</th>
                <th aria-label="Open transaction" />
              </tr>
            </thead>

            <tbody>
              {filtered.map((event, index) => {
                const key =
                  event.eventId != null
                    ? String(event.eventId)
                    : `${event._id || "event"}-${index}`;

                return (
                  <tr
                    key={key}
                    tabIndex={0}
                    onClick={() => openTransaction(event)}
                    onKeyDown={(keyboardEvent) => {
                      if (
                        keyboardEvent.key === "Enter" ||
                        keyboardEvent.key === " "
                      ) {
                        keyboardEvent.preventDefault();
                        openTransaction(event);
                      }
                    }}
                  >
                    <td className="rr-transaction-id">
                      {event.eventId ?? "—"}
                    </td>
                    <td>{event.customerId ?? "—"}</td>
                    <td className="rr-amount">
                      {formatAmount(event.paymentAmount)}
                    </td>
                    <td>
                      <span className="rr-error-code">
                        {event.errorCode ?? "—"}
                      </span>
                    </td>
                    <td className="rr-attempt">
                      {event.attemptNumber ?? "—"}
                    </td>
                    <td>
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="rr-timestamp">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="rr-row-action" aria-hidden="true">
                      →
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionTable;
