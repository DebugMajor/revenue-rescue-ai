import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    providerEventId: { type: String, unique: true, sparse: true },
    eventType: { type: String, required: true },
    customerId: { type: String, required: true },
    paymentAmount: { type: Number, required: true },
    status: { type: String, required: true },
    errorCode: { type: String, required: false },
    attemptNumber: { type: Number, required: true },
    timestamp: { type: Date, required: true }
});

const Event = mongoose.model("Event", eventSchema);
export default Event;