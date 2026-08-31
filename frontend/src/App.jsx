import TransactionForm from "./components/TransactionForm";
import { useState } from "react";

function App() {
  const [result, setResult] = useState("");
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

      {result && (
        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

    </>
  );
}

export default App;