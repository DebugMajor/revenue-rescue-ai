import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            status: "ERROR",
            message: "Unauthorized"
        });
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "ERROR",
            message: "Unauthorized"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    }
    catch (error) {
        return res.status(401).json({
            status: "ERROR",
            message: "Unauthorized"
        });
    }
};

export default authMiddleware;