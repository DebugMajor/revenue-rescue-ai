const normalizeRazorpayEvent = (payload, providerEventId) => {
    const eventType = payload.event;
    const payment = payload.payload.payment.entity;

    const customerId =
        payment.customer_id ||
        payment.email ||
        payment.contact ||
        payment.id;

    return {
        eventId: payment.id,
        customerId,
        paymentAmount: payment.amount / 100,
        providerEventId,
        eventType,
        status: payment.status.toUpperCase(),
        errorCode: payment.error_code,
        attemptNumber: 1,
        timestamp: new Date(payment.created_at * 1000)
    };
};

export default normalizeRazorpayEvent;
