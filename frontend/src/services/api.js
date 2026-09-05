const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

const TOKEN_KEY = "rr_jwt";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  }
  catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  }
  catch {
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  }
  catch {
  }
}

let onUnauthorized = null;

export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

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
  }
  catch {
  }

  if (response.status === 401) {
    clearToken();

    if (onUnauthorized) {
      onUnauthorized();
    }

    throw new ApiError(
      data.message || "Session expired. Please log in again.",
      401
    );
  }

  if (!response.ok) {
    throw new ApiError(
      data.message || `Request failed (${response.status})`,
      response.status
    );
  }

  return data;
}

function authHeaders() {
  const token = getToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function get(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...authHeaders()
    }
  });

  return handle(response);
}

async function post(path, body, { auth = true } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders() : {})
    },
    body: JSON.stringify(body)
  });

  return handle(response);
}

function extractArray(payload, candidateKeys = []) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  const firstArray = Object.values(payload).find(
    (value) => Array.isArray(value)
  );

  return firstArray || [];
}

export async function login(email, password) {
  const data = await post(
    "/auth/login",
    { email, password },
    { auth: false }
  );

  return data.token;
}

export async function register(email, password) {
  return post(
    "/auth/register",
    { email, password },
    { auth: false }
  );
}

export async function getHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  return handle(response);
}

export async function processTransaction(transaction) {
  return post("/events/process", transaction);
}

export async function getRecentEvents() {
  const data = await get("/events");
  return extractArray(data, ["events"]);
}

export async function getTransactions() {
  const data = await get("/transactions");
  return extractArray(data, ["transactions", "events"]);
}

export async function getTransactionById(eventId) {
  const data = await get(`/transactions/${eventId}`);
  const payload = data?.event ? data : data?.data || data;

  return {
    event: payload.event || null,
    analysis: payload.analysis || null,
    attempts: Array.isArray(payload.attempts)
      ? payload.attempts
      : []
  };
}

export async function getRecoveryQueue() {
  const data = await get("/recovery");

  return extractArray(data, [
    "recoveryAttempts",
    "queue",
    "recovery",
    "recoveries"
  ]);
}

export async function getDashboardMetrics() {
  return get("/analytics/dashboard");
}

export async function getRecoveryByAction() {
  const data = await get("/analytics/recovery-by-action");

  return extractArray(data, [
    "data",
    "result",
    "recoveryByAction"
  ]);
}

export async function getRecoveryByError() {
  const data = await get("/analytics/recovery-by-error");

  return extractArray(data, [
    "data",
    "result",
    "recoveryByError"
  ]);
}

export async function getRecoveryTrend() {
  const data = await get("/analytics/recovery-trend");

  return extractArray(data, [
    "data",
    "result",
    "recoveryTrends"
  ]);
}

export async function getRecoveryBySource() {
  const data = await get("/analytics/recovery-by-source");

  return extractArray(data, [
    "data",
    "result",
    "recoveryBySource"
  ]);
}

export { ApiError };