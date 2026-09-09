import { useEffect, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import TransactionTable from "../components/transactions/TransactionTable";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { getTransactions } from "../services/api";
import "../styles/transactions.css";

function Transactions() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getTransactions()
      .then((data) => {
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Unable to load transactions.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer
      title="Transactions"
      subtitle="Review payment failures, recovery outcomes, and the decisions recorded by the recovery engine."
    >
      <div className="rr-transactions-page">
        <div className="rr-transaction-heading">
          <div>
            <div className="rr-section-eyebrow">RECOVERY LEDGER</div>
            <h2>Transaction history</h2>
            <p>Payment failures, recovery outcomes, and recorded decisions.</p>
          </div>
          {events && (
            <div className="rr-transaction-count">
              <strong>{events.length}</strong>
              <span>events</span>
            </div>
          )}
        </div>

        <div className="rr-transaction-card">
          {error && (
            <ErrorState
              title="Couldn't load transactions"
              message={error}
            />
          )}

          {!error && events == null && (
            <LoadingState label="Loading transactions…" />
          )}

          {!error && events && events.length === 0 && (
            <EmptyState
              title="No transactions yet"
              message="Process a transaction from the Dashboard to see it here."
            />
          )}

          {!error && events && events.length > 0 && (
            <TransactionTable events={events} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default Transactions;
