import { Router } from "express";
import { askGemini, isGeminiConfigured } from "../config/gemini.js";
import { getDemoCaseSheet } from "../lib/demoFallback.js";

const router = Router();

// POST /api/case-summary
// Body:  {
//   patient: { name, age, gender, patientId, contact },
//   chiefComplaint: string,
//   conversation: {role, content}[],   // full AI case-taking Q&A
//   hospital?: { name, department }
// }
// Reply: a full case-sheet object (see buildFallback / schema below), ready
// to render as-is in the "AI Case Sheet" report screen.
router.post("/", async (req, res) => {
  const {
    patient = {},
    chiefComplaint = "",
    conversation = [],
    hospital = { name: "City Care Hospital", department: "Outpatient Department" },
  } = req.body || {};

  const meta = buildMeta({ patient, chiefComplaint, conversation, hospital });

  if (!isGeminiConfigured) {
    return res.json({
      ...meta,
      ...getDemoCaseSheet({ patient, chiefComplaint, conversation }),
      demo: true,
      demoReason: "GEMINI_API_KEY is not set in backend/.env yet.",
    });
  }

  try {
    const prompt = buildCaseSheetPrompt({ patient, chiefComplaint, conversation });
    const raw = await askGemini(prompt);
    const parsed = safeParseJson(raw);
    if (!parsed) throw new Error("Gemini did not return valid JSON for the case sheet.");
    res.json({ ...meta, ...parsed });
  } catch (err) {
    console.error("Gemini case-summary call failed:", err.message);
    res.json({
      ...meta,
      ...getDemoCaseSheet({ patient, chiefComplaint, conversation }),
      demo: true,
      demoReason: err.message,
    });
  }
});

function buildMeta({ patient, chiefComplaint, conversation, hospital }) {
  const now = new Date();
  return {
    reportId: `HA${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    generatedOn: now.toISOString(),
    status: "Ready for Review",
    hospital,
    patient,
    chiefComplaint,
    appointment: {
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
    source: "AI Case-Taking",
    conversationSummary: {
      totalQuestions: conversation.filter((c) => c.role === "assistant").length,
      totalResponses: conversation.filter((c) => c.role === "user").length,
    },
  };
}

function buildCaseSheetPrompt({ patient, chiefComplaint, conversation }) {
  const transcript = conversation.map((c) => `${c.role}: ${c.content}`).join("\n");

  return `You are a clinical AI assistant generating a doctor-review case sheet from an AI case-taking conversation.
This is AI SUGGESTION ONLY — a doctor will review it. Never present this as a final diagnosis.

Patient: ${JSON.stringify(patient)}
Chief complaint: ${chiefComplaint}

Conversation transcript:
${transcript}

Return ONLY a raw JSON object (no markdown fences, no extra text) with this exact shape:
{
  "clinicalSummary": {
    "chiefComplaintText": string,
    "historyOfPresentIllness": string[],
    "pastMedicalHistory": string[],
    "medicationHistory": string[],
    "allergyHistory": string[],
    "familyHistory": string[],
    "personalHistory": string[],
    "reviewOfSystems": string[]
  },
  "redFlags": string[],
  "differentialDiagnosis": string[],
  "recommendedInvestigations": string[]
}`;
}

function safeParseJson(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export default router;
