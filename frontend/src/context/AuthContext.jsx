import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getPatient,
  savePatient,
  listPatients,
  getSession,
  setSession as persistSession,
  onPatientsChanged,
  markPendingSync,
  clearPendingSync,
  getPendingSyncIds,
} from "../lib/storage";
import { DOCTOR_CODE, randomCode, randomPassword } from "../lib/constants";
import { apiSignup, apiLogin, apiGetPatient, apiListPatients, apiPatchPatient } from "../lib/patientsApi";
import { joinPatientRoom, joinDoctorRoom, onPatientUpdated, getSocket } from "../lib/socket";

const AuthContext = createContext(null);

// Every mutation in this file follows the same shape: update the local
// cache + React state immediately (so the UI never waits on the network),
// then sync to the backend/MongoDB Atlas in the background. If Atlas or
// the network is unreachable, the change still lives in localStorage
// exactly like the original offline-only version of this app — nothing
// about this demo can be broken by a bad connection.
function stripInternal(record) {
  const { password, ...rest } = record || {};
  return rest;
}

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());
  const [patient, setPatient] = useState(() => {
    const s = getSession();
    return s?.type === "patient" ? getPatient(s.userId) : null;
  });

  useEffect(() => {
    persistSession(session);
  }, [session]);

  // Keep the logged-in patient's own record live-synced with the shared
  // local cache. This already covers BOTH same-browser tab changes and
  // now also cross-device changes too, because the socket listener below
  // writes any remote update straight into this same local cache.
  useEffect(() => {
    if (session?.type !== "patient") return undefined;
    return onPatientsChanged(() => {
      setPatient((prev) => getPatient(session.userId) || prev);
    });
  }, [session]);

  // One-time bootstrap: reconnect socket rooms on page refresh, hydrate
  // the doctor directory from the server, and register the single
  // real-time listener that every consultation request, intake
  // submission, and doctor review flows through.
  useEffect(() => {
    const s = getSession();
    if (s?.type === "doctor") {
      joinDoctorRoom();
      hydrateAllPatients();
    } else if (s?.type === "patient") {
      joinPatientRoom(s.userId);
      apiGetPatient(s.userId)
        .then((remote) => savePatient(remote))
        .catch(() => {
          // Offline is fine — the local cache already loaded synchronously above.
        });
    }

    const unsubscribe = onPatientUpdated((updated) => {
      if (updated?.userId) savePatient(updated);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retries any change (a finished AI case sheet, an uploaded document, a
  // history entry, a doctor's review) that saved locally but failed to
  // reach the server — e.g. the PATCH timed out on a slow/cold-starting
  // backend or a flaky connection. Without this, that data would silently
  // never reach the other side. Runs on load, whenever the browser comes
  // back online, whenever the socket (re)connects, and on a short interval
  // as a safety net — so a patient's or doctor's update reliably shows up
  // for the other side in real time, even if the first attempt didn't land.
  useEffect(() => {
    let cancelled = false;

    async function flushPendingSync() {
      const ids = getPendingSyncIds();
      for (const id of ids) {
        if (cancelled) return;
        const record = getPatient(id);
        if (!record) {
          clearPendingSync(id);
          continue;
        }
        try {
          const remote = await apiPatchPatient(id, stripInternal(record));
          if (cancelled) return;
          savePatient(remote);
          setPatient((prev) => (prev?.userId === id ? remote : prev));
          clearPendingSync(id);
          toast.success("Synced — this is now visible on the other side.");
        } catch {
          // Still unreachable — stays queued, next trigger will retry it.
        }
      }
    }

    flushPendingSync();
    const onOnline = () => flushPendingSync();
    window.addEventListener("online", onOnline);
    const socket = getSocket();
    socket.on("connect", flushPendingSync);
    const interval = setInterval(() => {
      if (getPendingSyncIds().length > 0) flushPendingSync();
    }, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      socket.off("connect", flushPendingSync);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hydrateAllPatients() {
    apiListPatients()
      .then((list) => list.forEach((p) => savePatient(p)))
      .catch((err) =>
        console.warn("Could not load the patient directory from the server — showing locally cached patients only:", err?.message)
      );
  }

  function refreshPatient(userId) {
    const fresh = getPatient(userId);
    setPatient(fresh);
    return fresh;
  }

  // --- Auth --------------------------------------------------------------

  async function signup({ name, age, dob, gender, password, language }) {
    if (!name.trim() || !age || !dob) {
      throw new Error("Please fill in name, age, and date of birth.");
    }
    const finalPassword = password?.trim() ? password.trim() : randomPassword(8);
    let userId = randomCode("AYU-", 5);
    let finalRecord;

    try {
      const remotePatient = await apiSignup({
        name: name.trim(),
        age: Number(age),
        dob,
        gender: gender || "",
        password: finalPassword,
        language: language || "English",
      });
      userId = remotePatient.userId;
      finalRecord = { ...remotePatient, password: finalPassword };
    } catch (err) {
      console.warn("Backend signup unreachable — continuing on this device only:", err?.message);
      finalRecord = {
        userId,
        password: finalPassword,
        name: name.trim(),
        age: Number(age),
        dob,
        gender: gender || "",
        language: language || "English",
        files: [],
        history: [],
        reminders: [],
        consultations: [],
        createdAt: new Date().toISOString(),
      };
    }

    savePatient(finalRecord);
    setSessionState({ type: "patient", userId });
    setPatient(finalRecord);
    joinPatientRoom(userId);
    toast.success(`Record created — you're ${userId}`);
    return { userId, password: finalPassword, name: finalRecord.name };
  }

  async function login({ userId, password }) {
    const id = userId.trim().toUpperCase();

    try {
      const remotePatient = await apiLogin(id, password);
      savePatient(remotePatient);
      setSessionState({ type: "patient", userId: id });
      setPatient(remotePatient);
      joinPatientRoom(id);
      toast.success(`Welcome back, ${remotePatient.name.split(" ")[0]}`);
      return remotePatient;
    } catch (err) {
      // A reachable backend that rejected the credentials should say so
      // directly — only a genuinely unreachable backend falls back to the
      // last-known local copy, so the demo still works fully offline.
      if (err?.response && [401, 404].includes(err.response.status)) {
        throw new Error(err.response.data?.error || "User ID or password doesn't match our records.");
      }
      console.warn("Backend login unreachable — checking the local copy on this device:", err?.message);
      const record = getPatient(id);
      if (!record || record.password !== password) {
        throw new Error("User ID or password doesn't match our records.");
      }
      setSessionState({ type: "patient", userId: id });
      setPatient(record);
      joinPatientRoom(id);
      toast.success(`Welcome back, ${record.name.split(" ")[0]}`);
      return record;
    }
  }

  function unlockDoctor(code) {
    if (code.trim().toUpperCase() !== DOCTOR_CODE) {
      throw new Error("That access code isn't recognised.");
    }
    setSessionState({ type: "doctor" });
    joinDoctorRoom();
    hydrateAllPatients();
    toast.success("Doctor access granted");
  }

  function logout() {
    setSessionState(null);
    setPatient(null);
    toast("Logged out", { icon: "👋" });
  }

  // --- Generic patient-record updater -------------------------------------
  // Used by every patient-side action below. Mutates on top of the LATEST
  // persisted record (not stale React state — see original comment this
  // preserves), saves it locally right away, then reconciles with the
  // server in the background over Socket.io + REST.
  async function updatePatientRecord(mutator) {
    const latest = getPatient(patient?.userId) || patient;
    if (!latest) return null;
    const next = mutator(latest);
    savePatient(next);
    setPatient(next);
    try {
      const remote = await apiPatchPatient(next.userId, stripInternal(next));
      savePatient(remote);
      setPatient(remote);
      clearPendingSync(next.userId);
      return remote;
    } catch (err) {
      console.warn("Background sync failed — change is saved locally on this device:", err?.message);
      markPendingSync(next.userId);
      toast.error("Saved on this device, but couldn't reach the server yet — your doctor won't see this until it syncs. Retrying automatically…");
      return next;
    }
  }

  // Doctor-side equivalent: works on ANY patient's record, not just the
  // logged-in one (mirrors updatePatientRecord above).
  async function updateAnyPatient(userId, mutator) {
    const id = userId.trim().toUpperCase();
    const current = getPatient(id) || { userId: id };
    const next = mutator(current);
    savePatient(next);
    if (patient?.userId === id) setPatient(next);
    try {
      const remote = await apiPatchPatient(id, stripInternal(next));
      savePatient(remote);
      if (patient?.userId === id) setPatient(remote);
      clearPendingSync(id);
      return remote;
    } catch (err) {
      console.warn("Background sync failed for this doctor action:", err?.message);
      markPendingSync(id);
      toast.error("Saved on this device, but couldn't reach the server yet. Retrying automatically…");
      return next;
    }
  }

  // --- Structured AI intake (guided 8-section case-taking chat) ---------

  function saveIntakeProgress({ messages, caseSheet, currentSection, status = "in_progress", demo, demoReason }) {
    updatePatientRecord((p) => ({
      ...p,
      intake: {
        ...(p.intake || {}),
        messages,
        caseSheet,
        currentSection,
        status,
        doctorNote: status === "needs_more_info" ? p.intake?.doctorNote || "" : "",
        demo: Boolean(demo),
        demoReason: demoReason || "",
      },
    }));
  }

  function submitIntakeToDoctor({ messages, caseSheet, demo, demoReason }) {
    updatePatientRecord((p) => ({
      ...p,
      intake: {
        ...(p.intake || {}),
        messages,
        caseSheet,
        currentSection: 8,
        status: "sent",
        doctorNote: "",
        generatedOn: new Date().toISOString(),
        demo: Boolean(demo),
        demoReason: demoReason || "",
      },
    }));
  }

  // Doctor-side: send a patient's already-submitted intake back for more
  // info. Works on any patient record, not just the logged-in one.
  async function sendIntakeBack(userId, note) {
    const updated = await updateAnyPatient(userId, (record) => ({
      ...record,
      intake: { ...(record.intake || {}), status: "needs_more_info", doctorNote: note || "" },
    }));
    toast.success("Sent back to the patient for more info");
    return updated;
  }

  // Doctor-side: final sign-off on a patient's submitted intake.
  async function approveIntake(userId, note) {
    const updated = await updateAnyPatient(userId, (record) => ({
      ...record,
      intake: {
        ...(record.intake || {}),
        status: "approved",
        doctorNote: note || "",
        approvedOn: new Date().toISOString(),
      },
    }));
    toast.success("Case sheet approved");
    return updated;
  }

  // Patient-side: archive the just-finished intake and reset so a new
  // case (new visit) can be started from scratch.
  function startNewIntake() {
    updatePatientRecord((p) => {
      const finished = p.intake?.status && p.intake.status !== "not_started" ? p.intake : null;
      const intakeHistory = finished
        ? [{ ...finished, archivedOn: new Date().toISOString() }, ...(p.intakeHistory || [])]
        : p.intakeHistory || [];
      return {
        ...p,
        intakeHistory,
        intake: {
          messages: [],
          caseSheet: null,
          currentSection: 1,
          status: "not_started",
          doctorNote: "",
        },
      };
    });
  }

  function addFile(file) {
    updatePatientRecord((p) => ({ ...p, files: [file, ...p.files] }));
  }
  function deleteFile(fileId) {
    updatePatientRecord((p) => ({ ...p, files: p.files.filter((f) => f.id !== fileId) }));
    toast("Document removed");
  }
  function addHistory(entry) {
    updatePatientRecord((p) => ({ ...p, history: [entry, ...p.history] }));
    toast.success("Added to history");
  }
  function deleteHistory(entryId) {
    updatePatientRecord((p) => ({ ...p, history: p.history.filter((h) => h.id !== entryId) }));
    toast("Entry removed");
  }

  // --- Continuous care: simple patient-owned reminders ------------------
  function addReminder(text) {
    if (!text?.trim()) return;
    updatePatientRecord((p) => ({
      ...p,
      reminders: [
        { id: `rem_${Date.now()}`, text: text.trim(), done: false, createdAt: new Date().toISOString() },
        ...(p.reminders || []),
      ],
    }));
  }
  function toggleReminder(reminderId) {
    updatePatientRecord((p) => ({
      ...p,
      reminders: (p.reminders || []).map((r) => (r.id === reminderId ? { ...r, done: !r.done } : r)),
    }));
  }
  function deleteReminder(reminderId) {
    updatePatientRecord((p) => ({ ...p, reminders: (p.reminders || []).filter((r) => r.id !== reminderId) }));
  }

  // --- Expert consultation requests --------------------------------------
  function requestConsultation(expert) {
    updatePatientRecord((p) => ({
      ...p,
      consultations: [
        { id: `con_${Date.now()}`, expert, status: "requested", requestedAt: new Date().toISOString() },
        ...(p.consultations || []),
      ],
    }));
    toast.success(`Request sent to ${expert} — they'll reach out shortly`);
  }

  // Doctor-side: every consultation request across every patient, newest
  // first, with the requesting patient's basic details attached.
  function listConsultationRequests() {
    return listPatients()
      .flatMap((p) =>
        (p.consultations || []).map((c) => ({
          ...c,
          patientUserId: p.userId,
          patientName: p.name,
        }))
      )
      .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  }

  // Doctor-side: mark a request as contacted/closed. Works on any patient
  // record, not just the logged-in one.
  async function updateConsultationStatus(userId, consultationId, status) {
    const updated = await updateAnyPatient(userId, (record) => ({
      ...record,
      consultations: (record.consultations || []).map((c) =>
        c.id === consultationId ? { ...c, status } : c
      ),
    }));
    toast.success("Request updated");
    return updated;
  }

  // Patient-side: change preferred language any time, not just at signup.
  function updateLanguage(language) {
    updatePatientRecord((p) => ({ ...p, language }));
  }

  // Doctor-side lookup: tries the server first (so a patient who signed up
  // on a completely different device/browser is still found), and falls
  // back to whatever's cached on this device if the server's unreachable.
  async function fetchPatientById(userId) {
    const id = userId.trim().toUpperCase();
    try {
      const remote = await apiGetPatient(id);
      savePatient(remote);
      if (patient?.userId === id) setPatient(remote);
      return remote;
    } catch (err) {
      console.warn("Could not reach the server — checking the local cache on this device:", err?.message);
      return getPatient(id);
    }
  }

  const value = useMemo(
    () => ({
      session,
      patient,
      isPatient: session?.type === "patient",
      isDoctor: session?.type === "doctor",
      signup,
      login,
      unlockDoctor,
      logout,
      addFile,
      deleteFile,
      addHistory,
      deleteHistory,
      addReminder,
      toggleReminder,
      deleteReminder,
      requestConsultation,
      listConsultationRequests,
      updateConsultationStatus,
      updateLanguage,
      fetchPatientById,
      listPatients,
      refreshPatient,
      saveIntakeProgress,
      submitIntakeToDoctor,
      startNewIntake,
      sendIntakeBack,
      approveIntake,
    }),
    [session, patient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
