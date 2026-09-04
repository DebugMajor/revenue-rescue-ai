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
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageContainer
      title="Transactions"
      subtitle="Full transaction history from the recovery engine."
    >
      <div className="rr-card">
        {error && <ErrorState title="Couldn't load transactions" message={error} />}
        {!error && events == null && <LoadingState label="Loading transactions…" />}
        {!error && events && events.length === 0 && (
          <EmptyState title="No transactions yet" message="Process a transaction from the Dashboard to see it here." />
        )}
        {!error && events && events.length > 0 && <TransactionTable events={events} />}
      </div>
    </PageContainer>
  );
}

export default Transactions;
