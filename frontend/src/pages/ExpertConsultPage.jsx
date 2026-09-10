import React from "react";
import { Stethoscope, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EXPERTS = [
  { name: "Dr. Ananya Rao", specialty: "Ayurveda — General Wellness", experience: "12 yrs experience" },
  { name: "Dr. Imran Sheikh", specialty: "Unani Medicine", experience: "9 yrs experience" },
  { name: "Dr. Kavitha Nair", specialty: "Yoga & Naturopathy", experience: "15 yrs experience" },
  { name: "Dr. S. Meenakshi", specialty: "Siddha Medicine", experience: "7 yrs experience" },
  { name: "Dr. Rohan Kulkarni", specialty: "Homeopathy — Chronic Care", experience: "11 yrs experience" },
];

export default function ExpertConsultPage() {
  const { patient, requestConsultation } = useAuth();
  const consultations = patient.consultations || [];

  function statusFor(name) {
    return consultations.find((c) => c.expert === name);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13.5px] text-muted max-w-[560px] -mt-2">
        If Ayush's guidance isn't enough, connect directly with an AYUSH practitioner. Your shared
        history and latest case sheet go with the request, so you won't have to repeat yourself.
      </p>

      <div className="flex flex-col gap-3.5">
        {EXPERTS.map((e) => {
          const req = statusFor(e.name);
          return (
            <div key={e.name} className="a-card flex flex-col sm:flex-row sm:items-center gap-3.5 p-5">
              <span className="bg-sage w-11 h-11 rounded flex items-center justify-center shrink-0">
                <Stethoscope size={19} color="#1F5C4A" />
              </span>
              <div className="flex-1">
                <div className="font-semibold text-[15px]">{e.name}</div>
                <div className="text-[13px] text-muted mt-0.5">
                  {e.specialty} · {e.experience}
                </div>
              </div>
              {req ? (
                req.status === "contacted" ? (
                  <span className="chip bg-[#DCFCE7] text-[#15803D] shrink-0">
                    <CheckCircle2 size={12} /> Doctor will reach out to you
                  </span>
                ) : (
                  <span className="chip bg-[#FEF3C7] text-[#B45309] shrink-0">
                    <Clock3 size={12} /> Requested {new Date(req.requestedAt).toLocaleDateString()} — awaiting doctor
                  </span>
                )
              ) : (
                <button
                  className="btn btn-outline shrink-0"
                  onClick={() => requestConsultation(e.name)}
                >
                  <CalendarClock size={14} /> Request consultation
                </button>
              )}
            </div>
          );
        })}
      </div>

      {consultations.length > 0 && (
        <div className="a-card p-5">
          <div className="a-label mb-3 flex items-center gap-1.5">
            <Clock3 size={13} /> Your requests
          </div>
          <div className="flex flex-col gap-2">
            {consultations.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-[13.5px]">
                <span>{c.expert}</span>
                <span className={c.status === "contacted" ? "text-[#15803D]" : "text-faint"}>
                  {c.status === "contacted" ? "Doctor reached out" : `Requested ${new Date(c.requestedAt).toLocaleDateString()}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
