import { Router } from "express";
import {
  findInternal,
  findPublic,
  listPublic,
  createPatient,
  updatePatient,
  existsUserId,
} from "../lib/patientRepo.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { emitPatientUpdated } from "../sockets/io.js";

const router = Router();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(prefix, len) {
  let s = "";
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return prefix + s;
}
function randomPassword(len = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// A patch body is never trusted with these — they have dedicated,
// server-controlled handling (password hashing, uniqueness, ids).
function sanitizePatch(body = {}) {
  const clone = { ...body };
  delete clone.userId;
  delete clone.password;
  delete clone.passwordHash;
  delete clone._id;
  delete clone.createdAt;
  return clone;
}

// POST /api/patients/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, age, dob, gender, password, language } = req.body || {};
    if (!name?.trim() || !age || !dob) {
      return res.status(400).json({ error: "name, age and dob are required" });
    }

    let userId = randomCode("AYU-", 5);
    for (let attempt = 0; attempt < 5 && (await existsUserId(userId)); attempt++) {
      userId = randomCode("AYU-", 5);
    }

    const finalPassword = password?.trim() ? password.trim() : randomPassword(8);
    const passwordHash = await hashPassword(finalPassword);

    const saved = await createPatient({
      userId,
      passwordHash,
      name: name.trim(),
      age: Number(age),
      dob,
      gender: gender || "",
      language: language || "English",
      files: [],
      history: [],
      reminders: [],
      consultations: [],
      intake: null,
      intakeHistory: [],
      createdAt: new Date().toISOString(),
    });

    emitPatientUpdated(saved);
    res.json({ patient: saved });
  } catch (err) {
    console.error("Signup failed:", err.message);
    res.status(500).json({ error: "Could not create the record on the server right now." });
  }
});

// POST /api/patients/login
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    if (!userId || !password) {
      return res.status(400).json({ error: "userId and password are required" });
    }
    const record = await findInternal(userId);
    if (!record) {
      return res.status(404).json({ error: "User ID or password doesn't match our records." });
    }
    const ok = await verifyPassword(password, record.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "User ID or password doesn't match our records." });
    }
    const { passwordHash, _id, __v, ...publicRecord } = record;
    res.json({ patient: publicRecord });
  } catch (err) {
    console.error("Login failed:", err.message);
    res.status(500).json({ error: "Could not sign in right now." });
  }
});

// GET /api/patients — doctor directory
router.get("/", async (req, res) => {
  try {
    res.json({ patients: await listPublic() });
  } catch (err) {
    console.error("List patients failed:", err.message);
    res.status(500).json({ error: "Could not load the patient directory right now." });
  }
});

// GET /api/patients/:userId
router.get("/:userId", async (req, res) => {
  try {
    const record = await findPublic(req.params.userId);
    if (!record) return res.status(404).json({ error: "No patient found with that User ID." });
    res.json({ patient: record });
  } catch (err) {
    console.error("Get patient failed:", err.message);
    res.status(500).json({ error: "Could not load that patient right now." });
  }
});

// PATCH /api/patients/:userId — generic merge-patch used for everything
// else: files, history, reminders, consultations, intake, language. Both
// the patient's own app and the doctor's actions go through this one
// endpoint, which is what makes every one of those actions show up live
// on the other side via Socket.io.
router.patch("/:userId", async (req, res) => {
  try {
    const patch = sanitizePatch(req.body);
    const updated = await updatePatient(req.params.userId, (current) => ({ ...current, ...patch }));
    if (!updated) return res.status(404).json({ error: "No patient found with that User ID." });
    emitPatientUpdated(updated);
    res.json({ patient: updated });
  } catch (err) {
    console.error("Patch patient failed:", err.message);
    res.status(500).json({ error: "Could not save that change right now." });
  }
});

export default router;
