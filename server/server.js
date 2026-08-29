import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import analyzeEvent from "./services/analysisService.js";

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
    const analysis = await analyzeEvent(newEntry);
    res.json({
      status: "OK",
      message: "New tranasction saved",
      event: newEntry,
      analysis
    });
  }
  catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({
        status: "ERROR",
        message: error.message
      })
    }
    else if (error.code === 11000) {
      res.status(409).json({
        status: "ERROR",
        message: error.message
      })
    }
    else {
      res.status(500).json({
        status: "ERROR",
        message: error.message
      })
    }
  }
})

//Get events
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json({
      status: "OK",
      events
    })
  }
  catch (error) {
    res.status(500).json({
      message: error.message
    })
  }
})

//Get specific event
app.get("/events/:eventId", async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId });
    if (event === null) {
      res.status(404).json({
        status: "ERROR",
        message: "No entry found!"

      })
    }
    else {
      res.json({
        status: "OK",
        event
      })
    }
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    })
  }
})


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});
