// In-memory fallback "database" — same role as demoFallback.js plays for
// Gemini. If MongoDB Atlas isn't configured or isn't reachable, patient
// data lives here for the lifetime of the process instead, so the app
// still works end-to-end (just without persistence across restarts).
const patients = new Map();

export const memoryStore = {
  get(userId) {
    return patients.get(userId) || null;
  },
  list() {
    return Array.from(patients.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  save(record) {
    patients.set(record.userId, record);
    return record;
  },
  has(userId) {
    return patients.has(userId);
  },
};
