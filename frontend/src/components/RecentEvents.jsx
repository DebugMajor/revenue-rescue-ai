import { useState, useEffect } from "react";

function RecentEvents() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const getEvents = async () => {
            const res = await fetch("http://localhost:5000/events");
            const data = await res.json();

            setEvents(data.events);
        };

        getEvents();
    }, []);

    return (
        <section>
            <h2>Recent Events</h2>

            {events.length === 0 ? (
                <p>No recent events</p>
            ) : (
                events.map((event) => (
                    <div key={event.eventId}>
                        <p>
                            <strong>Customer ID:</strong> {event.customerId}
                        </p>

                        <p>
                            <strong>Payment Amount:</strong> ₹{event.paymentAmount}
                        </p>

                        <p>
                            <strong>Error Code:</strong> {event.errorCode}
                        </p>

                        <p>
                            <strong>Event Status:</strong> {event.status}
                        </p>

                        <p>
                            <strong>Attempt Number:</strong> {event.attemptNumber}
                        </p>

                        <hr />
                    </div>
                ))
            )}
        </section>
    );
}

export default RecentEvents;