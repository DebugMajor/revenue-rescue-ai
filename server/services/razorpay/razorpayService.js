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


    return {
        fetchPayment,
        fetchOrder
    };
}

export default razorpayService;