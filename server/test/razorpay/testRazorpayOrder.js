import dotenv from "dotenv";
import razorpayService from "../../services/razorpay/razorpayService.js";

dotenv.config({
    path: "../../.env"
});

const orderId = "order_invalid123";

const runTest = async () => {
    try {
        const razorpay = razorpayService();

        const result = await razorpay.fetchOrder(orderId);

        console.log("Razorpay Order Response:");
        console.log(result);
    } catch (error) {
        console.error("Order fetch test failed:", error);
    }
};

runTest();