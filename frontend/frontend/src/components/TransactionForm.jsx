import { useState } from "react";

function TransactionForm({ onSubmit }) {
    const [customerId, setCustomerId] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [errorCode, setErrorCode] = useState("NETWORK_ERROR");
    const [attemptNumber, setAttemptNumber] = useState(1);

    const handleSubmit = (event) => {
        event.preventDefault();
        const transaction = {
            eventId: Date.now(),
            eventType: "PAYMENT_FAILURE",
            customerId: customerId,
            paymentAmount: Number(paymentAmount),
            status: "FAILED",
            errorCode: errorCode,
            attemptNumber: Number(attemptNumber),
            timestamp: new Date().toISOString()
        }
        onSubmit(transaction);
    }

    return (
        <form onSubmit={handleSubmit}>
            customer id : <input type="text" value={customerId} onChange={(event) => setCustomerId(event.target.value)} />
            <br /> <br />
            paymentAmount : <input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
            <br /> <br />
            errorCode : <select value={errorCode} onChange={(event) => setErrorCode(event.target.value)}  >
                <option value="NETWORK_ERROR"> NETWORK_ERROR</option>
                <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS </option>
                <option value="UNKNOWN_ERROR">UNKNOWN_ERROR</option>
            </select>
            <br /> <br />
            attemptNumber <input type="number" value={attemptNumber} onChange={(event) => setAttemptNumber(event.target.value)} />
            <button type="submit">
                Analyze Failure
            </button>
        </form>

    );
}

export default TransactionForm;