import dotenv from "dotenv";
import razorpayService from "../../services/razorpay/razorpayService.js";
dotenv.config({
    path: "../../.env"
});

const paymentId = "pay_TX5uj7X6eGSZOy";

const runTest = async () => {
    try {
        const razorpay = razorpayService();

        const result = await razorpay.fetchPayment(paymentId);

        console.log("Razorpay Payment Response:");
        console.log(result);
    } catch (error) {
        console.error("Payment fetch test failed:", error);
    }
};

runTest();