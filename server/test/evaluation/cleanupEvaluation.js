import "dotenv/config";

import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import Event from "../../models/Event.js";
import RecoveryAttempt from "../../models/RecoveryAttempt.js";
import RecoveryAnalysis from "../../models/RecoveryAnalysis.js";

const main = async () => {
    try {
        await connectDB();

        console.log("==============================================");
        console.log("CLEANING REVENUE RESCUE EVALUATION DATA");
        console.log("==============================================");
        console.log();

        const evaluationEvents = await Event.find({
            eventId: /^EVAL_/
        }).select("_id eventId");

        console.log(
            `Evaluation events found: ${evaluationEvents.length}`
        );

        if (evaluationEvents.length === 0) {
            console.log("Nothing to clean.");
            return;
        }

        const eventIds = evaluationEvents.map(
            (event) => event._id
        );

        const deletedAttempts =
            await RecoveryAttempt.deleteMany({
                event: { $in: eventIds }
            });

        const deletedAnalyses =
            await RecoveryAnalysis.deleteMany({
                event: { $in: eventIds }
            });

        const deletedEvents =
            await Event.deleteMany({
                _id: { $in: eventIds }
            });

        console.log();
        console.log(
            `RecoveryAttempts deleted: ${deletedAttempts.deletedCount}`
        );

        console.log(
            `RecoveryAnalyses deleted: ${deletedAnalyses.deletedCount}`
        );

        console.log(
            `Events deleted:          ${deletedEvents.deletedCount}`
        );

        console.log();
        console.log("Evaluation cleanup complete.");
    } catch (error) {
        console.error();
        console.error("CLEANUP FAILED");
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

main();