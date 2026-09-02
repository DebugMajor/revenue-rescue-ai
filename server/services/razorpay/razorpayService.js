function razorpayService() {
    const baseURL = "https://api.razorpay.com/v1";

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const authorizationValue =
        "Basic " +
        Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const fetchPayment = async (paymentId) => {
        const payment = await fetch(
            `${baseURL}/payments/${paymentId}`,
            {
                headers: {
                    Authorization: authorizationValue
                }
            }
        );

        const data = await payment.json();

        if (!payment.ok) {
            throw new Error(
                data.error?.description ||
                data.error?.reason ||
                "Razorpay payment request failed"
            );
        }

        return {
            data
        };
    };

    const fetchOrder = async (orderId) => {
        const order = await fetch(
            `${baseURL}/orders/${orderId}`,
            {
                headers: {
                    Authorization: authorizationValue
                }
            }
        )
        const data = await order.json();
        if (!order.ok) {
            throw new Error(
                data.error?.description ||
                data.error?.reason ||
                "Razorpay order request failed"
            );
        }

        return {
            data
        };
    }

    const createPaymentLink = async (amount, customerName, customerEmail) => {
        const paymentLink = await fetch(
            `${baseURL}/payment_links`,
            {
                method: "POST",
                headers: {
                    Authorization: authorizationValue,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: amount * 100,
                    currency: "INR",
                    description: "Revenue recovery payment",
                    reference_id: `rr_test_${Date.now()}`,
                    customer: {
                        name: customerName,
                        email: customerEmail
                    },
                    notify: {
                        sms: false,
                        email: true
                    }
                })
            }
        );

        const data = await paymentLink.json();

        if (!paymentLink.ok) {
            throw new Error(
                data.error?.description ||
                data.error?.reason ||
                "Razorpay payment link request failed"
            );
        }

        return {
            data
        };
    };

    return {
        fetchPayment,
        fetchOrder,
        createPaymentLink
    };
}

export default razorpayService;