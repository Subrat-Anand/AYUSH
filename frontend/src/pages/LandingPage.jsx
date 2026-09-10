import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Stethoscope, ChevronRight, ShieldCheck, Languages } from "lucide-react";
import Brandmark from "../components/Brandmark";

const COPY = {
  English: {
    tag: "Demo health record, for one household",
    headline: "Your records, your questions, one quiet place.",
    body: "Keep your medical files sorted by body part, log your history as it happens, and ask Ayush anything about how you're feeling today. Your doctor sees exactly what you've shared — nothing more.",
    patientTitle: "I'm a patient",
    patientSub: "Sign in or create your record",
    doctorTitle: "I'm a doctor",
    doctorSub: "Look up a patient's shared history",
    footer: "This is a demo build — data is stored for this workspace only and isn't a substitute for a real clinical record.",
  },
  Hindi: {
    tag: "डेमो हेल्थ रिकॉर्ड, एक परिवार के लिए",
    headline: "आपका रिकॉर्ड, आपके सवाल, एक ही जगह पर।",
    body: "अपनी मेडिकल फाइलें शरीर के हिस्से के अनुसार व्यवस्थित रखें, अपनी हिस्ट्री दर्ज करें, और Ayush से आज अपनी सेहत के बारे में कुछ भी पूछें। आपका डॉक्टर बस वही देखेगा जो आपने साझा किया है — उससे ज़्यादा कुछ नहीं।",
    patientTitle: "मैं एक मरीज़ हूँ",
    patientSub: "साइन इन करें या अपना रिकॉर्ड बनाएं",
    doctorTitle: "मैं एक डॉक्टर हूँ",
    doctorSub: "मरीज़ की साझा की गई हिस्ट्री देखें",
    footer: "यह एक डेमो बिल्ड है — डेटा केवल इस वर्कस्पेस के लिए संग्रहीत है और यह असली क्लिनिकल रिकॉर्ड का विकल्प नहीं है।",
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("English");
  const t = COPY[lang];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-leaf text-parchment px-8 flex items-center justify-between">
        <div className="py-[18px]">
          <Brandmark light />
        </div>
        <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
          {Object.keys(COPY).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition ${
                lang === l ? "bg-white text-leaf-dark" : "text-[#D9E6DE]"
              }`}
            >
              {l === "English" ? <Languages size={12} /> : null} {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
        <div className="bg-leaf text-[#F3ECD9] px-8 md:px-14 py-16 flex flex-col justify-center">
          <p className="chip bg-white/10 text-[#F3ECD9] w-fit">
            <ShieldCheck size={14} /> {t.tag}
          </p>
          <h1 className="font-serif text-[36px] md:text-[46px] leading-[1.12] mt-5 max-w-[480px]">
            {t.headline}
          </h1>
          <p className="mt-5 text-base text-[#D9E6DE] max-w-[420px] leading-relaxed">{t.body}</p>
        </div>

        <div className="px-8 md:px-14 py-16 flex flex-col justify-center gap-4">
          <div className="tile p-6" onClick={() => navigate("/patient/auth")}>
            <div className="flex items-center gap-3">
              <span className="bg-sage w-11 h-11 rounded flex items-center justify-center shrink-0">
                <User size={20} color="#1F5C4A" />
              </span>
              <div>
                <div className="font-semibold text-[16.5px]">{t.patientTitle}</div>
                <div className="text-[13.5px] text-muted">{t.patientSub}</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-muted" />
            </div>
          </div>

          <div className="tile p-6" onClick={() => navigate("/doctor/auth")}>
            <div className="flex items-center gap-3">
              <span className="bg-[#F4E6CB] w-11 h-11 rounded flex items-center justify-center shrink-0">
                <Stethoscope size={20} color="#9A6B15" />
              </span>
              <div>
                <div className="font-semibold text-[16.5px]">{t.doctorTitle}</div>
                <div className="text-[13.5px] text-muted">{t.doctorSub}</div>
              </div>
              <ChevronRight size={18} className="ml-auto text-muted" />
            </div>
          </div>

          <p className="text-[12.5px] text-faint mt-2">{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
