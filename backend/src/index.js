import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { isGeminiConfigured, GEMINI_MODEL } from "./config/gemini.js";
import { isCloudinaryConfigured } from "./config/cloudinary.js";
import { connectDB, dbReady } from "./config/db.js";
import { initSocket } from "./sockets/io.js";
import chatRoute from "./routes/chat.js";
import caseSummaryRoute from "./routes/caseSummary.js";
import intakeRoute from "./routes/intake.js";
import patientsRoute from "./routes/patients.js";
import uploadsRoute from "./routes/uploads.js";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_ORIGIN }));
// Raised from the old 2mb default: a patient's full record (files +
// history + intake transcript) is sent as ONE JSON PATCH body, and used to
// silently blow past 2mb once a couple of documents were attached — Express
// would reject the request (413) and the doctor would simply never receive
// that update. Now that uploads go to Cloudinary (see routes/uploads.js)
// this payload should usually stay small, but the higher ceiling is kept
// as a safety net for older records that still carry base64 file data.
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    geminiConfigured: isGeminiConfigured,
    model: GEMINI_MODEL,
    cloudinaryConfigured: isCloudinaryConfigured,
    database: dbReady() ? "mongodb-atlas" : "in-memory-fallback",
  });
});

app.use("/api/chat", chatRoute);
app.use("/api/case-summary", caseSummaryRoute);
app.use("/api/intake", intakeRoute);
app.use("/api/patients", patientsRoute);
app.use("/api/uploads", uploadsRoute);

// Wrapping express in a plain http.Server lets Socket.io share the same
// port — one process, one PORT, nothing extra to open on demo day.
const httpServer = http.createServer(app);
initSocket(httpServer, FRONTEND_ORIGIN);

// The server ALWAYS starts and ALWAYS serves traffic, whether or not Atlas
// connects — connectDB() resolves to false on any failure instead of
// throwing, so a bad/missing MONGODB_URI can never take the demo down.
connectDB().finally(() => {
  httpServer.listen(PORT, () => {
    console.log(`Ayush backend running on http://localhost:${PORT}`);
    console.log(
      isGeminiConfigured
        ? `Gemini connected (model: ${GEMINI_MODEL})`
        : "Gemini key not set yet — serving demo replies. Add GEMINI_API_KEY in backend/.env to go live."
    );
    console.log(
      isCloudinaryConfigured
        ? "Cloudinary connected — uploaded documents are stored for real."
        : "Cloudinary not set yet — uploads fall back to local, in-browser previews. Add CLOUDINARY_* keys in backend/.env to go live."
    );
    console.log(
      dbReady()
        ? "MongoDB Atlas connected — patient data is persisted."
        : "Running on the in-memory store — set MONGODB_URI in backend/.env to persist data across restarts."
    );
  });
});
