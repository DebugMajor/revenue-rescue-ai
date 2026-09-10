# Revenue Rescue AI

**Payment Recovery & Decision Governance Platform**

Revenue Rescue AI processes failed payments and abandoned checkouts, evaluates recovery opportunities, applies deterministic policy controls, executes bounded recovery actions, and records the complete decision path.

> **AI recommends. Policy decides. Code executes.**

---

## Overview

Payment failures require different responses. A temporary network failure may be retried immediately, while insufficient funds may require an alternative payment method. High-risk or high-value transactions may require escalation instead of automatic recovery.

Revenue Rescue AI models this process as a governed pipeline:

```text
Payment / Checkout Event
          ↓
     Normalization
          ↓
   Customer Context
          ↓
   Risk Assessment
          ↓
 Recommendation / Fallback
          ↓
    Policy Decision
          ↓
    Recovery Action
          ↓
       Outcome
          ↓
    Decision Trace
          ↓
      Analytics

Events can enter through Razorpay webhooks, CSV batch imports, or the built-in sandbox. All sources use the same processing pipeline.

Key Features
Payment Failure Recovery

Supports common payment failure scenarios such as:

Failure	Example Action
NETWORK_ERROR	RETRY_NOW
TIMEOUT	WAIT_AND_RETRY
INSUFFICIENT_FUNDS	SEND_PAYMENT_LINK
CARD_DECLINED	Governed escalation
GATEWAY_ERROR	Governed recovery decision

The final action is determined by policy checks rather than directly trusting an AI recommendation.

Abandoned Checkout Recovery

Abandoned checkouts are processed as first-class events.

CHECKOUT_ABANDONED
        ↓
Risk Assessment
        ↓
Recommendation
        ↓
Policy
        ↓
RECOVERY_REMINDER
        ↓
PENDING

A subsequent successful payment can resolve the pending recovery.

AI Recommendation + Deterministic Fallback

Gemini provides structured recommendations containing:

Recommended action
Confidence
Reasoning
Analysis summary

AI output is validated before it reaches the policy layer. If AI is unavailable or produces unusable output, deterministic fallback logic keeps the pipeline operational.

Policy Governance

The policy layer acts as a hard boundary between recommendation and execution.

It evaluates conditions such as:

Transaction amount
Risk level
Previous recovery attempts
Maximum retry limits
Allowed recovery actions
Escalation conditions
Decision Trace

Every processed event can be traced from:

Event
 → Risk
 → Recommendation
 → Policy Decision
 → Recovery Action
 → Outcome

This makes recovery decisions explainable and auditable.

Razorpay Integration

Supports payment-related webhook processing with:

HMAC signature verification
Raw request body validation
Webhook event idempotency
Payment lifecycle handling
Payment Link lifecycle handling
CSV Batch Processing

CSV imports allow multiple payment or checkout events to be processed through the same pipeline.

The batch processor reports:

Processed events
Recovered events
Pending events
Escalated events
Invalid rows
Duplicate events
Architecture
┌─────────────────────────────────────────────┐
│              Event Sources                  │
│                                             │
│   Razorpay Webhook │ CSV │ Sandbox          │
└──────────────────────┬──────────────────────┘
                       ↓
              Event Processing
                       ↓
              Customer Context
                       ↓
               Risk Assessment
                       ↓
          AI Recommendation / Fallback
                       ↓
                Policy Engine
                       ↓
              Recovery Action
                       ↓
                  Outcome
                 ↙       ↘
        Decision Trace   MongoDB
                              ↓
                          Analytics
Application Stack
React + Vite
     │
     │ HTTP / JSON
     ↓
Node.js + Express
     │
     ├── Authentication
     ├── Event Processing
     ├── Risk Assessment
     ├── Recommendation
     ├── Policy Engine
     ├── Recovery Execution
     └── Analytics
     │
     ├───────────────┐
     ↓               ↓
  MongoDB         External APIs
                  ├── Razorpay
                  └── Gemini
Screenshots
Dashboard

Decision Trace

Analytics

Evaluation

The project includes a synthetic evaluation dataset containing:

500 unique scenarios
75 customers
15 deliberate duplicate event IDs
Failure, timeout, gateway, insufficient-funds and high-risk scenarios
Maximum-attempt boundary cases
Policy boundary tests
Baseline comparison
AI vs deterministic fallback comparison

The evaluation focuses on recovery outcomes, policy compliance, duplicate handling, and deterministic behavior at decision boundaries.

Security

Implemented security controls include:

JWT authentication
User-scoped event and transaction access
Protected API routes
Razorpay webhook HMAC verification
Webhook idempotency using event IDs
Environment-based secrets
No credentials committed to the repository
Tech Stack

Frontend

React
Vite
Bootstrap
Font Awesome

Backend

Node.js
Express
MongoDB
Mongoose
JWT

Integrations

Razorpay
Google Gemini

Development

Git
GitHub
CSV processing
REST APIs
Repository Structure
revenue-rescue-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── test/
│   └── server.js
│
├── docs/
│   ├── screenshots/
│   └── RevenueRescue-Learning.md
│
├── .gitignore
└── README.md
Local Development
Prerequisites
Node.js
MongoDB
Razorpay account for webhook/payment testing
Gemini API key for AI recommendations
1. Clone
git clone <your-repository-url>
cd revenue-rescue-ai
2. Backend
cd server
npm install

Create server/.env:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=2h

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_USER_ID=your_webhook_user_id

Start the backend:

node server.js

The backend runs on:

http://localhost:5000
3. Frontend

Open another terminal:

cd frontend
npm install
npm run dev

The Vite development server will provide the frontend URL.

Production Deployment

The application can be deployed as a standard frontend + backend web application.

Frontend

Build the React application:

cd frontend
npm run build

Deploy the generated dist/ directory using a static hosting provider such as Vercel or Netlify.

Backend

Deploy the Node.js/Express server using a service such as Render, Railway, or another Node-compatible hosting platform.

Configure the production environment variables on the hosting platform rather than committing .env.

Database

Use a hosted MongoDB deployment such as MongoDB Atlas.

Razorpay Webhooks

After deploying the backend:

Configure the Razorpay webhook endpoint.
Set the webhook secret in the backend environment.
Point Razorpay to the production webhook URL.
Verify webhook signature validation.
Test payment and Payment Link lifecycle events.
Production Architecture
                    ┌───────────────┐
                    │   Razorpay    │
                    └───────┬───────┘
                            │ Webhooks
                            ↓
┌──────────────┐     ┌───────────────┐
│   Frontend   │ ──→ │ Node / Express│
│ React + Vite │     │    Backend    │
└──────────────┘     └───────┬───────┘
                             │
                 ┌───────────┴───────────┐
                 ↓                       ↓
           ┌──────────┐             ┌────────┐
           │ MongoDB  │             │ Gemini │
           └──────────┘             └────────┘
Demo Flow

A simple demonstration can be run entirely from the dashboard:

1. Login
   ↓
2. Open Dashboard
   ↓
3. Submit a failed payment
   ↓
4. Run the recovery pipeline
   ↓
5. Review the recommendation
   ↓
6. Inspect the policy decision
   ↓
7. View the recovery action
   ↓
8. Open Decision Trace
   ↓
9. Review the outcome in Analytics

For batch testing, upload a CSV containing supported payment or checkout events.

Project Status

The core platform is implemented and tested across:

Payment failure recovery
Abandoned checkout recovery
CSV batch processing
Razorpay webhook ingestion
Payment Link lifecycle handling
Authentication and user isolation
Policy enforcement
Recovery execution
Decision tracing
Analytics
Evaluation scenarios
Responsive layouts
License

This project is intended for educational, portfolio, and demonstration purposes.