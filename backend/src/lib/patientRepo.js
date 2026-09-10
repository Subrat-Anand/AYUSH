// Single data-access layer the routes talk to. It transparently uses
// MongoDB Atlas when connected, and the in-memory store otherwise — routes
// never need to know or care which one is active.
import Patient from "../models/Patient.js";
import { dbReady } from "../config/db.js";
import { memoryStore } from "./memoryStore.js";

// Strips fields that must never reach the frontend / be re-broadcast.
export function toPublic(obj) {
  if (!obj) return null;
  const plain = obj.toObject ? obj.toObject() : obj;
  const { passwordHash, _id, __v, ...rest } = plain;
  return rest;
}

export async function existsUserId(userId) {
  const id = userId.trim().toUpperCase();
  if (dbReady()) return Boolean(await Patient.exists({ userId: id }));
  return memoryStore.has(id);
}

// Returns the FULL internal record (including passwordHash) — only for
// login verification. Never send this straight to the client.
export async function findInternal(userId) {
  const id = userId.trim().toUpperCase();
  if (dbReady()) {
    const doc = await Patient.findOne({ userId: id });
    return doc ? doc.toObject() : null;
  }
  return memoryStore.get(id);
}

export async function findPublic(userId) {
  return toPublic(await findInternal(userId));
}

export async function listPublic() {
  if (dbReady()) {
    const docs = await Patient.find({}).sort({ createdAt: -1 });
    return docs.map((d) => toPublic(d.toObject()));
  }
  return memoryStore.list().map(toPublic);
}

export async function createPatient(record) {
  const withId = { ...record, userId: record.userId.trim().toUpperCase() };
  if (dbReady()) {
    const doc = await Patient.create(withId);
    return toPublic(doc.toObject());
  }
  memoryStore.save(withId);
  return toPublic(withId);
}

// mutatorFn receives the current plain record and returns the next plain
// record. Works identically whether the record lives in Mongo or memory.
export async function updatePatient(userId, mutatorFn) {
  const id = userId.trim().toUpperCase();

  if (dbReady()) {
    const doc = await Patient.findOne({ userId: id });
    if (!doc) return null;
    const current = doc.toObject();
    const nextData = mutatorFn(current);
    Object.assign(doc, nextData);
    // Belt-and-braces: Mixed-typed arrays/objects are only auto-detected by
    // Mongoose on direct top-level assignment, which Object.assign above
    // already does — these calls just make sure of it either way.
    ["files", "history", "reminders", "consultations", "intake", "intakeHistory"].forEach((f) =>
      doc.markModified(f)
    );
    await doc.save();
    return toPublic(doc.toObject());
  }

  const current = memoryStore.get(id);
  if (!current) return null;
  const next = { ...mutatorFn(current), userId: id };
  memoryStore.save(next);
  return toPublic(next);
}
