import { Brain, Eye, Heart, Wind, Activity, Bone, Stethoscope } from "lucide-react";

export const BODY_PARTS = [
  { id: "head", label: "Head & Brain", icon: Brain, hint: "Scans, headaches, neuro reports" },
  { id: "eyes-ent", label: "Eyes, Ear, Nose & Throat", icon: Eye, hint: "Vision, hearing, sinus, throat" },
  { id: "heart-chest", label: "Heart & Chest", icon: Heart, hint: "ECG, BP readings, chest scans" },
  { id: "lungs", label: "Lungs & Breathing", icon: Wind, hint: "X-rays, asthma, breathing tests" },
  { id: "abdomen", label: "Abdomen & Digestion", icon: Activity, hint: "Stomach, liver, digestion" },
  { id: "bones-joints", label: "Bones & Joints", icon: Bone, hint: "Fractures, X-rays, physio notes" },
  { id: "general", label: "General / Other", icon: Stethoscope, hint: "Anything that doesn't fit above" },
];

export function bodyPartMeta(id) {
  return BODY_PARTS.find((b) => b.id === id) || BODY_PARTS[BODY_PARTS.length - 1];
}

export const DOCTOR_CODE = "AYUSH-DOC";

export const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
];

export function randomCode(prefix, len) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return prefix + s;
}

export function randomPassword(len = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function formatWhen(iso) {
  if (!iso) return "";
  try {
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

// Local, offline fallback reply — used only if the backend chat call fails,
// so the demo still feels alive without a live Gemini key connected.
export function getDemoBotReply(message) {
  const q = message.toLowerCase();
  if (/\b(chest pain|can't breathe|cannot breathe|difficulty breathing|shortness of breath|faint|unconscious|severe bleeding|stroke)\b/i.test(q)) {
    return "This could be urgent. Please seek emergency medical care now, especially if symptoms are severe, sudden, or getting worse. Ask Ayush is general guidance and cannot diagnose an emergency.";
  }
  if (/\b(headache|head pain|migraine)\b/i.test(q)) {
    return "For a mild headache, rest, drink enough water, and consider whether poor sleep, missed meals, stress, or screen time could be contributing. Seek care if it's sudden, severe, or comes with weakness, confusion, or vision changes.";
  }
  if (/\b(fever|temperature)\b/i.test(q)) {
    return "For a fever, focus on fluids and rest and monitor how you feel. Seek medical advice if it is high, persistent, worsening, or comes with concerning symptoms.";
  }
  if (/\b(diet|food|eat|nutrition|weight)\b/i.test(q)) {
    return "A balanced diet with enough calories, protein, vegetables or fruit, whole grains, and fluids is a good starting point. A doctor or dietitian can tailor this to your goals.";
  }
  if (/\b(sleep|asleep|insomnia)\b/i.test(q)) {
    return "Try a consistent sleep and wake time, less caffeine late in the day, and dimmer screens before bed. Talk to a professional if it persists.";
  }
  return `I can give general health guidance, but I can't diagnose conditions. You asked: "${message}". Tell me the symptoms, duration, and severity and I can help you think through next steps.`;
}

// Front-end-only fallback for the AI Case Sheet screen, used only if the
// backend (and therefore Gemini) is completely unreachable — mirrors
// backend/src/lib/demoFallback.js so the report still renders.
export function getDemoCaseSheetLocal({ patient = {}, chiefComplaint = "", hospital }) {
  const now = new Date();
  const isChestPain = /chest pain|chest tightness|chest discomfort/i.test(chiefComplaint);
  return {
    reportId: `HA${now.getFullYear()}-DEMO-${Math.floor(Math.random() * 90000) + 10000}`,
    generatedOn: now.toISOString(),
    status: "Ready for Review",
    hospital: hospital || { name: "City Care Hospital", department: "Outpatient Department" },
    patient,
    chiefComplaint,
    appointment: {
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
    source: "AI Case-Taking",
    conversationSummary: { totalQuestions: 0, totalResponses: 0 },
    clinicalSummary: {
      chiefComplaintText: chiefComplaint || "Not specified",
      historyOfPresentIllness: isChestPain
        ? [
            "Pain is located in the center of the chest.",
            "It is continuous, pressure-like, and non-radiating.",
            "Pain worsens on exertion and relieves on rest.",
            "Associated with sweating and mild breathlessness.",
          ]
        : ["Not enough data — connect the backend to generate this from the conversation."],
      pastMedicalHistory: ["No significant past medical history recorded."],
      medicationHistory: ["No current medications on file."],
      allergyHistory: ["No known drug allergies."],
      familyHistory: ["No significant family history recorded."],
      personalHistory: ["Not specified."],
      reviewOfSystems: isChestPain
        ? ["No fever, no cough, no abdominal pain.", "No swelling in legs, no palpitations."]
        : ["Not specified."],
    },
    redFlags: isChestPain
      ? ["Chest pain on exertion", "Associated sweating", "History of Hypertension"]
      : ["No high-risk red flags identified."],
    differentialDiagnosis: isChestPain
      ? ["Stable Angina", "Gastroesophageal Reflux Disease", "Musculoskeletal Pain", "Anxiety-related Chest Pain"]
      : ["Insufficient data — recommend full clinical evaluation."],
    recommendedInvestigations: isChestPain
      ? ["ECG", "TMT (Treadmill Test)", "Lipid Profile", "Fasting Blood Sugar", "Chest X-Ray"]
      : ["Clinical evaluation by a doctor recommended."],
    demo: true,
  };
}

// ---------------------------------------------------------------------------
// Structured 8-section intake flow — offline mirror of
// backend/src/lib/demoFallback.js's getDemoIntakeReply, used only if the
// backend /api/intake call fails, so the guided intake still works during
// frontend-only development.
// ---------------------------------------------------------------------------

export const EMPTY_INTAKE_CASE_SHEET = {
  chief_complaint: null,
  duration: null,
  symptoms: [],
  severity: null,
  hpi: null,
  past_medical_history: [],
  medication_history: [],
  allergy_history: [],
  family_history: [],
  personal_history: [],
  review_of_systems: null,
  suggested_next_step: null,
  additional_notes: [],
  red_flags: [],
  differential_diagnosis: [],
  recommended_investigations: [],
};

export const INTAKE_SECTION_NAMES = [
  "Chief complaint",
  "History of present illness",
  "Past medical history",
  "Medication history",
  "Allergy history",
  "Family history",
  "Personal history",
  "Review of systems",
];

const INTAKE_SECTION_FIELD = {
  1: { key: "chief_complaint", type: "string" },
  2: { key: "hpi", type: "string" },
  3: { key: "past_medical_history", type: "list" },
  4: { key: "medication_history", type: "list" },
  5: { key: "allergy_history", type: "list" },
  6: { key: "family_history", type: "list" },
  7: { key: "personal_history", type: "list" },
  8: { key: "review_of_systems", type: "string" },
};

const INTAKE_SECTION_QUESTIONS = {
  1: "What's bothering you today?",
  2: "When did it start, and what makes it better or worse?",
  3: "Any known conditions — diabetes, BP, thyroid, asthma?",
  4: "Are you taking any medicines now, including OTC or herbal ones?",
  5: "Do you have any drug or other allergies?",
  6: "Any relevant health conditions in your immediate family?",
  7: "Tell me about your smoking, alcohol, diet, occupation, and sleep.",
  8: "Anything else — fever, cough, appetite, swelling, or palpitations?",
};

const INTAKE_END_PHRASES = /\b(bas itna hi|bas)\b|that'?s it|nothing else|i'?m done|thats all/i;
const INTAKE_NEGATIVE = /^(no|none|nothing|nahi|na|nope)\.?$/i;

// Mirrors backend/src/lib/demoFallback.js's deriveClinicalSuggestions — only
// used if the /api/intake call itself is unreachable from this browser.
function deriveClinicalSuggestionsLocal(sheet) {
  const text = `${sheet.chief_complaint || ""} ${sheet.hpi || ""}`.toLowerCase();
  if (/chest pain|chest tightness|chest discomfort/.test(text)) {
    return {
      red_flags: ["Chest pain on exertion", "Associated sweating", "History of Hypertension"],
      differential_diagnosis: [
        "Stable Angina",
        "Gastroesophageal Reflux Disease",
        "Musculoskeletal Pain",
        "Anxiety-related Chest Pain",
      ],
      recommended_investigations: ["ECG", "TMT (Treadmill Test)", "Lipid Profile", "Fasting Blood Sugar", "Chest X-Ray"],
    };
  }
  if (/headache|migraine|head pain/.test(text)) {
    return {
      red_flags: /sudden|severe|worst|vision|vomit/.test(text)
        ? ["Severe or sudden-onset headache reported"]
        : ["No high-risk red flags identified from the history so far."],
      differential_diagnosis: ["Tension-type Headache", "Migraine", "Sinusitis"],
      recommended_investigations: ["Blood Pressure Check", "Clinical neurological exam"],
    };
  }
  if (/fever|temperature/.test(text)) {
    return {
      red_flags: /breathless|difficulty breathing|chest pain|confusion|persistent/.test(text)
        ? ["Fever with additional concerning symptoms"]
        : ["No high-risk red flags identified from the history so far."],
      differential_diagnosis: ["Viral Fever", "Bacterial Infection", "Dengue/Typhoid (endemic areas)"],
      recommended_investigations: ["CBC", "Malaria/Dengue/Typhoid panel as indicated", "Temperature monitoring"],
    };
  }
  if (/stomach|abdomen|abdominal|belly pain/.test(text)) {
    return {
      red_flags: ["No high-risk red flags identified from the history so far."],
      differential_diagnosis: ["Gastritis", "Irritable Bowel Syndrome", "Indigestion"],
      recommended_investigations: ["Abdominal examination", "Stool routine (if persistent)"],
    };
  }
  return {
    red_flags: ["No high-risk red flags identified from the history so far."],
    differential_diagnosis: ["Insufficient data for a differential — recommend full clinical evaluation."],
    recommended_investigations: ["Clinical evaluation by a doctor recommended before ordering tests."],
  };
}

export function getDemoIntakeReplyLocal({ message = "", caseSheet = {}, currentSection = 1, doctorNote = "" }) {
  const sheet = { ...EMPTY_INTAKE_CASE_SHEET, ...caseSheet };
  const trimmed = message.trim();

  const photoMatch = trimmed.match(/\[Patient attached a photo: ([^\]]+)\]/);
  const cleanedMessage = trimmed.replace(/\s*\[Patient attached a photo:[^\]]+\]/, "").trim();
  if (photoMatch) {
    sheet.additional_notes = [...(sheet.additional_notes || []), `Patient shared a photo (${photoMatch[1]}) for visual reference.`];
  }
  const photoNote = photoMatch ? "📷 Got the photo — I've noted it for your doctor. " : "";

  if (doctorNote && !cleanedMessage) {
    return {
      reply: `Your doctor would like more detail: ${doctorNote}`,
      current_section: 8,
      intake_complete: false,
      case_sheet: sheet,
      demo: true,
    };
  }
  if (doctorNote && cleanedMessage) {
    sheet.additional_notes = [...(sheet.additional_notes || []), cleanedMessage];
    return {
      reply: `${photoNote}Thanks — I've sent that additional detail to your doctor.`,
      current_section: 8,
      intake_complete: true,
      case_sheet: sheet,
      demo: true,
    };
  }

  const hasAnyAnswer = Object.entries(sheet).some(([k, v]) =>
    k === "additional_notes" ? false : Array.isArray(v) ? v.length > 0 : Boolean(v)
  );
  if (!cleanedMessage && currentSection === 1 && !hasAnyAnswer) {
    return { reply: INTAKE_SECTION_QUESTIONS[1], current_section: 1, intake_complete: false, case_sheet: sheet, demo: true };
  }

  if (INTAKE_END_PHRASES.test(cleanedMessage)) {
    for (let s = currentSection; s <= 8; s++) {
      const field = INTAKE_SECTION_FIELD[s];
      if (field.type === "list" && sheet[field.key].length === 0) {
        sheet[field.key] = ["Not discussed — patient ended intake early"];
      } else if (field.type === "string" && !sheet[field.key]) {
        sheet[field.key] = "Not discussed — patient ended intake early";
      }
    }
    sheet.suggested_next_step = sheet.suggested_next_step || "Doctor to complete evaluation — intake ended early by patient.";
    if (sheet.chief_complaint || sheet.hpi) {
      Object.assign(sheet, deriveClinicalSuggestionsLocal(sheet));
    }
    return {
      reply: "Understood — I've noted that and sent your case sheet to the doctor.",
      current_section: 8,
      intake_complete: true,
      case_sheet: sheet,
      demo: true,
    };
  }

  const field = INTAKE_SECTION_FIELD[currentSection];
  if (field && cleanedMessage) {
    if (field.type === "list") {
      sheet[field.key] = INTAKE_NEGATIVE.test(cleanedMessage)
        ? ["None reported"]
        : cleanedMessage.split(/,| and /i).map((s) => s.trim()).filter(Boolean);
    } else {
      sheet[field.key] = INTAKE_NEGATIVE.test(cleanedMessage) ? "Not significant" : cleanedMessage;
    }
  }

  if (sheet.chief_complaint || sheet.hpi) {
    Object.assign(sheet, deriveClinicalSuggestionsLocal(sheet));
  }

  if (currentSection >= 8) {
    sheet.suggested_next_step = sheet.suggested_next_step || "Doctor to review full history and examine patient.";
    return {
      reply: `${photoNote}Thanks — I've noted everything. Your case sheet has been sent to your doctor for review.`,
      current_section: 8,
      intake_complete: true,
      case_sheet: sheet,
      demo: true,
    };
  }

  const nextSection = currentSection + 1;
  return {
    reply: `${photoNote}${INTAKE_SECTION_QUESTIONS[nextSection]}`,
    current_section: nextSection,
    intake_complete: false,
    case_sheet: sheet,
    demo: true,
  };
}

// Maps the patient-completed intake case sheet into the same shape
// CaseSheetReport already knows how to render, so the doctor sees it in the
// existing report layout.
export function intakeToCaseSheetReport({ intake, patient, hospital }) {
  const sheet = { ...EMPTY_INTAKE_CASE_SHEET, ...(intake?.caseSheet || {}) };
  const messages = intake?.messages || [];
  const generatedOn = intake?.generatedOn || new Date().toISOString();

  return {
    reportId: intake?.reportId || `HA-INTAKE-${Math.floor(Math.random() * 90000) + 10000}`,
    generatedOn,
    status:
      intake?.status === "needs_more_info"
        ? "Sent back — needs more info"
        : intake?.status === "approved"
        ? "Approved by Doctor"
        : "Ready for Review",
    hospital: hospital || { name: "City Care Hospital", department: "Outpatient Department" },
    patient,
    chiefComplaint: sheet.chief_complaint || "Not specified",
    appointment: {
      date: new Date(generatedOn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date(generatedOn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
    source: "Patient AI Intake Chat",
    conversationSummary: {
      totalQuestions: messages.filter((m) => m.role === "assistant").length,
      totalResponses: messages.filter((m) => m.role === "user").length,
    },
    clinicalSummary: {
      chiefComplaintText: sheet.chief_complaint || "Not specified",
      historyOfPresentIllness: [sheet.hpi].filter(Boolean),
      pastMedicalHistory: sheet.past_medical_history,
      medicationHistory: sheet.medication_history,
      allergyHistory: sheet.allergy_history,
      familyHistory: sheet.family_history,
      personalHistory: sheet.personal_history,
      reviewOfSystems: [sheet.review_of_systems, ...(sheet.additional_notes || [])].filter(Boolean),
    },
    redFlags: (sheet.red_flags || []).filter(Boolean),
    differentialDiagnosis: (sheet.differential_diagnosis || []).filter(Boolean),
    recommendedInvestigations: [
      ...(sheet.recommended_investigations || []),
      ...(sheet.suggested_next_step ? [sheet.suggested_next_step] : []),
    ].filter(Boolean),
    demo: Boolean(intake?.demo),
  };
}
