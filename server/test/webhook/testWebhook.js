import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const WEBHOOK_URL = "http://localhost:5000/webhooks/razorpay";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is missing from server/.env"
    );
}

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const createSignature = (rawBody) => {
    return crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
};

const sendWebhook = async ({
    rawBody,
    signature,
    eventId
}) => {
    const headers = {
        "Content-Type": "application/json"
    };

    if (signature !== undefined) {
        headers["X-Razorpay-Signature"] = signature;
    }

    if (eventId !== undefined) {
        headers["X-Razorpay-Event-Id"] = eventId;
    }

    const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers,
        body: rawBody
    });

    const responseText = await response.text();

    let body;

    try {
        body = JSON.parse(responseText);
    } catch {
        body = responseText;
    }

    return {
        status: response.status,
        body
    };
};

const runTest = async (name, testFunction) => {
    try {
        await testFunction();

        console.log(`✅ ${name}`);

        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);

        return false;
    }
};

const buildValidPayload = (paymentId = `pay_test_${Date.now()}`) => ({
    entity: "event",
    account_id: "acc_test_revenue_rescue",
    event: "payment.failed",
    contains: ["payment"],
    payload: {
        payment: {
            entity: {
                id: paymentId,
                amount: 5000,
                currency: "INR",
                status: "failed",
                order_id: `order_test_${Date.now()}`,

                // Required by normalizeRazorpayEvent()
                customer_id: "cust_test_001",

                // Unix timestamp in seconds.
                // Required by normalizeRazorpayEvent()
                created_at: Math.floor(Date.now() / 1000),

                error_code: "NETWORK_ERROR",
                error_description:
                    "Simulated network failure for webhook testing."
            }
        }
    }
});

const main = async () => {
    console.log("==================================================");
    console.log("REVENUE RESCUE AI — WEBHOOK HARDENING TESTS");
    console.log("==================================================");
    console.log("");

    const results = [];

    // --------------------------------------------------
    // TEST 1 — VALID PAYMENT.FAILED WEBHOOK
    // --------------------------------------------------
    results.push(
        await runTest(
            "TEST 1: Valid payment.failed webhook",
            async () => {
                const payload = buildValidPayload();

                const rawBody = JSON.stringify(payload);

                const eventId =
                    `evt_test_valid_${Date.now()}`;

                const signature =
                    createSignature(rawBody);

                const response = await sendWebhook({
                    rawBody,
                    signature,
                    eventId
                });

                console.log(
                    `   Response: ${response.status}`,
                    response.body
                );

                assert(
                    response.status >= 200 &&
                        response.status < 300,
                    `Expected 2xx response, got ${response.status}`
                );
            }
        )
    );

    // --------------------------------------------------
    // TEST 2 — INVALID SIGNATURE
    // --------------------------------------------------
    results.push(
        await runTest(
            "TEST 2: Invalid webhook signature is rejected",
            async () => {
                const payload = buildValidPayload();

                const rawBody = JSON.stringify(payload);

                const eventId =
                    `evt_test_invalid_sig_${Date.now()}`;

                const response = await sendWebhook({
                    rawBody,
                    signature:
                        "invalid_signature_123456789",
                    eventId
                });

                console.log(
                    `   Response: ${response.status}`,
                    response.body
                );

                assert(
                    response.status >= 400 &&
                        response.status < 500,
                    `Expected 4xx response, got ${response.status}`
                );
            }
        )
    );

    // --------------------------------------------------
    // TEST 3 — MISSING SIGNATURE
    // --------------------------------------------------
    results.push(
        await runTest(
            "TEST 3: Missing webhook signature is rejected",
            async () => {
                const payload = buildValidPayload();

                const rawBody = JSON.stringify(payload);

                const eventId =
                    `evt_test_missing_sig_${Date.now()}`;

                const response = await sendWebhook({
                    rawBody,
                    eventId
                });

                console.log(
                    `   Response: ${response.status}`,
                    response.body
                );

                assert(
                    response.status >= 400 &&
                        response.status < 500,
                    `Expected 4xx response, got ${response.status}`
                );
            }
        )
    );

    // --------------------------------------------------
    // TEST 4 — MALFORMED JSON
    // --------------------------------------------------
    results.push(
        await runTest(
            "TEST 4: Malformed JSON is handled safely",
            async () => {
                const rawBody =
                    '{"entity":"event","event":"payment.failed"';

                const signature =
                    createSignature(rawBody);

                const eventId =
                    `evt_test_malformed_${Date.now()}`;

                const response = await sendWebhook({
                    rawBody,
                    signature,
                    eventId
                });

                console.log(
                    `   Response: ${response.status}`,
                    response.body
                );

                assert(
                    response.status >= 400 &&
                        response.status < 500,
                    `Expected safe 4xx response, got ${response.status}`
                );
            }
        )
    );

    // --------------------------------------------------
    // TEST 5 — MISSING EVENT TYPE
    // --------------------------------------------------
    results.push(
        await runTest(
            "TEST 5: Missing event type is handled safely",
            async () => {
                const payload = {
                    entity: "event",
                    account_id:
                        "acc_test_revenue_rescue",
                    payload: {}
                };

                const rawBody =
                    JSON.stringify(payload);

                const signature =
                    createSignature(rawBody);

                const eventId =
                    `evt_test_missing_type_${Date.now()}`;

                const response = await sendWebhook({
                    rawBody,
                    signature,
                    eventId
                });

                console.log(
                    `   Response: ${response.status}`,
                    response.body
                );

                assert(
                    response.status >= 400 &&
                        response.status < 500,
                    `Expected safe 4xx response, got ${response.status}`
                );
            }
        )
    );

    // --------------------------------------------------
    // TEST 6 — DUPLICATE PROVIDER EVENT ID
    // --------------------------------------------------
    results.push(
        await runTest(
            "TEST 6: Duplicate provider event ID is handled idempotently",
            async () => {
                const payload =
                    buildValidPayload(
                        `pay_test_duplicate_${Date.now()}`
                    );

                const rawBody =
                    JSON.stringify(payload);

                const signature =
                    createSignature(rawBody);

                const eventId =
                    `evt_test_duplicate_${Date.now()}`;

                // First request
                const firstResponse =
                    await sendWebhook({
                        rawBody,
                        signature,
                        eventId
                    });

                console.log(
                    `   First response: ${firstResponse.status}`,
                    firstResponse.body
                );

                assert(
                    firstResponse.status >= 200 &&
                        firstResponse.status < 300,
                    `First webhook expected 2xx, got ${firstResponse.status}`
                );

                // Second request with EXACT same
                // provider event ID
                const secondResponse =
                    await sendWebhook({
                        rawBody,
                        signature,
                        eventId
                    });

                console.log(
                    `   Second response: ${secondResponse.status}`,
                    secondResponse.body
                );

                assert(
                    secondResponse.status >= 200 &&
                        secondResponse.status < 300,
                    `Duplicate webhook expected 2xx, got ${secondResponse.status}`
                );
            }
        )
    );

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------
    const passed =
        results.filter(Boolean).length;

    const failed =
        results.length - passed;

    console.log("");
    console.log("==================================================");
    console.log("WEBHOOK HARDENING TEST SUMMARY");
    console.log("==================================================");
    console.log(`TOTAL TESTS: ${results.length}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);

    if (failed === 0) {
        console.log("");
        console.log(
            ">>> ALL WEBHOOK HARDENING TESTS PASSED! <<<"
        );

        process.exit(0);
    }

    console.log("");
    console.log(
        ">>> WEBHOOK HARDENING TESTS HAVE FAILURES <<<"
    );

    process.exit(1);
};

main().catch((error) => {
    console.error("");
    console.error("FATAL TEST ERROR:");
    console.error(error);

    process.exit(1);
});