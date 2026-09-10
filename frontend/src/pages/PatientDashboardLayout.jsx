import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, FileText, MessageCircle, LogOut, Stethoscope, HeartHandshake, Languages } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAuth } from "../context/AuthContext";
import { KeyRound } from "lucide-react";
import { LANGUAGES } from "../lib/constants";

const TABS = [
  { to: "/patient/dashboard", label: "Overview", icon: ClipboardList, end: true },
  { to: "/patient/dashboard/records", label: "Medical records", icon: FileText },
  { to: "/patient/dashboard/chat", label: "Ask Ayush", icon: MessageCircle },
  { to: "/patient/dashboard/intake", label: "AI Case-Taking", icon: Stethoscope },
  { to: "/patient/dashboard/consult", label: "Consult an Expert", icon: HeartHandshake },
];

const TITLES = {
  "/patient/dashboard": { h: (name) => `Hello, ${name}`, sub: "A quick look at your record." },
  "/patient/dashboard/records": {
    h: () => "Medical records",
    sub: "Upload documents tagged by body part, and log conditions as they come up.",
  },
  "/patient/dashboard/chat": {
    h: () => "Ask Ayush",
    sub: "General day-to-day guidance, aware of what you've shared below.",
  },
  "/patient/dashboard/intake": {
    h: () => "AI Case-Taking",
    sub: "A guided intake — answer a few questions and it goes straight to your doctor.",
  },
  "/patient/dashboard/consult": {
    h: () => "Consult an Expert",
    sub: "Connect with an AYUSH practitioner when you need more than general guidance.",
  },
};

export default function PatientDashboardLayout() {
  const { patient, logout, updateLanguage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);

  if (!patient) return null;

  const pathKey = TITLES[location.pathname] ? location.pathname : "/patient/dashboard";
  const title = TITLES[pathKey];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[230px_1fr]">
      <div className="bg-leaf-dark flex flex-col">
        <div className="px-5 py-[22px]">
          <Brandmark light />
        </div>
        <div className="mt-2 flex-1">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <t.icon size={16} /> {t.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-link mb-3" onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </div>
      </div>

      <div className="px-6 md:px-11 py-8">
        <div className="flex items-center justify-between mb-[30px]">
          <div>
            <h1 className="font-serif text-[27px]">{title.h(patient.name.split(" ")[0])}</h1>
            <p className="text-[13.5px] text-muted mt-0.5">{title.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip">
              <KeyRound size={13} /> {patient.userId}
            </span>
            <div className="relative">
              <button
                className="chip cursor-pointer"
                onClick={() => setLangOpen((v) => !v)}
                title="Change preferred language"
              >
                <Languages size={13} /> {patient.language || "English"}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 bg-white border border-line rounded-md shadow-lg z-10 py-1.5 max-h-[220px] overflow-y-auto w-[160px]">
                  {LANGUAGES.map((l) => (
                    <div
                      key={l}
                      className={`px-3.5 py-1.5 text-[13.5px] cursor-pointer hover:bg-sage ${
                        l === patient.language ? "font-semibold text-leaf" : ""
                      }`}
                      onClick={() => {
                        updateLanguage(l);
                        setLangOpen(false);
                      }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
