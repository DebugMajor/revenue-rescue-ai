import express from "express";
import loginUser from "../services/authService.js";

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

export default router;