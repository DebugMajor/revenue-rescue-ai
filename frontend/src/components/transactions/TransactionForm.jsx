import { useState } from "react";

function TransactionForm({ onSubmit, submitting = false }) {
    const [eventType, setEventType] = useState("PAYMENT_FAILURE");
    const [customerId, setCustomerId] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [errorCode, setErrorCode] = useState("NETWORK_ERROR");
    const [attemptNumber, setAttemptNumber] = useState(1);

    const isAbandonedCheckout =
        eventType === "CHECKOUT_ABANDONED";

    const handleSubmit = (event) => {
        event.preventDefault();

        const transaction = {
            eventId: Date.now(),
            eventType,
            customerId,
            paymentAmount: Number(paymentAmount),
            status: isAbandonedCheckout
                ? "CHECKOUT_ABANDONED"
                : "FAILED",
            errorCode: isAbandonedCheckout
                ? undefined
                : errorCode,
            attemptNumber: Number(attemptNumber),
            timestamp: new Date().toISOString()
        };

        // Keep the request clean: abandoned checkout is an event type,
        // not a payment failure with a synthetic error code.
        if (isAbandonedCheckout) {
            delete transaction.errorCode;
        }

        onSubmit(transaction);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="rr-field rr-dashboard-event-type-field">
                <label className="rr-field-label">Event Type</label>

                <div className="rr-event-type-toggle" role="radiogroup" aria-label="Event type">
                    <label className={`rr-event-type-option ${!isAbandonedCheckout ? "is-selected" : ""}`}>
                        <input
                            type="radio"
                            name="eventType"
                            value="PAYMENT_FAILURE"
                            checked={eventType === "PAYMENT_FAILURE"}
                            onChange={() => setEventType("PAYMENT_FAILURE")}
                        />
                        <span className="rr-event-type-radio" />
                        <span>Payment failure</span>
                    </label>

                    <label className={`rr-event-type-option ${isAbandonedCheckout ? "is-selected" : ""}`}>
                        <input
                            type="radio"
                            name="eventType"
                            value="CHECKOUT_ABANDONED"
                            checked={eventType === "CHECKOUT_ABANDONED"}
                            onChange={() => setEventType("CHECKOUT_ABANDONED")}
                        />
                        <span className="rr-event-type-radio" />
                        <span>Checkout abandoned</span>
                    </label>
                </div>
            </div>

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
                    min="0"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    required
                />
            </div>

            {!isAbandonedCheckout && (
                <div className="rr-field">
                    <label className="rr-field-label">Error Code</label>
                    <select
                        className="rr-select"
                        value={errorCode}
                        onChange={(event) => setErrorCode(event.target.value)}
                    >
                        <option value="NETWORK_ERROR">NETWORK_ERROR</option>
                        <option value="TIMEOUT">TIMEOUT</option>
                        <option value="GATEWAY_ERROR">GATEWAY_ERROR</option>
                        <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS</option>
                        <option value="CARD_DECLINED">CARD_DECLINED</option>
                        <option value="UNKNOWN_ERROR">UNKNOWN_ERROR</option>
                    </select>
                </div>
            )}

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

            <button
                className="rr-btn rr-btn-primary"
                type="submit"
                disabled={submitting}
                style={{ width: "100%" }}
            >
                {submitting
                    ? "Processing…"
                    : isAbandonedCheckout
                        ? "Process Abandoned Checkout"
                        : "Analyze Failure"}
            </button>
        </form>
    );
}

export default TransactionForm;
