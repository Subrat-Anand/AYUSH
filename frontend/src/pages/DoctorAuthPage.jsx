import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle, Stethoscope } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAuth } from "../context/AuthContext";
import { DOCTOR_CODE } from "../lib/constants";

export default function DoctorAuthPage() {
  const navigate = useNavigate();
  const { unlockDoctor } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleUnlock() {
    try {
      unlockDoctor(code);
      navigate("/doctor");
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="a-card max-w-[400px] w-full p-10">
        <div className="cursor-pointer w-fit" onClick={() => navigate("/")}>
          <Brandmark />
        </div>
        <h2 className="font-serif text-[23px] mt-[22px]">Doctor access</h2>
        <p className="text-[13.5px] text-muted mt-1.5 leading-relaxed">
          Enter the practice access code to look up patient records shared with you.
        </p>
        <div className="flex flex-col gap-4 mt-5">
          <div>
            <label className="a-label">Access code</label>
            <input
              className="a-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder={DOCTOR_CODE}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-coral text-[13.5px]">
              <AlertCircle size={15} /> {error}
            </div>
          )}
          <button className="btn btn-accent" onClick={handleUnlock}>
            <Stethoscope size={16} /> Enter
          </button>
          <p className="text-xs text-faint">
            Demo code: <strong>{DOCTOR_CODE}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
