import normalizeRazorpayEvent from "../../services/normalizeRazorpayEvent.js";

const payload = {
    entity: "event",
    account_id: "acc_test_001",
    event: "payment.failed",
    contains: ["payment"],
    payload: {
        payment: {
            entity: {
                id: "pay_test_001",
                entity: "payment",
                amount: 500000,
                currency: "INR",
                status: "failed",
                order_id: "order_test_001",
                method: "upi",
                captured: false,
                email: "customer@example.com",
                contact: "+919999999999",
                error_code: "BAD_REQUEST_ERROR",
                error_description: "Payment failed",
                error_source: "customer",
                error_step: "payment_authorization",
                error_reason: "payment_failed",
                created_at: Math.floor(Date.now() / 1000)
            }
        }
    },
    created_at: Math.floor(Date.now() / 1000)
};

const normalizedEvent = normalizeRazorpayEvent(
    payload,
    "test-webhook-001"
);

console.log("===== NORMALIZED EVENT =====");
console.log(normalizedEvent);