import { Server } from "socket.io";

let io = null;

// Two rooms only, by design — keeps this easy to reason about:
//   patient:<USERID>  — that one patient's own open tabs/devices
//   doctors            — every doctor-mode client, gets every update
export function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on("join", (payload) => {
      const { role, userId } = payload || {};
      if (role === "patient" && userId) {
        socket.join(`patient:${userId.trim().toUpperCase()}`);
      } else if (role === "doctor") {
        socket.join("doctors");
      }
    });
  });

  console.log("Socket.io real-time layer ready.");
  return io;
}

// Call this after ANY successful patient create/update. Pushes the fresh
// record to that patient's own tabs AND every doctor watching — this is
// what makes a new consultation request, an intake submission, or a
// doctor's review show up live without anyone refreshing.
export function emitPatientUpdated(patient) {
  if (!io || !patient?.userId) return;
  io.to(`patient:${patient.userId}`).to("doctors").emit("patient:updated", patient);
}
