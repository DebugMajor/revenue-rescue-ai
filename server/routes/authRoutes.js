import express from "express";
import loginUser from "../services/authService.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
const router = express.Router();

router.post("/login", async (req, res) => {
    const email = req.body.email;
    const pass = req.body.password;
    if (typeof email === "string" && email.trim() !== "" && typeof pass === "string" && pass.trim() !== "") {
        try {
            const result = await loginUser(email, pass);
            res.status(200).send({
                status: "OK",
                token: result.token
            })
        }
        catch (error) {
            res.status(401).send({
                status: "ERROR",
                message: "Invalid ID or Password"
            });
        }

    }
    else {
        res.status(400).send({
            status: "ERROR",
            message: "BAD REQUEST"
        })
    }
})

router.post("/register", async (req, res) => {
    const email = req.body.email;
    const pass = req.body.password;

    if (typeof email !== "string" || email.trim() === "" || typeof pass !== "string" || pass.trim() === "") {
        return res.status(400).send({
            status: "ERROR",
            message: "BAD REQUEST"
        });
    }

    try {
        const existingUser = await User.findOne({
            email: email
        });

        if (existingUser) {
            return res.status(409).send({
                status: "ERROR",
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(pass, 10);

        const user = new User({
            email: email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).send({
            status: "OK",
            message: "User successfully created"
        });
    }
    catch (error) {
        res.status(500).send({
            status: "ERROR",
            message: error.message
        });
    }
});


export default router;