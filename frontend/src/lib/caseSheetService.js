import axiosClient from "./axiosClient";
import { getDemoCaseSheetLocal } from "./constants";

/**
 * Asks YOUR backend to generate an AI case sheet (Gemini-powered) for the
 * given patient + conversation. Same pattern as chatService.js — the
 * frontend never talks to Gemini directly.
 *
 * Expected backend contract — POST {VITE_API_BASE_URL}/api/case-summary
 * body:  { patient, chiefComplaint, conversation, hospital? }
 * reply: full case sheet object (see backend/src/routes/caseSummary.js)
 *
 * Falls back to a local demo case sheet if the backend isn't reachable,
 * so the report screen still renders during frontend-only development.
 */
export async function generateCaseSheet({ patient, chiefComplaint, conversation = [], hospital }) {
  try {
    const { data } = await axiosClient.post("/api/case-summary", {
      patient,
      chiefComplaint,
      conversation,
      hospital,
    });
    return data;
  } catch (err) {
    console.warn("Backend case-summary call failed, using local demo report:", err?.message);
    return getDemoCaseSheetLocal({ patient, chiefComplaint, conversation, hospital });
  }
}
