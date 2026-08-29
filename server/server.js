import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(express.json());

// Connect to Database
connectDB();

app.get("/health", (req, res) => {
  res.json({
    status: "OK"
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});
