import { io } from "socket.io-client";

let socket = null;

// One shared socket for the whole app. Connection failures are swallowed
// on purpose — every real-time feature here is a live-refresh convenience
// on top of data that already works via REST + localStorage, so a flaky
// socket should never surface as a visible error to a patient or doctor.
export function getSocket() {
  if (!socket) {
    const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    socket = io(url, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 8000,
    });
    socket.on("connect_error", () => {
      // Silent — see note above.
    });
  }
  return socket;
}

export function joinPatientRoom(userId) {
  if (!userId) return;
  getSocket().emit("join", { role: "patient", userId });
}

export function joinDoctorRoom() {
  getSocket().emit("join", { role: "doctor" });
}

// Fires whenever ANY patient record changes on the server — a new
// consultation request, an intake submission, a doctor's review, a file
// upload from another device, etc. Returns an unsubscribe function.
export function onPatientUpdated(callback) {
  const s = getSocket();
  s.on("patient:updated", callback);
  return () => s.off("patient:updated", callback);
}
