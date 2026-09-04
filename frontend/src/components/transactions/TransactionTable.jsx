import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

// Filters run client-side over whatever GET /transactions returned.
// These narrow the current result set only — they are not a
// replacement for server-side pagination/search, which the API does
// not currently expose query params for.
function TransactionTable({ events }) {
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [errorFilter, setErrorFilter] = useState("ALL");
    const navigate = useNavigate();

    const statuses = useMemo(
        () => ["ALL", ...new Set(events.map((e) => e.status))],
        [events]
    );
    const errors = useMemo(
        () => ["ALL", ...new Set(events.map((e) => e.errorCode).filter(Boolean))],
        [events]
    );

    const filtered = events.filter((e) => {
        if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
        if (errorFilter !== "ALL" && e.errorCode !== errorFilter) return false;
        return true;
    });

    return (
        <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <select className="rr-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {statuses.map((s) => (
                        <option key={s} value={s}>{s === "ALL" ? "All statuses" : s}</option>
                    ))}
                </select>
                <select className="rr-select" style={{ width: "auto" }} value={errorFilter} onChange={(e) => setErrorFilter(e.target.value)}>
                    {errors.map((e) => (
                        <option key={e} value={e}>{e === "ALL" ? "All error codes" : e}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState title="No matching transactions" message="Try clearing the filters above." />
            ) : (
                <div className="rr-table-wrap">
                    <table className="rr-table">
                        <thead>
                            <tr>
                                <th>Transaction</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Error</th>
                                <th>Attempt</th>
                                <th>Status</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((e) => (
                                <tr key={e.eventId} className="clickable" onClick={() => navigate(`/transactions/${e.eventId}`)}>
                                    <td className="rr-num-cell">{e.eventId}</td>
                                    <td>{e.customerId}</td>
                                    <td className="rr-num-cell">₹{e.paymentAmount}</td>
                                    <td>{e.errorCode || "—"}</td>
                                    <td className="rr-num-cell">{e.attemptNumber}</td>
                                    <td><StatusBadge status={e.status} /></td>
                                    <td>{e.timestamp ? new Date(e.timestamp).toLocaleString("en-IN") : "—"}</td>
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
