// Entire db metrics

import { useState, useEffect } from "react";

function MetricsPanel() {
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        const getRes = async () => {
            const res = await fetch(
                "http://localhost:5000/analytics/dashboard"
            );

            const data = await res.json();

            setMetrics(data);
        };

        getRes();
    }, []);

    return (
        <section>

            {metrics == null ? (
                <p>Loading metrics...</p>
            ) : (
                <>
                    <div>
                        <h2>Failed Payments</h2>
                        <p>{metrics.failedPayments}</p>
                    </div>

                    <div>
                        <h2>Recovered Payments</h2>
                        <p>{metrics.recoveredPayments}</p>
                    </div>

                    <div>
                        <h2>Recovery Rate</h2>
                        <p>
                            {Math.round(metrics.recoveryRate * 100)}%
                        </p>
                    </div>

                    <div>
                        <h2>Expected Recovery Value</h2>
                        <p>
                             ₹{metrics.expectedRecoveryValue.toLocaleString("en-IN")}
                        </p>
                    </div>
                </>
            )}

        </section>
    );
}

export default MetricsPanel;