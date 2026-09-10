import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, Loader2, Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { onPatientsChanged } from "../lib/storage";

export default function DoctorRequestsPage() {
  const { listConsultationRequests, updateConsultationStatus } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setRequests(listConsultationRequests());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    return onPatientsChanged(refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-faint text-[13.5px] py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading requests…
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="a-card p-6 text-[13.5px] text-faint">
        No consultation requests yet — they'll show up here as soon as a patient asks to connect with an
        expert.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {requests.map((r) => (
        <div key={r.id} className="a-card flex flex-col sm:flex-row sm:items-center gap-3.5 p-5">
          <span className="bg-sage w-11 h-11 rounded flex items-center justify-center shrink-0">
            <Stethoscope size={19} color="#1F5C4A" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px]">{r.patientName}</div>
            <div className="text-[13px] text-muted mt-0.5">
              Requested <span className="font-medium">{r.expert}</span> · {new Date(r.requestedAt).toLocaleString()}
            </div>
          </div>
          <button
            className="chip shrink-0 cursor-pointer"
            onClick={() => navigate("/doctor/lookup", { state: { userId: r.patientUserId } })}
          >
            View patient
          </button>
          {r.status === "contacted" ? (
            <span className="chip bg-[#DCFCE7] text-[#15803D] shrink-0">
              <CheckCircle2 size={12} /> Contacted
            </span>
          ) : (
            <button
              className="btn btn-outline shrink-0"
              onClick={() => updateConsultationStatus(r.patientUserId, r.id, "contacted")}
            >
              <CalendarClock size={14} /> Mark contacted
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
