// Simple localStorage-backed "database" for the demo.
// In a real deployment, swap these functions for real API calls to your backend.
//
// NOTE: the patient "database" lives in localStorage so it's shared across
// every tab of this browser (that's what lets a doctor tab look up a
// patient created in another tab). The active LOGIN SESSION deliberately
// lives in sessionStorage instead, which is per-tab — so a patient can stay
// signed in on one tab while a doctor is signed in on another, exactly the
// two-tab setup a live demo needs. Don't move SESSION_KEY back to
// localStorage; that would make opening a doctor tab silently log out the
// patient tab (and vice versa).

const PATIENTS_KEY = "ayush_patients";
const SESSION_KEY = "ayush_session";
// The native `storage` event ONLY fires in other tabs, never in the tab
// that made the write — so e.g. a doctor clicking "Mark contacted" would
// never see their own list update without a full page reload. We dispatch
// this custom event on every write too, and onPatientsChanged listens for
// both, so same-tab and cross-tab consumers both refresh immediately.
const PATIENTS_CHANGED_EVENT = "ayush:patients-changed";

function readPatients() {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePatients(map) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(PATIENTS_CHANGED_EVENT));
}

export function listPatients() {
  const map = readPatients();
  return Object.values(map).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getPatient(userId) {
  const map = readPatients();
  return map[userId] || null;
}

export function savePatient(record) {
  const map = readPatients();
  map[record.userId] = record;
  writePatients(map);
  return record;
}

export function deletePatient(userId) {
  const map = readPatients();
  delete map[userId];
  writePatients(map);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

// Fires whenever the shared patient data changes — either from another tab
// of this browser (native `storage` event) or from an action in THIS tab
// (custom event, since `storage` never fires locally). Lets a doctor's own
// click, or a patient's own tab, live-refresh without a manual reload.
// ---------------------------------------------------------------------------
// Pending-sync queue: userIds whose latest change was saved locally but
// failed to reach the server (e.g. the PATCH timed out on a slow/cold-
// starting backend). AuthContext retries these automatically — this is
// what makes "add a document", "log history", or "finish the AI intake"
// actually reliable instead of silently local-only if the network hiccups
// for a moment.
// ---------------------------------------------------------------------------
const PENDING_SYNC_KEY = "ayush_pending_sync";

function readPendingSync() {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePendingSync(list) {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(list));
}

export function markPendingSync(userId) {
  const list = readPendingSync();
  if (!list.includes(userId)) writePendingSync([...list, userId]);
}

export function clearPendingSync(userId) {
  const list = readPendingSync();
  if (list.includes(userId)) writePendingSync(list.filter((id) => id !== userId));
}

export function getPendingSyncIds() {
  return readPendingSync();
}

export function onPatientsChanged(callback) {
  function storageHandler(e) {
    if (e.key === PATIENTS_KEY || e.key === null) callback();
  }
  function localHandler() {
    callback();
  }
  window.addEventListener("storage", storageHandler);
  window.addEventListener(PATIENTS_CHANGED_EVENT, localHandler);
  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(PATIENTS_CHANGED_EVENT, localHandler);
  };
}
