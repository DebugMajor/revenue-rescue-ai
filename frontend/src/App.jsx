import TransactionForm from "./components/TransactionForm";
import { useState } from "react";
import AnalysisResult from "./components/AnalysisResult";

function App() {
  const [result, setResult] = useState(null);
  const handleTransactionSubmit = async (transaction) => {
    console.log("Sending transaction:", transaction);
    const response = await fetch("http://localhost:5000/events/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(transaction)
    })
    const data = await response.json();
    setResult(data);

  }
  return (
    <>
      <h1>Revenue Rescue AI</h1>
      <TransactionForm onSubmit={handleTransactionSubmit} />

      {result != null && (
        <AnalysisResult result={result} />
      )}
    </>
  );
}

export default App;