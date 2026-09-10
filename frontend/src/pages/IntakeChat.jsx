import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Send, ClipboardCheck, CheckCircle2, MessageSquareWarning, RotateCcw, Mic, Paperclip, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendIntakeTurn } from "../lib/intakeService";
import { EMPTY_INTAKE_CASE_SHEET, INTAKE_SECTION_NAMES } from "../lib/constants";

const SpeechRecognitionAPI =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function IntakeChat() {
  const { patient, saveIntakeProgress, submitIntakeToDoctor, startNewIntake } = useAuth();
  const intake = patient?.intake;

  const [messages, setMessages] = useState(() => intake?.messages || []);
  const [caseSheet, setCaseSheet] = useState(() => ({ ...EMPTY_INTAKE_CASE_SHEET, ...(intake?.caseSheet || {}) }));
  const [currentSection, setCurrentSection] = useState(() => intake?.currentSection || 1);
  const [status, setStatus] = useState(() => intake?.status || "not_started");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const startedRef = useRef(false);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const complete = status === "sent";
  const doctorNote = status === "needs_more_info" ? intake?.doctorNote || "" : "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function kickOff({ freshCaseSheet, freshSection, freshDoctorNote } = {}) {
    setBusy(true);
    try {
      const data = await sendIntakeTurn({
        message: "",
        history: [],
        caseSheet: freshCaseSheet ?? caseSheet,
        currentSection: freshSection ?? currentSection,
        patientContext: patientContext(),
        doctorNote: freshDoctorNote ?? doctorNote,
      });
      applyTurn([], data);
    } catch {
      toast.error("Ayush couldn't start the intake just now.");
    } finally {
      setBusy(false);
    }
  }

  // Kick off (or resume) the intake on first load.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (messages.length > 0) return; // already have a transcript, nothing to kick off

    if (status === "sent") return; // finished, nothing to ask

    kickOff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStartNewCase() {
    startNewIntake();
    setMessages([]);
    setCaseSheet({ ...EMPTY_INTAKE_CASE_SHEET });
    setCurrentSection(1);
    setStatus("not_started");
    kickOff({ freshCaseSheet: { ...EMPTY_INTAKE_CASE_SHEET }, freshSection: 1, freshDoctorNote: "" });
  }

  function toggleVoiceInput() {
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input isn't supported in this browser — try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => toast.error("Couldn't catch that — try typing instead.");
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please attach an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachedImage({ name: file.name, dataUrl: reader.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function patientContext() {
    return {
      age: patient.age,
      gender: patient.gender,
      knownConditions: patient.history.map((h) => h.condition),
    };
  }

  function applyTurn(nextMessages, data) {
    const withReply = [...nextMessages, { role: "assistant", content: data.reply }];
    setMessages(withReply);
    setCaseSheet(data.case_sheet);
    setCurrentSection(data.current_section);

    if (data.intake_complete) {
      setStatus("sent");
      submitIntakeToDoctor({
        messages: withReply,
        caseSheet: data.case_sheet,
        demo: Boolean(data.demo),
        demoReason: data.demoReason || "",
      });
    } else {
      const nextStatus = status === "needs_more_info" ? "needs_more_info" : "in_progress";
      setStatus(nextStatus);
      saveIntakeProgress({
        messages: withReply,
        caseSheet: data.case_sheet,
        currentSection: data.current_section,
        status: nextStatus,
        demo: Boolean(data.demo),
        demoReason: data.demoReason || "",
      });
    }
  }

  async function handleSend() {
    const text = input.trim();
    if ((!text && !attachedImage) || busy || complete) return;
    const outgoingText = attachedImage
      ? `${text}${text ? " " : ""}[Patient attached a photo: ${attachedImage.name} — treat as a visual symptom reference for the doctor]`
      : text;
    const nextMessages = [
      ...messages,
      { role: "user", content: text || "(shared a photo)", image: attachedImage?.dataUrl },
    ];
    setMessages(nextMessages);
    setInput("");
    setAttachedImage(null);
    setBusy(true);
    try {
      const data = await sendIntakeTurn({
        message: outgoingText,
        history: nextMessages,
        caseSheet,
        currentSection,
        patientContext: patientContext(),
        doctorNote,
      });
      applyTurn(nextMessages, data);
    } catch (e) {
      toast.error("Ayush couldn't respond just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {status === "needs_more_info" && (
        <div className="a-card flex items-start gap-3 p-4 border border-[#FDE68A] bg-[#FFFBEB]">
          <MessageSquareWarning size={18} className="text-[#B45309] mt-0.5 shrink-0" />
          <div className="text-[13.5px] text-[#92400E]">
            Your doctor asked for a bit more information{doctorNote ? `: "${doctorNote}"` : "."} Just reply below.
          </div>
        </div>
      )}

      <div className="a-card p-3.5 flex items-center gap-2 flex-wrap">
        {INTAKE_SECTION_NAMES.map((name, i) => {
          const sectionNum = i + 1;
          const done = complete || sectionNum < currentSection;
          const active = !complete && sectionNum === currentSection;
          return (
            <span
              key={name}
              className={`chip ${done ? "bg-sage" : active ? "bg-leaf text-parchment" : "bg-[#F1EFE6] text-faint"}`}
            >
              {sectionNum}. {name}
            </span>
          );
        })}
      </div>

      <div className="a-card flex flex-col p-0" style={{ height: "56vh" }}>
        <div className="flex-1 scrollbar-thin overflow-y-auto p-6 flex flex-col gap-3.5">
          {messages.length === 0 && busy && (
            <div className="m-auto text-center text-faint">
              <Loader2 size={18} className="animate-spin mx-auto mb-2" />
              <p className="text-[13.5px]">Starting your intake…</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] py-2.5 px-4 rounded-[10px] text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-leaf text-parchment" : "bg-sage text-ink"
                }`}
              >
                {m.image && (
                  <img src={m.image} alt="Attached" className="max-w-[180px] rounded-md mb-2 block" />
                )}
                {m.content}
              </div>
            </div>
          ))}
          {busy && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="py-2.5 px-4 rounded-[10px] bg-sage">
                <Loader2 size={15} className="animate-spin" color="#1F5C4A" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {complete ? (
          <div className="flex items-center justify-between gap-3 border-t border-line p-4 flex-wrap">
            <div className="flex items-center gap-2.5 text-[13.5px] text-[#1F5C4A] font-medium">
              <CheckCircle2 size={17} />
              Your case sheet has been sent to your doctor for review.
            </div>
            <button className="btn btn-outline" onClick={handleStartNewCase} disabled={busy}>
              <RotateCcw size={14} /> Start new case
            </button>
          </div>
        ) : (
          <div className="border-t border-line">
            {attachedImage && (
              <div className="flex items-center gap-2.5 px-3.5 pt-3">
                <img src={attachedImage.dataUrl} alt="Preview" className="w-10 h-10 object-cover rounded" />
                <span className="text-[12.5px] text-muted flex-1 truncate">{attachedImage.name}</span>
                <button onClick={() => setAttachedImage(null)} className="text-faint hover:text-coral">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 p-3.5">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              <button
                className="btn btn-outline py-2.5 px-3"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                title="Attach a photo"
              >
                <Paperclip size={15} />
              </button>
              <button
                className={`btn py-2.5 px-3 ${listening ? "btn-primary" : "btn-outline"}`}
                onClick={toggleVoiceInput}
                disabled={busy}
                title="Speak your answer"
              >
                <Mic size={15} />
              </button>
              <input
                className="a-input border-b-0"
                placeholder={busy ? "Ayush is thinking…" : listening ? "Listening…" : "Type your answer…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={busy}
              />
              <button
                className="btn btn-primary py-2.5 px-4"
                onClick={handleSend}
                disabled={busy || (!input.trim() && !attachedImage)}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {!complete && (
        <div className="flex items-center gap-2 text-[12.5px] text-faint">
          <ClipboardCheck size={13} />
          Type, tap the mic to speak, or attach a photo — say "that's it" any time to end early.
        </div>
      )}
    </div>
  );
}
