import TransactionForm from "./components/TransactionForm";
import { useState } from "react";
import AnalysisResult from "./components/AnalysisResult";
import MetricsPanel from "./components/MetricsPanel";

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTransactionSubmit = async (transaction) => {
    console.log("Sending transaction:", transaction);

    try {
      const response = await fetch(
        "http://localhost:5000/events/process",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(transaction)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to process transaction."
        );
      }

      setResult(data);
      setError(null);

    } catch (error) {
      console.error("Transaction processing failed:", error);
      setError(error.message);
    }
  };

  return (
    <>
      <h1>Revenue Rescue AI</h1>

      <TransactionForm
        onSubmit={handleTransactionSubmit}
      />

      {error != null && (
        <p>{error}</p>
      )}

      {result != null && (
        <AnalysisResult result={result} />
      )}

      <MetricsPanel />
    </>
  );
}

export default App;