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
    // Allow requests without Origin header
    // Example: Postman, curl, server-to-server requests
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
| CORS Preflight
|--------------------------------------------------------------------------
*/

app.options(/.*/, cors(corsOptions));

/*
|--------------------------------------------------------------------------
| JSON Body Parser
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
| Global Error Handler
|--------------------------------------------------------------------------
| This is important for debugging.
| If Express/body-parser rejects a request, we will get the
| real error instead of only "Bad Request".
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error("========================================");
  console.error("REQUEST ERROR");
  console.error("========================================");

  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Message:", err.message);
  console.error("Type:", err.type);
  console.error("Status:", err.status);

  console.error("========================================");

  res.status(err.status || 500).json({
    error: err.message || "Request failed",
    type: err.type || "unknown",
    status: err.status || 500,
  });
});

/*
|--------------------------------------------------------------------------
| HTTP Server
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