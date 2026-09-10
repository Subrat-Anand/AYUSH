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

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| Production frontend:
| https://ayush2.onrender.com
|
| Local development:
| http://localhost:5173
|--------------------------------------------------------------------------
*/

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests that don't have an Origin header
    // Example: Postman, server-to-server requests, health checks
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      FRONTEND_ORIGIN,
      "https://ayush2.onrender.com",
      "http://localhost:5173",
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`CORS blocked origin: ${origin}`);

    return callback(new Error(`CORS blocked: ${origin}`));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/*
|--------------------------------------------------------------------------
| Handle CORS preflight requests
|--------------------------------------------------------------------------
*/

app.options(/.*/, cors(corsOptions));

/*
|--------------------------------------------------------------------------
| JSON body parser
|--------------------------------------------------------------------------
| Patient records can contain files, history and intake information.
| Cloudinary stores actual files, but old records may still contain
| larger base64 data.
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "15mb",
  })
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,

    geminiConfigured: isGeminiConfigured,

    model: GEMINI_MODEL,

    cloudinaryConfigured: isCloudinaryConfigured,

    database: dbReady()
      ? "mongodb-atlas"
      : "in-memory-fallback",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/chat", chatRoute);

app.use("/api/case-summary", caseSummaryRoute);

app.use("/api/intake", intakeRoute);

app.use("/api/patients", patientsRoute);

app.use("/api/uploads", uploadsRoute);

/*
|--------------------------------------------------------------------------
| HTTP Server
|--------------------------------------------------------------------------
| Socket.io shares the same HTTP server and PORT.
|--------------------------------------------------------------------------
*/

const httpServer = http.createServer(app);

/*
|--------------------------------------------------------------------------
| Socket.io
|--------------------------------------------------------------------------
*/

initSocket(httpServer, FRONTEND_ORIGIN);

/*
|--------------------------------------------------------------------------
| Database Connection + Server Start
|--------------------------------------------------------------------------
*/

connectDB().finally(() => {
  httpServer.listen(PORT, () => {
    console.log(
      `Ayush backend running on http://localhost:${PORT}`
    );

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

    console.log(
      `CORS frontend origin: ${FRONTEND_ORIGIN}`
    );
  });
});