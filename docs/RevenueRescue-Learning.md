# Revenue Rescue AI — Learning Notes

## 1. Backend Architecture

Current backend flow:

```text
Client / Hoppscotch
        ↓
Express API
        ↓
Mongoose
        ↓
MongoDB
```

Current application flow:

```text
POST /events
     ↓
Create Event
     ↓
Save Event
     ↓
Check if FAILED
     ↓
Analyze Event
     ↓
Create RecoveryAnalysis
     ↓
Generate Recommendation
     ↓
Create RecoveryAttempt
     ↓
Execute Recovery Simulation
     ↓
RECOVERED / FAILED
```

Current project structure:

```text
server/
├── config/
│   └── db.js
├── models/
│   ├── Event.js
│   ├── RecoveryAnalysis.js
│   └── RecoveryAttempt.js
├── services/
│   ├── analysisService.js
│   ├── recoveryService.js
│   └── scoring/
│       └── riskScore.js
└── server.js
```

---

# 2. Express

```js
const app = express();
```

Creates the Express application.

### JSON middleware

```js
app.use(express.json());
```

Parses incoming JSON request bodies so data can be accessed through:

```js
req.body
```

### CORS

```js
app.use(cors());
```

Allows the frontend to communicate with the backend from another origin.

### Route

```js
app.post("/events", ...)
```

Handles POST requests for payment events.

```js
app.get("/events", ...)
```

Gets all events.

```js
app.get("/events/:eventId", ...)
```

Gets one event using the application's `eventId`.

### Response

```js
res.json(...)
```

Sends a JSON response to the client.

---

# 3. Event Model

File:

```text
models/Event.js
```

The Event represents the original payment/transaction event received by the system.

Important fields:

```text
eventId
eventType
customerId
paymentAmount
status
errorCode
attemptNumber
timestamp
```

Example:

```json
{
  "eventId": "evt_014",
  "eventType": "PAYMENT_FAILURE",
  "customerId": "cust_005",
  "paymentAmount": 4000,
  "status": "FAILED",
  "errorCode": "NETWORK_ERROR",
  "attemptNumber": 1,
  "timestamp": "2026-08-30T07:30:00.000Z"
}
```

`eventId` is unique so duplicate events can be detected.

MongoDB automatically creates:

```text
_id
```

`_id` is the MongoDB document identifier.

---

# 4. Event Creation

We create a document using:

```js
const newEntry = new Event(req.body);
```

This creates a Mongoose document from the incoming JSON.

It is not stored permanently until:

```js
await newEntry.save();
```

`save()` writes the document to MongoDB.

---

# 5. Error Handling

Validation errors:

```js
if (error.name === "ValidationError")
```

Return:

```text
400 Bad Request
```

Duplicate key:

```js
if (error.code === 11000)
```

Return:

```text
409 Conflict
```

Other unexpected errors:

```text
500 Internal Server Error
```

---

# 6. RecoveryAnalysis Model

File:

```text
models/RecoveryAnalysis.js
```

Stores the analysis performed on a failed Event.

Fields:

```text
event
analysisNumber
analysisSummary
recommendation
confidence
reasoning
```

Automatic timestamps:

```js
{
    timestamps: true
}
```

creates:

```text
createdAt
updatedAt
```

---

# 7. ObjectId References

Example:

```js
event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
}
```

`ObjectId` stores the MongoDB ID of another document.

`ref` tells Mongoose which model the ID refers to.

This creates relationships without copying the entire document.

Example:

```text
Event
  _id
   ↓
RecoveryAnalysis.event
```

---

# 8. Analysis History

One Event can have multiple analyses.

```text
Event
 ├── Analysis #1
 ├── Analysis #2
 └── Analysis #3
```

`analysisNumber` identifies the sequence of analyses for the same Event.

We calculate it using:

```js
const existingAnalyses = await Analysis.countDocuments({
    event: event._id
});

const analysisNumber = existingAnalyses + 1;
```

`countDocuments()` counts documents matching the query.

---

# 9. Recommendation Enum

The Analysis model restricts recommendations to predefined values:

```text
RETRY_NOW
WAIT_AND_RETRY
SEND_PAYMENT_LINK
HUMAN_REVIEW
DO_NOT_RETRY
```

Using `enum` prevents arbitrary unsupported recommendation values.

---

# 10. Analysis Service

File:

```text
services/analysisService.js
```

Main function:

```js
analyzeEvent(event)
```

Purpose:

Analyze a failed event and create a `RecoveryAnalysis`.

Flow:

```text
Event
 ↓
Check status
 ↓
If not FAILED → return
 ↓
Count previous analyses
 ↓
Calculate analysisNumber
 ↓
Check errorCode
 ↓
Generate recommendation
 ↓
Generate confidence
 ↓
Generate summary
 ↓
Generate reasoning
 ↓
Create Analysis document
 ↓
Save Analysis
 ↓
Return saved Analysis
```

Current rules:

```text
NETWORK_ERROR
→ RETRY_NOW

INSUFFICIENT_FUNDS
→ SEND_PAYMENT_LINK

Unknown error
→ HUMAN_REVIEW
```

---

# 11. RecoveryAttempt Model

File:

```text
models/RecoveryAttempt.js
```

Stores an actual recovery action that was performed.

Fields:

```text
event
analysis
recoveryAttemptNumber
action
outcome
outcomeDetails
```

Relationships:

```text
RecoveryAttempt.event
        ↓
Event._id

RecoveryAttempt.analysis
        ↓
RecoveryAnalysis._id
```

This preserves:

```text
Event
 ↓
Analysis
 ↓
Recovery Attempt
 ↓
Outcome
```

---

# 12. Recovery Attempt Number

Recovery attempts have their own history.

We count previous attempts:

```js
const existingAttempts = await RecoveryAttempt.countDocuments({
    event: event._id
});

const recoveryAttemptNumber = existingAttempts + 1;
```

This is different from:

```text
Event.attemptNumber
```

and:

```text
Analysis.analysisNumber
```

They represent different histories.

```text
Event.attemptNumber
→ original payment attempt information

Analysis.analysisNumber
→ number of analyses performed

RecoveryAttempt.recoveryAttemptNumber
→ number of recovery actions performed
```

---

# 13. RecoveryAttempt Action vs Recommendation

These are intentionally separate.

```text
Analysis.recommendation
→ what the system recommends

RecoveryAttempt.action
→ what was actually performed
```

They could differ because the action can eventually be changed or overridden.

Example:

```text
Recommendation:
WAIT_AND_RETRY

Actual action:
SEND_PAYMENT_LINK
```

---

# 14. RecoveryAttempt Outcomes

Allowed outcomes:

```text
PENDING
FAILED
RECOVERED
```

A recovery attempt starts as:

```text
PENDING
```

After execution it is updated.

Example:

```text
PENDING
   ↓
RECOVERED
```

or:

```text
PENDING
   ↓
FAILED
```

An attempt only exists when an actual recovery action is performed.

Therefore:

```text
HUMAN_REVIEW
→ no automated RecoveryAttempt

DO_NOT_RETRY
→ no RecoveryAttempt
```

---

# 15. Recovery Service

File:

```text
services/recoveryService.js
```

Main function:

```js
executeRecovery(event, analysis)
```

Flow:

```text
Event + Analysis
      ↓
Check recommendation
      ↓
HUMAN_REVIEW / DO_NOT_RETRY
→ return
      ↓
Count RecoveryAttempts
      ↓
Calculate recoveryAttemptNumber
      ↓
Create RecoveryAttempt
      ↓
PENDING
      ↓
Execute simulated action
      ↓
Update outcome
      ↓
Save
      ↓
Return saved attempt
```

Current simulation for `RETRY_NOW`:

```text
NETWORK_ERROR
→ RECOVERED

Other error
→ FAILED
```

When recovery succeeds, the Event is also updated:

```text
FAILED
 ↓
RECOVERED
```

The RecoveryAttempt is updated:

```text
PENDING
 ↓
RECOVERED
```

---

# 16. MongoDB Update

We used:

```js
await Event.findOneAndUpdate(
    { _id: event._id },
    { status: "RECOVERED" }
);
```

`_id` must be used for the MongoDB document identifier.

Not:

```js
{ id: event._id }
```

---

# 17. Risk Scoring

File:

```text
services/scoring/riskScore.js
```

The score estimates how favorable an event is for recovery.

Current formula:

```text
score =
0.4 × priorSuccessRate
+
0.3 × attemptFactor
+
0.3 × errorFactor
```

The weights:

```text
0.4
0.3
0.3
```

are **initial heuristic weights**, not proven probabilities.

They represent:

```text
40% → customer historical success
30% → recovery attempt history
30% → error characteristics
```

---

# 18. Prior Success Rate

Function:

```js
getPriorSuccessRate(successfulPayments, totalPayments)
```

Logic:

```text
No history
→ 0.5

History exists
→ successfulPayments / totalPayments
```

`0.5` is used for a new customer because no history means there is insufficient evidence to classify them as either highly reliable or highly unreliable.

---

# 19. Attempt Factor

Current mapping:

```text
1 recovery attempt  → 1.0
2 recovery attempts → 0.6
3 recovery attempts → 0.3
4+ attempts         → 0.1
```

Reason:

More unsuccessful recovery attempts indicate decreasing likelihood that the current recovery path will succeed.

---

# 20. Error Factor

Current deterministic mapping:

```text
NETWORK_ERROR       → 0.5
TIMEOUT             → 0.6
INSUFFICIENT_FUNDS  → 0.3
CARD_DECLINED       → 0.4
UNKNOWN_ERROR       → 0.1
Other/unknown code  → 0.1
```

Higher value means the failure is considered more favorable for recovery.

These are initial heuristic values and can later be replaced/calibrated using actual historical outcomes.

---

# 21. Risk Band

Function:

```js
getRiskBand(score)
```

Current thresholds:

```text
0.70 – 1.00 → LOW
0.40 – 0.69 → MEDIUM
0.00 – 0.39 → HIGH
```

Important:

```text
Higher score
→ higher recovery likelihood
→ lower risk
```

Therefore:

```text
0.77 → LOW
0.50 → MEDIUM
0.20 → HIGH
```

---

# 22. Calculate Risk Score

Function:

```js
calculateRiskScore(
    successfulPayments,
    totalPayments,
    recoveryAttempts,
    errorCode
)
```

It:

```text
calculates priorSuccessRate
        ↓
calculates attemptFactor
        ↓
calculates errorFactor
        ↓
applies weighted formula
        ↓
calculates risk band
        ↓
returns:
{
    riskScore,
    riskBand
}
```

Example:

```text
successfulPayments = 8
totalPayments = 10
recoveryAttempts = 1
errorCode = NETWORK_ERROR
```

Then:

```text
priorSuccessRate = 0.8
attemptFactor = 1.0
errorFactor = 0.5

score =
0.4(0.8)
+ 0.3(1.0)
+ 0.3(0.5)

= 0.77
```

Result:

```json
{
    "riskScore": 0.77,
    "riskBand": "LOW"
}
```

---

# 23. Current Working End-to-End Example

Example input:

```json
{
  "eventId": "evt_014",
  "eventType": "PAYMENT_FAILURE",
  "customerId": "cust_005",
  "paymentAmount": 4000,
  "status": "FAILED",
  "errorCode": "NETWORK_ERROR",
  "attemptNumber": 1,
  "timestamp": "2026-08-30T07:30:00.000Z"
}
```

Current flow:

```text
POST /events
     ↓
Event saved
     ↓
status = FAILED
     ↓
analyzeEvent()
     ↓
errorCode = NETWORK_ERROR
     ↓
recommendation = RETRY_NOW
     ↓
RecoveryAttempt created
     ↓
action = RETRY_NOW
     ↓
outcome = PENDING
     ↓
Simulation
     ↓
outcome = RECOVERED
     ↓
Event.status = RECOVERED
```

---

# 24. Testing

Hoppscotch has been used to test the backend.

Tested successfully:

### NETWORK_ERROR

```text
FAILED
→ RETRY_NOW
→ RecoveryAttempt
→ RECOVERED
```

### INSUFFICIENT_FUNDS

```text
FAILED
→ SEND_PAYMENT_LINK
→ RecoveryAttempt
→ PENDING
```

### Unknown error

```text
FAILED
→ HUMAN_REVIEW
→ no automated RecoveryAttempt
```

The risk scoring functions were also tested independently with Node.

Example:

```text
8 successful / 10 total
1 recovery attempt
NETWORK_ERROR
→ 0.77
→ LOW
```

---

# Current Architecture

```text
                    EVENT
                      │
                      ▼
              Failure Analysis
                      │
                      ▼
                 Risk Score
                      │
                      ▼
                Recommendation
                      │
                      ▼
              Recovery Decision
                      │
                      ▼
             Recovery Attempt
                      │
                      ▼
                 Outcome
                      │
                      ▼
              Historical Data
```

Current database relationship:

```text
Event
 │
 ├──────────────► RecoveryAnalysis
 │                       │
 │                       ▼
 └──────────────► RecoveryAttempt
                         │
                         └──► Analysis
```

The system currently has a deterministic rules/score foundation and simulated recovery execution.


Revenue Rescue AI — Policy Engine v1
1. Policy inputs

The policy engine will receive:

riskScore
riskBand
recommendation
confidence
recoveryAttemptNumber
paymentAmount

Later we can add fraud flags, payment method, gateway, customer segment, etc.

2. Policy outputs

Use exactly three outcomes:

APPROVED
BLOCKED
ESCALATED

And every decision should include a reason.

Example:

{
  "decision": "BLOCKED",
  "reason": "Maximum automatic recovery attempts exceeded"
}
3. Hard limits

For v1, let's lock:

MAX AUTOMATIC RECOVERY ATTEMPTS = 3

Meaning:

Attempt 1 → eligible
Attempt 2 → eligible
Attempt 3 → eligible
Attempt 4+ → BLOCKED

This prevents infinite automated retries.

4. Action classification
Automatically executable actions
RETRY_NOW
WAIT_AND_RETRY
SEND_PAYMENT_LINK
Non-automated recommendations
HUMAN_REVIEW
DO_NOT_RETRY

Therefore:

HUMAN_REVIEW
→ ESCALATED

DO_NOT_RETRY
→ BLOCKED

Don't create a RecoveryAttempt for either one.

5. Escalation rules

A transaction should be:

ESCALATED

when automation is possible in principle but isn't safe enough.

Rule E1
recommendation === HUMAN_REVIEW
→ ESCALATED
Rule E2
riskBand === HIGH
→ ESCALATED
Rule E3
confidence < 0.60
→ ESCALATED

We're using 0.60 as the initial minimum confidence threshold.

This is a v1 business rule, not a statistically validated threshold. Later actual outcomes can tell us whether it is appropriate.

Rule E4
paymentAmount >= ₹100,000
→ ESCALATED

Again, this is an initial high-value transaction safeguard.

6. Blocking rules
Rule B1
recoveryAttemptNumber >= 3
AND another automatic action is being requested
→ BLOCKED

Actually, be careful here.

If attempt number 3 is the current attempt, it is still allowed.

So the cleaner rule is:

recoveryAttemptNumber > 3
→ BLOCKED

For a new attempt:

1 → allowed
2 → allowed
3 → allowed
4 → blocked
Rule B2
recommendation === DO_NOT_RETRY
→ BLOCKED
Rule B3

Unsupported/non-executable recommendation:

recommendation not in executableActions
→ BLOCKED
7. Approval rules

A recovery can be:

APPROVED

only when all of the following are true:

recommendation is executable
AND
recoveryAttemptNumber <= 3
AND
riskBand !== HIGH
AND
confidence >= 0.60
AND
paymentAmount < ₹100,000

Then:

APPROVED
↓
Recovery service executes the action

This is much better than your original:

LOW risk = automatically approve.

A MEDIUM-risk event can still be approved when the other controls pass.

8. Rule precedence

This is critical.

Rules need a deterministic order.

I recommend:

HARD BLOCK
    ↓
ESCALATE
    ↓
APPROVE

So:

1. Check whether action must be blocked
2. Check whether human intervention is required
3. Otherwise approve

Example:

DO_NOT_RETRY
+ LOW risk
+ 90% confidence

Still:

→ BLOCKED

because DO_NOT_RETRY is an explicit hard stop.

Another:

RETRY_NOW
+ HIGH risk
+ 95% confidence

Still:

→ ESCALATED

because high risk requires human review.

9. Policy examples
Example A
Recommendation: RETRY_NOW
Risk: LOW
Confidence: 0.85
Attempt: 1
Amount: ₹2,000
→ APPROVED
Example B
Recommendation: RETRY_NOW
Risk: HIGH
Confidence: 0.95
Attempt: 1
Amount: ₹2,000
→ ESCALATED
Example C
Recommendation: RETRY_NOW
Risk: LOW
Confidence: 0.90
Attempt: 4
Amount: ₹2,000
→ BLOCKED
Example D
Recommendation: HUMAN_REVIEW
Risk: MEDIUM
Confidence: 0.80
Attempt: 1
→ ESCALATED
Example E
Recommendation: DO_NOT_RETRY
Risk: LOW
Confidence: 0.95
Attempt: 1
→ BLOCKED
Example F
Recommendation: RETRY_NOW
Risk: LOW
Confidence: 0.55
Attempt: 1
→ ESCALATED
Example G
Recommendation: RETRY_NOW
Risk: LOW
Confidence: 0.90
Attempt: 1
Amount: ₹150,000
→ ESCALATED
10. The important architecture

This gives us:

                  Event
                    ↓
              Risk Engine
                    ↓
            Recovery Analysis
                    ↓
              Recommendation
                    ↓
             ┌──────────────┐
             │ POLICY ENGINE│
             └───────┬──────┘
                     ↓
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       APPROVED    BLOCKED   ESCALATED
          ↓          ↓          ↓
      Execute       Stop      Human
      Recovery                 Review

The key distinction:

Risk Engine
→ "How favorable does this look?"

Analysis
→ "What should we do?"

Policy Engine
→ "Are we allowed to do it?"

Recovery Engine
→ "Perform the allowed action."