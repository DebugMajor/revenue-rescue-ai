import { useEffect, useState } from "react";
import PageContainer from "../components/layout/PageContainer";
import TransactionTable from "../components/transactions/TransactionTable";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { getTransactions } from "../services/api";

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
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="rr-transactions-page">
      <PageContainer
        eyebrow="Event stream"
        title="Transactions"
        subtitle="Review payment failures, recovery outcomes, and the decisions recorded by the recovery engine."
      >
        <section className="rr-transactions-workspace">
          <div className="rr-transactions-header">
            <div>
              <span className="rr-transactions-kicker">Recovery ledger</span>
              <h2>Transaction history</h2>
            </div>
            {events && !error && (
              <span className="rr-transactions-count">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {error && <ErrorState title="Couldn't load transactions" message={error} />}
          {!error && events == null && <LoadingState label="Loading transaction history…" />}
          {!error && events && events.length === 0 && (
            <EmptyState
              title="No transactions yet"
              message="Process a transaction from the Dashboard to create the first recovery event."
            />
          )}
          {!error && events && events.length > 0 && <TransactionTable events={events} />}
        </section>
      </PageContainer>
    </div>
  );
}

export default Transactions;
