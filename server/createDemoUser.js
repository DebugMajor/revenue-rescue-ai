import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const createDemoUser = async () => {
    try {
        await connectDB();

        const email = "admin@revenuerescue.ai";
        const password = "Demo@12345";

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            await User.deleteOne({ email });
            console.log("Existing user deleted.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            userId: "demo_admin_001",
            email,
            password: hashedPassword
        });

        await user.save();

        console.log("Demo user created successfully.");
        console.log("Email:", email);
        console.log("Password:", password);

        process.exit(0);
    }
    catch (error) {
        console.error("Failed to create demo user:", error.message);
        process.exit(1);
    }
};

createDemoUser();