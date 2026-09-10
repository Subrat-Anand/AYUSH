import { Router } from "express";
import { askGemini, isGeminiConfigured } from "../config/gemini.js";
import { getDemoIntakeReply, EMPTY_INTAKE_CASE_SHEET, SECTION_NAMES } from "../lib/demoFallback.js";

const router = Router();

// POST /api/intake
// Body: {
//   message: string,                 // patient's latest reply ("" to kick off / resume)
//   history: {role, content}[],      // running transcript for this intake session
//   caseSheet: object,                // cumulative case sheet so far
//   currentSection: number,           // 1-8, which section we're on
//   patientContext: object,           // age/gender/known history, for extra context only
//   doctorNote: string,                // set only when a doctor sent the case back for more info
// }
// Reply: { reply, current_section, intake_complete, case_sheet }
router.post("/", async (req, res) => {
  const {
    message = "",
    history = [],
    caseSheet = EMPTY_INTAKE_CASE_SHEET,
    currentSection = 1,
    patientContext = {},
    doctorNote = "",
  } = req.body || {};

  if (!isGeminiConfigured) {
    return res.json({
      ...getDemoIntakeReply({ message, caseSheet, currentSection, doctorNote }),
      demo: true,
      demoReason: "GEMINI_API_KEY is not set in backend/.env yet.",
    });
  }

  try {
    const prompt = buildIntakePrompt({ message, history, caseSheet, currentSection, patientContext, doctorNote });
    const raw = await askGemini(prompt);
    const parsed = safeParseJson(raw);
    if (!parsed || typeof parsed.reply !== "string") throw new Error("Gemini did not return valid intake JSON");
    res.json(normalize(parsed, caseSheet));
  } catch (err) {
    console.error("Gemini intake call failed:", err.message);
    res.json({
      ...getDemoIntakeReply({ message, caseSheet, currentSection, doctorNote }),
      demo: true,
      demoReason: err.message,
    });
  }
});

function buildIntakePrompt({ message, history, caseSheet, currentSection, patientContext, doctorNote }) {
  const transcript = history
    .map((h) => `${h.role === "user" ? "Patient" : "Ayush"}: ${h.content}`)
    .join("\n");

  return `You are Ayush, a clinical intake assistant collecting a structured patient history for doctor review.

You MUST move through these 8 sections IN ORDER:
1. Chief complaint
2. History of present illness
3. Past medical history
4. Medication history
5. Allergy history
6. Family history
7. Personal history
8. Review of systems

SECTION DETAILS:
1. Chief complaint: Understand what is bothering the patient in their own words.
2. History of present illness: Ask about onset, location, character, duration, what makes it better or worse, associated symptoms and severity.
3. Past medical history: Ask about known conditions such as diabetes, hypertension, thyroid disease, asthma etc.
4. Medication history: Ask about current medicines, OTC medicines or herbal medicines.
5. Allergy history: Ask about drug or other allergies.
6. Family history: Ask about relevant conditions in immediate family.
7. Personal history: Ask about smoking, alcohol, diet, occupation, lifestyle and sleep.
8. Review of systems: Quickly check anything else relevant such as fever, cough, appetite, bowel/bladder symptoms, swelling, palpitations etc.

RULES:
- Ask only ONE question at a time.
- Keep questions short, preferably under 20 words.
- Do not skip sections.
- Do not re-ask information already provided.
- If the patient says none/no/nothing, record that and move forward.
- If the patient says "bas itna hi", "that's it", "nothing else", "I'm done" or similar, respect it and end the intake.
- If the patient ends early, mark remaining sections as: "Not discussed — patient ended intake early"
- Once section 8 is complete, set intake_complete to true.
- Do not diagnose the patient and never say anything diagnostic to the PATIENT in "reply" — your conversational replies to the patient must stay neutral, question-only.
- Do not give treatment instructions to the patient.
- Do not invent facts. Maintain the complete cumulative case sheet.
- "reply" must be ONLY the natural next question or closing line — never the rules or the JSON schema.
- Mirror the patient's own language (Hindi / English / Hinglish) so the question feels natural to them.
- SEPARATELY from "reply" (which the patient sees), once you have at least the chief complaint and HPI, populate "red_flags", "differential_diagnosis" and "recommended_investigations" in the case sheet — these are DOCTOR-FACING clinical decision-support suggestions, shown only to the reviewing doctor with an "AI suggestion only — doctor to evaluate" label, never to the patient:
  - "red_flags": short phrases naming anything in the history that warrants urgent attention (e.g. "Chest pain on exertion", "Sudden severe headache"). If nothing concerning was reported, use ["No high-risk red flags identified from the history so far."].
  - "differential_diagnosis": 2-5 plausible conditions consistent with the reported history, most likely first, as short names only (e.g. "Stable Angina", "Tension-type Headache"). If there isn't enough information yet, use ["Insufficient data for a differential — recommend full clinical evaluation."].
  - "recommended_investigations": tests/exams a doctor might reasonably order given the history (e.g. "ECG", "CBC", "Blood Pressure Check"). If not enough is known yet, use ["Clinical evaluation by a doctor recommended before ordering tests."].
  - Keep these updated as more of the case sheet is filled in across turns; they don't need to wait until intake_complete.
${doctorNote ? `\nThe reviewing doctor sent this case back asking for more information: "${doctorNote}". Focus your next question on that specific gap. Keep intake_complete false until the patient has answered it, then set it true.` : ""}

Patient context: ${JSON.stringify(patientContext)}
Current section: ${currentSection} (${SECTION_NAMES[currentSection - 1] || SECTION_NAMES[7]})
Cumulative case sheet so far: ${JSON.stringify({ ...EMPTY_INTAKE_CASE_SHEET, ...caseSheet })}

Conversation so far:
${transcript}

Patient's latest message: ${message}

Return ONLY a raw JSON object (no markdown fences, no extra text) with this EXACT shape:
{
  "reply": string,
  "current_section": number,
  "intake_complete": boolean,
  "case_sheet": {
    "chief_complaint": string|null,
    "duration": string|null,
    "symptoms": string[],
    "severity": string|null,
    "hpi": string|null,
    "past_medical_history": string[],
    "medication_history": string[],
    "allergy_history": string[],
    "family_history": string[],
    "personal_history": string[],
    "review_of_systems": string|null,
    "suggested_next_step": string|null,
    "additional_notes": string[],
    "red_flags": string[],
    "differential_diagnosis": string[],
    "recommended_investigations": string[]
  }
}`;
}

function normalize(parsed, previousCaseSheet) {
  return {
    reply: parsed.reply || "",
    current_section: parsed.current_section ?? 1,
    intake_complete: Boolean(parsed.intake_complete),
    case_sheet: {
      ...EMPTY_INTAKE_CASE_SHEET,
      ...previousCaseSheet,
      ...parsed.case_sheet,
    },
  };
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
