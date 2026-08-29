import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// Connect to Database
connectDB();

app.get("/health", (req, res) => {
  res.json({
    status: "OK"
  });
});


//Post route for accepting the tranx req
app.post("/events", async (req, res) => {
  try {
    const newEntry = new Event(req.body);
    await newEntry.save();
    res.json({
      status: "OK",
      message: "New tranasction saved",
      event: newEntry
    });
  }
  catch (error) {
    res.status(400).json({
      status: "ERROR",
      message: error
    })

  }

})


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});
