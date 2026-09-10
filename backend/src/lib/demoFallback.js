// Local, offline fallback logic — used only when GEMINI_API_KEY isn't set
// yet, so the app (and the doctor's UI) still works end-to-end during
// development. Once a real key is added to .env, these are never called.

export function getDemoChatReply(message = "") {
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
  return `I can give general health guidance, but I can't diagnose conditions. You asked: "${message}". Tell me the symptoms, duration, and severity and I can help you think through next steps.`;
}

// Builds a plausible demo case sheet so the "AI Case-Taking" report screen
// looks and behaves exactly like the real thing before a Gemini key exists.
export function getDemoCaseSheet({ patient = {}, chiefComplaint = "", conversation = [] }) {
  const complaintLower = chiefComplaint.toLowerCase();
  const isChestPain = /chest pain|chest tightness|chest discomfort/.test(complaintLower);

  const base = {
    clinicalSummary: {
      chiefComplaintText: chiefComplaint || "Not specified",
      historyOfPresentIllness: [
        "Pain/discomfort reported by the patient during intake.",
        "Onset, character, and aggravating/relieving factors as described in the conversation.",
      ],
      pastMedicalHistory: patient.pastMedicalHistory?.length
        ? patient.pastMedicalHistory
        : ["No significant past medical history recorded."],
      medicationHistory: patient.medications?.length
        ? patient.medications
        : ["No current medications on file."],
      allergyHistory: ["No known drug allergies."],
      familyHistory: ["No significant family history recorded."],
      personalHistory: ["Not specified."],
      reviewOfSystems: ["No other associated symptoms reported."],
    },
    redFlags: ["No high-risk red flags identified from the conversation."],
    differentialDiagnosis: ["Insufficient data for a differential — recommend full clinical evaluation."],
    recommendedInvestigations: ["Clinical evaluation by a doctor recommended before ordering tests."],
  };

  if (isChestPain) {
    return {
      ...base,
      clinicalSummary: {
        ...base.clinicalSummary,
        historyOfPresentIllness: [
          "Pain is located in the center of the chest.",
          "It is continuous, pressure-like, and non-radiating.",
          "Pain worsens on exertion and relieves on rest.",
          "Associated with sweating and mild breathlessness.",
        ],
        reviewOfSystems: ["No fever, no cough, no abdominal pain.", "No swelling in legs, no palpitations."],
      },
      redFlags: ["Chest pain on exertion", "Associated sweating", "History of Hypertension"],
      differentialDiagnosis: [
        "Stable Angina",
        "Gastroesophageal Reflux Disease",
        "Musculoskeletal Pain",
        "Anxiety-related Chest Pain",
      ],
      recommendedInvestigations: ["ECG", "TMT (Treadmill Test)", "Lipid Profile", "Fasting Blood Sugar", "Chest X-Ray"],
    };
  }

  return base;
}

// ---------------------------------------------------------------------------
// Structured 8-section intake flow (Chief complaint → History of present
// illness → Past medical history → Medication history → Allergy history →
// Family history → Personal history → Review of systems).
//
// This offline state machine mirrors what the Gemini-powered /api/intake
// route does, so the guided intake chat still works end-to-end before a
// real GEMINI_API_KEY is added to backend/.env.
// ---------------------------------------------------------------------------

export const SECTION_NAMES = [
  "Chief complaint",
  "History of present illness",
  "Past medical history",
  "Medication history",
  "Allergy history",
  "Family history",
  "Personal history",
  "Review of systems",
];

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

const SECTION_FIELD = {
  1: { key: "chief_complaint", type: "string" },
  2: { key: "hpi", type: "string" },
  3: { key: "past_medical_history", type: "list" },
  4: { key: "medication_history", type: "list" },
  5: { key: "allergy_history", type: "list" },
  6: { key: "family_history", type: "list" },
  7: { key: "personal_history", type: "list" },
  8: { key: "review_of_systems", type: "string" },
};

const SECTION_QUESTIONS = {
  1: "What's bothering you today?",
  2: "When did it start, and what makes it better or worse?",
  3: "Any known conditions — diabetes, BP, thyroid, asthma?",
  4: "Are you taking any medicines now, including OTC or herbal ones?",
  5: "Do you have any drug or other allergies?",
  6: "Any relevant health conditions in your immediate family?",
  7: "Tell me about your smoking, alcohol, diet, occupation, and sleep.",
  8: "Anything else — fever, cough, appetite, swelling, or palpitations?",
};

const END_PHRASES = /\b(bas itna hi|bas)\b|that'?s it|nothing else|i'?m done|thats all/i;
const NEGATIVE = /^(no|none|nothing|nahi|na|nope)\.?$/i;

// Doctor-facing "AI suggestion only" clinical decision-support, generated
// offline in demo mode from simple keyword matching — mirrors the richer
// version the real Gemini prompt now produces once a chief complaint and
// HPI are on the case sheet. Never shown to the patient.
function deriveClinicalSuggestions(sheet) {
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

/**
 * Offline mirror of the Gemini intake prompt. Given the patient's latest
 * message plus the running case sheet/section, records the answer and
 * returns the same { reply, current_section, intake_complete, case_sheet }
 * shape the real Gemini route returns.
 */
export function getDemoIntakeReply({
  message = "",
  caseSheet = {},
  currentSection = 1,
  doctorNote = "",
}) {
  const sheet = { ...EMPTY_INTAKE_CASE_SHEET, ...caseSheet };
  const trimmed = message.trim();

  const photoMatch = trimmed.match(/\[Patient attached a photo: ([^\]]+)\]/);
  const cleanedMessage = trimmed.replace(/\s*\[Patient attached a photo:[^\]]+\]/, "").trim();
  if (photoMatch) {
    sheet.additional_notes = [...(sheet.additional_notes || []), `Patient shared a photo (${photoMatch[1]}) for visual reference.`];
  }

  const photoNote = photoMatch ? "📷 Got the photo — I've noted it for your doctor. " : "";

  // Doctor sent the case back asking for something specific — ask that
  // first, as a single targeted follow-up, before re-closing the intake.
  if (doctorNote && !cleanedMessage) {
    return {
      reply: `Your doctor would like more detail: ${doctorNote}`,
      current_section: 8,
      intake_complete: false,
      case_sheet: sheet,
    };
  }
  if (doctorNote && cleanedMessage) {
    sheet.additional_notes = [...(sheet.additional_notes || []), cleanedMessage];
    return {
      reply: `${photoNote}Thanks — I've sent that additional detail to your doctor.`,
      current_section: 8,
      intake_complete: true,
      case_sheet: sheet,
    };
  }

  // Very first turn of a fresh intake — nothing to record yet.
  const hasAnyAnswer = Object.entries(sheet).some(([k, v]) =>
    k === "additional_notes" ? false : Array.isArray(v) ? v.length > 0 : Boolean(v)
  );
  if (!cleanedMessage && currentSection === 1 && !hasAnyAnswer) {
    return { reply: SECTION_QUESTIONS[1], current_section: 1, intake_complete: false, case_sheet: sheet };
  }

  // Patient asked to stop early — close out remaining sections.
  if (END_PHRASES.test(cleanedMessage)) {
    for (let s = currentSection; s <= 8; s++) {
      const field = SECTION_FIELD[s];
      if (field.type === "list" && sheet[field.key].length === 0) {
        sheet[field.key] = ["Not discussed — patient ended intake early"];
      } else if (field.type === "string" && !sheet[field.key]) {
        sheet[field.key] = "Not discussed — patient ended intake early";
      }
    }
    sheet.suggested_next_step = sheet.suggested_next_step || "Doctor to complete evaluation — intake ended early by patient.";
    if (sheet.chief_complaint || sheet.hpi) {
      Object.assign(sheet, deriveClinicalSuggestions(sheet));
    }
    return {
      reply: "Understood — I've noted that and sent your case sheet to the doctor.",
      current_section: 8,
      intake_complete: true,
      case_sheet: sheet,
    };
  }

  // Record the answer for the section just asked.
  const field = SECTION_FIELD[currentSection];
  if (field && cleanedMessage) {
    if (field.type === "list") {
      sheet[field.key] = NEGATIVE.test(cleanedMessage)
        ? ["None reported"]
        : cleanedMessage.split(/,| and /i).map((s) => s.trim()).filter(Boolean);
    } else {
      sheet[field.key] = NEGATIVE.test(cleanedMessage) ? "Not significant" : cleanedMessage;
    }
  }

  if (sheet.chief_complaint || sheet.hpi) {
    Object.assign(sheet, deriveClinicalSuggestions(sheet));
  }

  if (currentSection >= 8) {
    sheet.suggested_next_step = sheet.suggested_next_step || "Doctor to review full history and examine patient.";
    return {
      reply: `${photoNote}Thanks — I've noted everything. Your case sheet has been sent to your doctor for review.`,
      current_section: 8,
      intake_complete: true,
      case_sheet: sheet,
    };
  }

  const nextSection = currentSection + 1;
  return {
    reply: `${photoNote}${SECTION_QUESTIONS[nextSection]}`,
    current_section: nextSection,
    intake_complete: false,
    case_sheet: sheet,
  };
}
