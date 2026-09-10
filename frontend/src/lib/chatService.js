import axiosClient from "./axiosClient";
import { getDemoBotReply } from "./constants";

/**
 * Sends the user's message (plus a light patient context) to YOUR backend,
 * which should call Gemini and return { reply: string }.
 *
 * Expected backend contract — POST {VITE_API_BASE_URL}/api/chat
 * body:  { message: string, history: {role, content}[], patientContext: object }
 * reply: { reply: string }
 *
 * If the backend isn't running yet, this falls back to a local canned
 * reply so the UI still feels alive during frontend-only development.
 */
export async function sendChatMessage({ message, history, patientContext }) {
  try {
    const { data } = await axiosClient.post("/api/chat", {
      message,
      history,
      patientContext,
    });
    return data.reply ?? getDemoBotReply(message);
  } catch (err) {
    console.warn("Backend chat call failed, using local fallback reply:", err?.message);
    return getDemoBotReply(message);
  }
}
