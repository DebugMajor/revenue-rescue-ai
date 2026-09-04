// Centralized API client for Revenue Rescue AI.
//
// Wraps the REAL backend contract only. No endpoint here is invented —
// every path below corresponds to a route documented in
// BACKEND_API_CONTRACT.md / implemented in the backend services
// (transactionsService.js, recoveryCenterService.js,
// recoveryAnalyticsService.js, dashboardAnalyticsService.js,
// authService.js). If a page needs data that isn't returned by one of
// these calls, that is a real backend gap and must be surfaced honestly
// in the UI, not papered over here.
//
// Backend contract (local dev): http://localhost:5000
//
//   PUBLIC
//     GET  /health
//     POST /auth/login
//
//   PROTECTED (require Authorization: Bearer <JWT>)
//     POST /events/process
//     GET  /events
//     GET  /transactions
//     GET  /transactions/:eventId
//     GET  /recovery
//     GET  /analytics/dashboard
//     GET  /analytics/recovery-by-action
//     GET  /analytics/recovery-by-error
//     GET  /analytics/recovery-trend
//     GET  /analytics/recovery-by-source

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

const TOKEN_KEY = "rr_jwt";

// ---------------------------------------------------------------------
// Token persistence
// ---------------------------------------------------------------------

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — auth just won't persist across refresh */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------
// Session-expiry hook
// ---------------------------------------------------------------------
// AuthContext registers a listener here so that ANY 401 from ANY
// protected call (not just the ones AuthContext itself makes) clears
// auth state and redirects to /login. This keeps the "401 anywhere ->
// logout" rule centralized in one place instead of scattered per page.

let onUnauthorized = null;
export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// ---------------------------------------------------------------------
// Core request helpers
// ---------------------------------------------------------------------

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function handle(response) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Some error responses may not be JSON; fall through with {}.
  }

  if (response.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError(data.message || "Session expired. Please log in again.", 401);
  }

  if (!response.ok) {
    throw new ApiError(data.message || `Request failed (${response.status})`, response.status);
  }

  return data;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...authHeaders() }
  });
  return handle(res);
}

async function post(path, body, { auth = true } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders() : {})
    },
    body: JSON.stringify(body)
  });
  return handle(res);
}

// ---------------------------------------------------------------------
// Defensive array extraction
// ---------------------------------------------------------------------
// The exact wrapper shape for list endpoints (bare array vs
// { status, data } vs a named key) isn't pinned down anywhere in the
// files available to the frontend. Rather than guessing wrong and
// silently showing nothing, this checks the common shapes a JSON API
// built the same way as the rest of this backend would plausibly use.
function extractArray(payload, candidateKeys = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  // Fall back: first array-valued property on the object.
  const firstArray = Object.values(payload).find((v) => Array.isArray(v));
  return firstArray || [];
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export async function login(email, password) {
  // POST /auth/login -> { status: "OK", token: "..." }
  const data = await post("/auth/login", { email, password }, { auth: false });
  return data.token;
}

// ---------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------

export async function getHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handle(res);
}

// ---------------------------------------------------------------------
// Events / transaction simulator
// ---------------------------------------------------------------------

export async function processTransaction(transaction) {
  // POST /events/process — preserved payload/response shape exactly.
  return post("/events/process", transaction);
}

export async function getRecentEvents() {
  // GET /events -> { events: [...] } (latest N, per Event.find())
  const data = await get("/events");
  return extractArray(data, ["events"]);
}

// ---------------------------------------------------------------------
// Transactions (authoritative listing / detail — replaces old /events
// usage on the Transactions & Transaction Detail pages)
// ---------------------------------------------------------------------

export async function getTransactions() {
  // GET /transactions -> transactionsService.getTransactions()
  const data = await get("/transactions");
  return extractArray(data, ["transactions", "events"]);
}

export async function getTransactionById(eventId) {
  // GET /transactions/:eventId -> transactionsService.getTransaction()
  // Service returns { event, attempts } (attempts populated with
  // their Analysis). May be wrapped in { status, ...} — support both.
  const data = await get(`/transactions/${eventId}`);
  const payload = data?.event ? data : data?.data || data;
  return {
    event: payload.event || null,
    attempts: Array.isArray(payload.attempts) ? payload.attempts : []
  };
}

// ---------------------------------------------------------------------
// Recovery Center
// ---------------------------------------------------------------------

export async function getRecoveryQueue() {
  // GET /recovery -> recoveryCenterService.getRecoveryQueue()
  // RecoveryAttempt[] populated with .event and .analysis
  const data = await get("/recovery");
  return extractArray(data, ["recoveryAttempts", "queue", "recovery"]);
}

// ---------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------

export async function getDashboardMetrics() {
  // GET /analytics/dashboard -> flat object:
  // { failedPayments, recoveredPayments, recoveryRate, expectedRecoveryValue }
  return get("/analytics/dashboard");
}

export async function getRecoveryByAction() {
  // GET /analytics/recovery-by-action -> [{ action, outcome, count }]
  const data = await get("/analytics/recovery-by-action");
  return extractArray(data, ["data", "result"]);
}

export async function getRecoveryByError() {
  // GET /analytics/recovery-by-error -> [{ errorCode, outcome, count }]
  const data = await get("/analytics/recovery-by-error");
  return extractArray(data, ["data", "result"]);
}

export async function getRecoveryTrend() {
  // GET /analytics/recovery-trend -> [{ date, outcome, count }]
  const data = await get("/analytics/recovery-trend");
  return extractArray(data, ["data", "result"]);
}

export async function getRecoveryBySource() {
  // GET /analytics/recovery-by-source -> [{ source, outcome, count }]
  const data = await get("/analytics/recovery-by-source");
  return extractArray(data, ["data", "result"]);
}

export { ApiError };
