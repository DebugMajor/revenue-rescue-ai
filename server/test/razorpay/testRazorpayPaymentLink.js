import dotenv from "dotenv";
import razorpayService from "../../services/razorpay/razorpayService.js";

dotenv.config({
    path: "../../.env"
});

const runTest = async () => {
    try {
        const razorpay = razorpayService();

        const result = await razorpay.createPaymentLink(
            50,
            "Revenue Rescue Test",
            "test@example.com"
        );

        console.log("Razorpay Payment Link Response:");
        console.log(result);
    } catch (error) {
        console.error("Payment Link creation failed:", error);
    }
};

runTest();