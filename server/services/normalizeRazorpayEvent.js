const normalizeRazorpayEvent = (payload, providerEventId) => {
    const eventType = payload.event;
    const payment = payload.payload.payment.entity
    return {
        eventId: payment.id,
        customerId: payment.customer_id,
        paymentAmount: payment.amount / 100,
        providerEventId: providerEventId,
        eventType: eventType,
        status: payment.status.toUpperCase(),
        errorCode: payment.error_code,
        attemptNumber: 1,
        timestamp: new Date(payment.created_at * 1000)
    }
};

export default normalizeRazorpayEvent;