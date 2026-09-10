import { parse } from "csv-parse/sync";
import processEvent from "./processEvent.js";

const REQUIRED_COLUMNS = [
    "eventId",
    "customerId",
    "paymentAmount",
    "status",
    "eventType"
];

const VALID_EVENT_TYPES = [
    "PAYMENT_FAILURE",
    "CHECKOUT_ABANDONED"
];

const VALID_ERROR_CODES = [
    "NETWORK_ERROR",
    "TIMEOUT",
    "GATEWAY_ERROR",
    "CARD_DECLINED",
    "INSUFFICIENT_FUNDS",
    "UNKNOWN_ERROR"
];

const parseCsvBatch = async (csvText, userId) => {
    const rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    if (rows.length === 0) {
        throw new Error("CSV file contains no data rows.");
    }

    const headers = Object.keys(rows[0]);

    const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headers.includes(column)
    );

    if (missingColumns.length > 0) {
        throw new Error(
            `Missing required columns: ${missingColumns.join(", ")}`
        );
    }

    const results = {
        total: rows.length,
        processed: 0,
        recovered: 0,
        pending: 0,
        escalated: 0,
        invalid: 0,
        duplicates: 0,
        errors: []
    };

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];

        try {
            const eventData = validateAndMapRow(row);

            const result = await processEvent(
                eventData,
                userId
            );

            results.processed++;

            if (result.event?.status === "RECOVERED") {
                results.recovered++;
            }
            else if (result.event?.status === "PENDING") {
                results.pending++;
            }
            else if (
                result.policy?.decision === "ESCALATED" ||
                result.policy?.decision === "BLOCKED"
            ) {
                results.escalated++;
            }
        }
        catch (error) {
            if (error.code === 11000) {
                results.duplicates++;

                results.errors.push({
                    row: index + 2,
                    type: "DUPLICATE",
                    message: "Event already exists."
                });

                continue;
            }

            results.invalid++;

            results.errors.push({
                row: index + 2,
                type: "INVALID",
                message: error.message
            });
        }
    }

    return results;
};

const validateAndMapRow = (row) => {
    const eventId = row.eventId?.trim();
    const customerId = row.customerId?.trim();
    const status = row.status?.trim().toUpperCase();
    const eventType = row.eventType?.trim().toUpperCase();

    if (!eventId) {
        throw new Error("eventId is required.");
    }

    if (!customerId) {
        throw new Error("customerId is required.");
    }

    const paymentAmount = Number(row.paymentAmount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        throw new Error("paymentAmount must be a positive number.");
    }

    if (!VALID_EVENT_TYPES.includes(eventType)) {
        throw new Error(
            `Invalid eventType: ${eventType}`
        );
    }

    if (eventType === "PAYMENT_FAILURE") {
        if (status !== "FAILED") {
            throw new Error(
                "PAYMENT_FAILURE must have status FAILED."
            );
        }

        const errorCode = row.errorCode?.trim().toUpperCase();

        if (!VALID_ERROR_CODES.includes(errorCode)) {
            throw new Error(
                `Invalid errorCode: ${errorCode}`
            );
        }

        return {
            eventId,
            customerId,
            paymentAmount,
            status: "FAILED",
            eventType: "PAYMENT_FAILURE",
            errorCode,
            attemptNumber: Number(row.attemptNumber) || 1,
            timestamp: row.timestamp
                ? new Date(row.timestamp)
                : new Date()
        };
    }

    if (eventType === "CHECKOUT_ABANDONED") {
        if (status !== "CHECKOUT_ABANDONED") {
            throw new Error(
                "CHECKOUT_ABANDONED must have status CHECKOUT_ABANDONED."
            );
        }

        return {
            eventId,
            customerId,
            paymentAmount,
            status: "CHECKOUT_ABANDONED",
            eventType: "CHECKOUT_ABANDONED",
            attemptNumber: Number(row.attemptNumber) || 1,
            timestamp: row.timestamp
                ? new Date(row.timestamp)
                : new Date()
        };
    }
};

export default parseCsvBatch;