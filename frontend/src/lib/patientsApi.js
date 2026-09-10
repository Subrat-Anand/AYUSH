import axiosClient from "./axiosClient";

// Kept short on purpose: if the backend / Atlas is slow or unreachable, we
// want to fail fast and fall back to the local copy rather than make the
// UI hang — see AuthContext.jsx for how each call uses this.
const SHORT_TIMEOUT = 6000;

// PATCH carries the actual clinical data — a finished AI case sheet, an
// uploaded document, a history entry — the one write a doctor is waiting
// on. A short fail-fast timeout here silently drops that data on any slow
// or cold-starting backend (common on free hosting tiers / flaky mobile
// networks), even though it eventually would have succeeded. So this gets
// a much more generous timeout, PLUS a few retries for exactly that kind
// of transient slowness, before AuthContext gives up and queues it for
// background retry.
const WRITE_TIMEOUT = 20000;
const RETRY_DELAYS_MS = [0, 2000, 5000]; // 3 attempts total

async function withRetries(fn) {
  let lastErr;
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i]) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[i]));
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // A real 4xx from a reachable server (bad request, not found, etc.)
      // won't succeed on retry — only retry timeouts/network errors/5xxs.
      const status = err?.response?.status;
      if (status && status < 500) throw err;
    }
  }
  throw lastErr;
}

export async function apiSignup(payload) {
  const { data } = await axiosClient.post("/api/patients/signup", payload, { timeout: SHORT_TIMEOUT });
  return data.patient;
}

export async function apiLogin(userId, password) {
  const { data } = await axiosClient.post(
    "/api/patients/login",
    { userId, password },
    { timeout: SHORT_TIMEOUT }
  );
  return data.patient;
}

export async function apiGetPatient(userId) {
  const { data } = await axiosClient.get(`/api/patients/${encodeURIComponent(userId)}`, {
    timeout: SHORT_TIMEOUT,
  });
  return data.patient;
}

export async function apiListPatients() {
  const { data } = await axiosClient.get("/api/patients", { timeout: SHORT_TIMEOUT });
  return data.patients;
}

export async function apiPatchPatient(userId, patch) {
  const { data } = await withRetries(() =>
    axiosClient.patch(`/api/patients/${encodeURIComponent(userId)}`, patch, {
      timeout: WRITE_TIMEOUT,
    })
  );
  return data.patient;
}
