# Ayush — Patient App + AI Backend

One project, two folders:

```
ayush-app/
  frontend/   React + Vite + Tailwind app (patient & doctor UI, AI Case Sheet screen)
  backend/    Express server that talks to Gemini (holds the API key)
```

## Run both

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env
npm run dev            # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

- Landing → choose **Patient** or **Doctor**
- Patient: create a record (`AYU-XXXXX`) or sign in
- Doctor access code: `AYUSH-DOC` → Patient sheet → open a patient → **Generate AI Case Sheet**

## Real-time sync (Socket.io) + MongoDB Atlas

Patient records now live in MongoDB Atlas instead of only in the browser's
localStorage, and every change (a new consultation request, an AI intake
being submitted, a doctor's review) pushes live to the other side over
Socket.io — no manual refresh needed, and it now works **across different
browsers, devices, and networks**, not just across tabs of the same browser.

**Zero-risk-on-demo-day design:** if `MONGODB_URI` in `backend/.env` is
left blank, wrong, or Atlas is briefly unreachable, the backend
automatically falls back to an in-memory store and the whole app keeps
working exactly as it did before — signup, login, consultations, AI
intake, everything. Nothing about the database can crash the demo; the
only difference is that data won't survive a server restart until Atlas
is connected. Socket.io behaves the same way: if the socket can't
connect, the app still works fully via the existing REST + localStorage
path, just without the instant live-refresh.

To turn on real persistence + cross-device sync:

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. In Atlas → **Database Access**, create a DB user + password.
3. In Atlas → **Network Access**, allow access from anywhere (`0.0.0.0/0`)
   so it works from wherever judges are testing.
4. In Atlas → **Connect → Drivers**, copy the `mongodb+srv://...` URI.
5. Paste it into `backend/.env` as `MONGODB_URI=...`, with your real DB
   user's password in place of `<password>`.
6. `cd backend && npm install` (installs `mongoose`, `socket.io`, `bcryptjs`)
   and `cd frontend && npm install` (installs `socket.io-client`), then
   restart both servers.

The backend console tells you on startup whether it connected to Atlas or
is running on the in-memory fallback — check that first if something
looks off.

If your frontend and backend are ever hosted on different domains for
judging, update `backend/.env`'s `FRONTEND_ORIGIN` to match the deployed
frontend URL (it's used for both CORS and Socket.io).

## Adding your real Gemini key later

This is the **only file you ever need to touch**:

```
backend/.env
```

```env
GEMINI_API_KEY=your-real-key-here
GEMINI_MODEL=gemini-3.5-flash
```

Everything else — the chat route, the case-sheet route, the intake route, the
AI prompts — reads the key through `backend/src/config/gemini.js` (built on
the current `@google/genai` SDK) and just works once it's set. Until then,
`/api/chat`, `/api/case-summary`, and `/api/intake` automatically return
realistic demo data (see `backend/src/lib/demoFallback.js`) so the whole app,
including the "AI Generated Patient Summary" report screen, works end-to-end
without a key.

## Where things live

| What | File |
|---|---|
| Gemini key / model config | `backend/src/config/gemini.js` |
| Chat endpoint | `backend/src/routes/chat.js` |
| Case-sheet endpoint | `backend/src/routes/caseSummary.js` |
| Demo fallback (no key yet) | `backend/src/lib/demoFallback.js` |
| Chat UI | `frontend/src/pages/ChatTab.jsx` + `frontend/src/lib/chatService.js` |
| **AI Case Sheet report UI** (matches the reference design) | `frontend/src/components/CaseSheetReport.jsx` |
| Doctor screen that generates the case sheet | `frontend/src/pages/DoctorLookupPage.jsx` |
| Frontend → backend URL | `frontend/.env` → `VITE_API_BASE_URL` |
| MongoDB Atlas connection | `backend/.env` → `MONGODB_URI` |
| Patient data model | `backend/src/models/Patient.js` |
| Patient REST API (signup/login/patch) | `backend/src/routes/patients.js` |
| DB-or-memory data access layer | `backend/src/lib/patientRepo.js` |
| Socket.io server (real-time push) | `backend/src/sockets/io.js` |
| Socket.io client + rooms | `frontend/src/lib/socket.js` |
| Patient API calls from the frontend | `frontend/src/lib/patientsApi.js` |


## Quick start on Windows

Run `START-AYUSH.bat` from this folder. It opens the backend and frontend in separate terminals and starts Vite at `http://localhost:5173`.

The Gemini key is stored only in `backend/.env`; the React frontend never receives the key.
