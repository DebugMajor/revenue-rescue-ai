import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import processEvent from "./services/processEvent.js";
import getDashboardMetrics from "./services/dashboardAnalyticsService.js";
import router from "./routes/razorpayWebhook.js";
import processDeferredRecoveries from "./services/deferredRecoveryService.js";


dotenv.config();

const app = express();
app.use(cors());

app.use(
  "/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  router
);
app.use(express.json());


// Connect to Database
connectDB();

app.get("/health", (req, res) => {
  res.json({
    status: "OK"
  });
});



//Process Events 
app.post("/events/process", async (req, res) => {
  try {
    const result = await processEvent(req.body);

    res.json({
      status: "OK",
      ...result
    });
  }
  catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "ERROR",
        message: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: "ERROR",
        message: error.message
      });
    }

    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
});

//Get events
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: -1 }).limit(5);
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

//GET dashboard analytics
app.get("/analytics/dashboard", async (req, res) => {
  try {
    const result = await getDashboardMetrics();
    res.json({
      status: "OK",
      ...result
    });
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
})

setInterval(async () => {
  try {
    await processDeferredRecoveries();
  } catch (error) {
    console.error(
      "Deferred recovery processing failed:",
      error
    );
  }
}, 10000);


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});
