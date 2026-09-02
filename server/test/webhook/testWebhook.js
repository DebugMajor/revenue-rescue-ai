import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const testId = Date.now();

const payload = {
    entity: "event",
    account_id: `acc_test_${testId}`,
    event: "payment.failed",
    contains: ["payment"],
    payload: {
        payment: {
            entity: {
                customer_id: `test_customer_razorpay_${testId}`,
                id: `pay_test_${testId}`,
                entity: "payment",
                amount: 1250000,
                currency: "INR",
                status: "failed",
                order_id: `order_test_${testId}`,
                method: "upi",
                captured: false,
                email: `customer_${testId}@example.com`,
                contact: "+919777777777",
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

const body = JSON.stringify(payload);

const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

const sendReq = async () => {
    const response = await fetch(
        "http://localhost:5000/webhooks/razorpay",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-razorpay-signature": expectedSignature,
                "x-razorpay-event-id": `test-webhook-${testId}`
            },
            body: body
        }
    );

    const data = await response.json();

    console.log("HTTP Status:", response.status);
    console.log("Response:", data);
};

sendReq();