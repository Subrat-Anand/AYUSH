import axiosClient from "./axiosClient";
import { getDemoIntakeReplyLocal } from "./constants";

/**
 * Drives one turn of the structured 8-section intake conversation.
 *
 * Expected backend contract — POST {VITE_API_BASE_URL}/api/intake
 * body:  { message, history, caseSheet, currentSection, patientContext, doctorNote }
 * reply: { reply, current_section, intake_complete, case_sheet }
 *
 * Falls back to a local offline copy of the same state machine if the
 * backend isn't reachable, so the guided intake still works end-to-end
 * during frontend-only development.
 */
export async function sendIntakeTurn({
  message = "",
  history = [],
  caseSheet = {},
  currentSection = 1,
  patientContext = {},
  doctorNote = "",
}) {
  try {
    const { data } = await axiosClient.post("/api/intake", {
      message,
      history,
      caseSheet,
      currentSection,
      patientContext,
      doctorNote,
    });
    return data;
  } catch (err) {
    console.warn("Backend intake call failed, using local fallback:", err?.message);
    return getDemoIntakeReplyLocal({ message, caseSheet, currentSection, doctorNote });
  }
}
