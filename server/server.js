import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import Event from "./models/Event.js";
import processEvent from "./services/processEvent.js";
import getDashboardMetrics from "./services/dashboardAnalyticsService.js";
import router from "./routes/razorpayWebhook.js";
import processDeferredRecoveries from "./services/deferredRecoveryService.js";
import getTransaction from "./services/transactionsService.js";
import getRecoveryQueue from "./services/recoveryCenterService.js";
import recoveryAnalyticsService from "./services/recoveryAnalyticsService.js";


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
app.get("/transactions/:id", async (req, res) => {
  try {
    const result = await getTransaction(req.params.id);
    if (result.message === "NOT FOUND") {
      return res.status(404).json({
        status: "ERROR",
        message: "No entry found!"
      })
    }
    res.json({
      status: "OK",
      ...result
    });
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

//GET Recovery queue
app.get("/recovery", async (req, res) => {
  try {
    const data = await getRecoveryQueue();

    res.json({
      status: "OK",
      recoveries: data
    })
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
})

//GET recovery as per action
app.get("/analytics/recovery-by-action", async (req, res) => {
  try {
    const data = await recoveryAnalyticsService.getRecoveryByAction();
    res.json({
      status: "OK",
      recoveryByAction: data
    })
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
})

//GET recoveries as per error
app.get("/analytics/recovery-by-error", async (req, res) => {
  try {
    const data = await recoveryAnalyticsService.getRecoveryByError();
    res.json({
      status: "OK",
      recoveryByError: data
    })
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
})

//Recovery Trends
app.get("/analytics/recovery-trend", async (req, res) => {
  try {
    const data = await recoveryAnalyticsService.getRecoveryTrend();
    res.json({
      status: "OK",
      recoveryTrends: data
    })
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
})

// GET recoveries by analysis source
app.get("/analytics/recovery-by-source", async (req, res) => {
  try {
    const data = await recoveryAnalyticsService.getRecoveryBySource();

    res.json({
      status: "OK",
      recoveryBySource: data
    });
  }
  catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Started on port ${port}`);
});
