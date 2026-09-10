# Ayush — health record demo (React + Tailwind + Router)

Stack: React 18, Vite, React Router DOM, Tailwind CSS, Axios, react-hot-toast,
lucide-react, Recharts.

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

Opens at `http://localhost:5173`.

- Landing → choose **Patient** or **Doctor**
- Patient: create a record (get a `AYU-XXXXX` User ID + password) or sign in
- Doctor access code: `AYUSH-DOC`

Data is stored in the browser's `localStorage` for this demo (see
`src/lib/storage.js`) — swap it for real API calls whenever you add a backend
for patients/auth too.

## Wiring up your Gemini backend

The frontend **never** calls Gemini directly — it calls your backend, and your
backend holds `GEMINI_API_KEY` as a server secret. This keeps the key out of
the browser bundle.

1. Set `VITE_API_BASE_URL` in `.env` to your backend's URL (default
   `http://localhost:4000`).
2. Your backend should expose:

   ```
   POST /api/chat
   Body:  { message: string, history: {role, content}[], patientContext: object }
   Reply: { reply: string }
   ```

3. Inside that route, call the Gemini API (e.g. `@google/genai` SDK — the
   older `@google/generative-ai` package is deprecated and does not accept
   the newer "AQ."-prefixed keys Google AI Studio issues by default) using
   `process.env.GEMINI_API_KEY`, feed it `message` + `patientContext`
   for grounding, and return `{ reply: "..." }`.

The chat call itself lives in `src/lib/chatService.js` — if the backend isn't
running yet, it silently falls back to a canned local reply
(`getDemoBotReply` in `src/lib/constants.js`) so the UI still works while you
build the backend.

### Minimal Express example (for reference, not included in this project)

```js
// server/index.js
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/chat", async (req, res) => {
  const { message, patientContext } = req.body;
  const prompt = `You are Ayush, a cautious general health assistant. Patient context: ${JSON.stringify(
    patientContext
  )}. Never diagnose — suggest seeing a doctor for anything serious.\n\nUser: ${message}`;
  const response = await ai.models.generateContent({ model: "gemini-flash-latest", contents: prompt });
  res.json({ reply: response.text });
});

app.listen(4000, () => console.log("Ayush backend on :4000"));
```

## Project structure

```
src/
  lib/          axios client, chat service, localStorage helpers, constants
  context/      AuthContext — patient/doctor session + CRUD actions
  components/   Brandmark, route guards
  pages/        one file per screen, wired with React Router
```
