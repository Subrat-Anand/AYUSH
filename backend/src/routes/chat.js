import { Router } from "express";
import { askGemini, isGeminiConfigured } from "../config/gemini.js";
import { getDemoChatReply } from "../lib/demoFallback.js";

const router = Router();

// POST /api/chat
// Body:  { message: string, history: {role, content}[], patientContext: object }
// Reply: { reply: string }
router.post("/", async (req, res) => {
  const { message = "", history = [], patientContext = {} } = req.body || {};

  if (!message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  if (!isGeminiConfigured) {
    return res.json({
      reply: getDemoChatReply(message),
      demo: true,
      demoReason: "GEMINI_API_KEY is not set in backend/.env yet.",
    });
  }

  try {
    const prompt = buildChatPrompt({ message, history, patientContext });
    const reply = await askGemini(prompt);
    res.json({ reply });
  } catch (err) {
    console.error("Gemini chat call failed:", err.message);
    res.json({ reply: getDemoChatReply(message), demo: true, demoReason: err.message });
  }
});

function buildChatPrompt({ message, history, patientContext }) {
  const transcript = history
    .map((h) => `${h.role === "user" ? "Patient" : "Ayush"}: ${h.content}`)
    .join("\n");

  return `You are Ayush, a cautious general health assistant embedded in a patient app.
Never provide a diagnosis — always recommend seeing a doctor for anything that sounds serious.
Patient context: ${JSON.stringify(patientContext)}

Conversation so far:
${transcript}

Patient: ${message}
Ayush:`;
}

export default router;
