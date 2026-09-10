import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendChatMessage } from "../lib/chatService";

export default function ChatTab() {
  const { patient } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const reply = await sendChatMessage({
        message: text,
        history: nextMessages,
        patientContext: {
          age: patient.age,
          gender: patient.gender,
          historyCount: patient.history.length,
          conditions: patient.history.map((h) => h.condition),
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error("Ayush couldn't respond just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="a-card flex flex-col p-0" style={{ height: "62vh" }}>
      <div className="flex-1 scrollbar-thin overflow-y-auto p-6 flex flex-col gap-3.5">
        {messages.length === 0 && (
          <div className="m-auto text-center text-faint max-w-[320px]">
            <Sparkles size={22} className="mb-2 mx-auto" />
            <p className="text-[13.5px]">
              Ask about a headache, a diet question, sleep, or anything day-to-day — Ayush knows
              what you've logged so far.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] py-2.5 px-4 rounded-[10px] text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "bg-leaf text-parchment" : "bg-sage text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="py-2.5 px-4 rounded-[10px] bg-sage">
              <Loader2 size={15} className="animate-spin" color="#1F5C4A" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-3 border-t border-line p-3.5">
        <input
          className="a-input border-b-0"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="btn btn-primary py-2.5 px-4" onClick={handleSend} disabled={busy || !input.trim()}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
