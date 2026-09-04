import { useState } from "react";

function TransactionForm({ onSubmit, submitting = false }) {
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
            <div className="rr-field">
                <label className="rr-field-label">Customer ID</label>
                <input
                    className="rr-input"
                    type="text"
                    placeholder="e.g. cust_10432"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    required
                />
            </div>

            <div className="rr-field">
                <label className="rr-field-label">Payment Amount (₹)</label>
                <input
                    className="rr-input"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    required
                />
            </div>

            <div className="rr-field">
                <label className="rr-field-label">Error Code</label>
                <select
                    className="rr-select"
                    value={errorCode}
                    onChange={(event) => setErrorCode(event.target.value)}
                >
                    <option value="NETWORK_ERROR">NETWORK_ERROR</option>
                    <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS</option>
                    <option value="UNKNOWN_ERROR">UNKNOWN_ERROR</option>
                </select>
            </div>

            <div className="rr-field">
                <label className="rr-field-label">Attempt Number</label>
                <input
                    className="rr-input"
                    type="number"
                    min="1"
                    value={attemptNumber}
                    onChange={(event) => setAttemptNumber(event.target.value)}
                />
            </div>

            <button className="rr-btn rr-btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Analyzing…" : "Analyze Failure"}
            </button>
        </form>
    );
}

export default TransactionForm;
