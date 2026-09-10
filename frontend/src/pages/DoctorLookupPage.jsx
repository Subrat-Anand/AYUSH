import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertCircle,
  KeyRound,
  Search,
  Loader2,
  Undo2,
  MessageSquareWarning,
  CheckCircle2,
  ShieldCheck,
  History,
  ChevronDown,
  ChevronUp,
  Languages,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { bodyPartMeta, formatWhen, intakeToCaseSheetReport } from "../lib/constants";
import { onPatientsChanged, getPatient } from "../lib/storage";
import CaseSheetReport from "../components/CaseSheetReport";

export default function DoctorLookupPage() {
  const { fetchPatientById, sendIntakeBack, approveIntake } = useAuth();
  const { state } = useLocation();
  const [searchId, setSearchId] = useState(state?.userId || "");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [sendingBack, setSendingBack] = useState(false);
  const [approving, setApproving] = useState(false);
  const [expandedPast, setExpandedPast] = useState(null);
  const currentPrintRef = useRef(null);
  const pastPrintRefs = useRef({});

  // Prints (or "Save as PDF"s, via the browser's print dialog) just one
  // case sheet card, using the .printing-target print CSS in index.css —
  // no extra PDF library needed, so this can never fail the demo build.
  function downloadAsPdf(el) {
    if (!el) return;
    el.classList.add("printing-target");
    const cleanup = () => {
      el.classList.remove("printing-target");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  async function handleSendBack() {
    if (!selected) return;
    setSendingBack(true);
    try {
      const updated = await sendIntakeBack(selected.userId, reviewNote.trim());
      setReviewNote("");
      if (updated) setSelected(updated);
    } finally {
      setSendingBack(false);
    }
  }

  async function handleApprove() {
    if (!selected) return;
    if (!window.confirm(`Approve this case sheet for ${selected.name}? This marks it as reviewed.`)) {
      return;
    }
    setApproving(true);
    try {
      const updated = await approveIntake(selected.userId, reviewNote.trim());
      setReviewNote("");
      if (updated) setSelected(updated);
    } finally {
      setApproving(false);
    }
  }

  async function handleSearch() {
    setError("");
    if (!searchId.trim()) {
      setError("Enter a User ID to search.");
      return;
    }
    const found = await fetchPatientById(searchId);
    if (!found) {
      setError("No patient found with that User ID.");
      setSelected(null);
      return;
    }
    setSelected(found);
  }

  useEffect(() => {
    if (state?.userId) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.userId]);

  // Live refresh: if the patient currently open updates their record from
  // another tab (e.g. finishes or restarts their AI intake), reflect it
  // here immediately — no need to re-search manually.
  useEffect(() => {
    return onPatientsChanged(() => {
      setSelected((prev) => (prev ? getPatient(prev.userId) || prev : prev));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-end gap-3 mb-6 max-w-[420px]">
        <div className="flex-1">
          <label className="a-label">Patient User ID</label>
          <input
            className="a-input"
            placeholder="AYU-XXXXX"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button className="btn btn-primary mb-0.5" onClick={handleSearch}>
          <Search size={15} /> Look up
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-coral text-[13.5px] mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-6">
          <div className="a-card flex items-center gap-6 p-5">
            <div>
              <div className="font-serif text-[22px]">{selected.name}</div>
              <div className="text-[13px] text-muted mt-1">
                {selected.age} yrs · {selected.gender || "Not specified"} · DOB {selected.dob}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {selected.language && (
                <span className="chip">
                  <Languages size={12} /> {selected.language}
                </span>
              )}
              <span className="chip">
                <KeyRound size={12} /> {selected.userId}
              </span>
            </div>
          </div>

          <div>
            <div className="a-label mb-2.5 text-[13.5px]">Medical history</div>
            {selected.history.length === 0 ? (
              <div className="a-card p-5 text-[13.5px] text-faint">No history on file.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {selected.history.map((h) => (
                  <div key={h.id} className="a-card p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[14.5px]">{h.condition}</span>
                      <span className="text-xs text-faint">{formatWhen(h.date)}</span>
                    </div>
                    {h.notes && <div className="text-[13px] text-muted mt-1">{h.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="a-label mb-2.5 text-[13.5px]">Uploaded documents</div>
            {selected.files.length === 0 ? (
              <div className="a-card p-5 text-[13.5px] text-faint">No documents on file.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {selected.files.map((f) => {
                  const meta = bodyPartMeta(f.bodyPart);
                  const href = f.url || f.preview || null;
                  return (
                    <div key={f.id} className="a-card flex items-center gap-3 p-3.5">
                      {f.preview ? (
                        <img src={f.preview} alt={f.name} className="w-9 h-9 object-cover rounded" />
                      ) : (
                        <span className="bg-sage w-9 h-9 rounded flex items-center justify-center">
                          <meta.icon size={16} color="#1F5C4A" />
                        </span>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline text-leaf">
                              {f.name}
                            </a>
                          ) : (
                            f.name
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="chip">
                            <meta.icon size={11} /> {meta.label}
                          </span>
                          {f.local && (
                            <span
                              className="text-[11px] text-coral"
                              title="Cloudinary isn't configured yet — this file may only exist on the patient's own device."
                            >
                              Local only
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11.5px] text-faint">{formatWhen(f.uploadedAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected.intake?.status && selected.intake.status !== "not_started" && (
            <div>
              <div className="a-label mb-2.5 text-[13.5px]">Patient-completed AI intake</div>
              <div className="overflow-x-auto mb-4" ref={currentPrintRef}>
                <CaseSheetReport
                  data={intakeToCaseSheetReport({
                    intake: selected.intake,
                    patient: {
                      name: selected.name,
                      age: selected.age,
                      gender: selected.gender,
                      patientId: selected.userId,
                    },
                  })}
                />
              </div>
              {selected.intake.status === "needs_more_info" ? (
                <div className="a-card flex items-center gap-2.5 p-4 text-[13.5px] text-[#B45309] border border-[#FDE68A] bg-[#FFFBEB]">
                  <MessageSquareWarning size={16} />
                  Waiting on the patient — sent back{selected.intake.doctorNote ? `: "${selected.intake.doctorNote}"` : "."}
                </div>
              ) : selected.intake.status === "approved" ? (
                <div className="flex flex-col gap-3">
                  <div className="a-card flex items-start gap-2.5 p-4 text-[13.5px] text-[#166534] border border-[#BBF7D0] bg-[#F0FDF4]">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">
                        Approved{selected.intake.approvedOn ? ` on ${formatWhen(selected.intake.approvedOn)}` : ""}
                      </div>
                      {selected.intake.doctorNote && (
                        <div className="text-[#166534]/80 mt-0.5">"{selected.intake.doctorNote}"</div>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-outline self-start"
                    onClick={() => downloadAsPdf(currentPrintRef.current)}
                  >
                    <Download size={14} /> Download as PDF
                  </button>
                </div>
              ) : selected.intake.status === "sent" ? (
                <div className="a-card flex flex-col gap-3.5 p-5">
                  <div>
                    <label className="a-label">Doctor's note (optional)</label>
                    <input
                      className="a-input"
                      placeholder="e.g. Please clarify how long the swelling has lasted, or a diagnosis/plan if approving"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApprove()}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button className="btn btn-primary" onClick={handleApprove} disabled={approving || sendingBack}>
                      {approving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                      Approve case sheet
                    </button>
                    <button className="btn btn-outline" onClick={handleSendBack} disabled={approving || sendingBack}>
                      <Undo2 size={15} /> Send back — need more info
                    </button>
                  </div>
                </div>
              ) : (
                <div className="a-card p-5 text-[13.5px] text-faint">Patient is still completing the intake chat.</div>
              )}
            </div>
          )}

          {(!selected.intake?.status || selected.intake.status === "not_started") && (
            <div className="a-card p-5 text-[13.5px] text-faint">
              This patient hasn't completed the AI Case-Taking chat yet — the case sheet will appear here once they have.
            </div>
          )}

          {selected.intakeHistory?.length > 0 && (
            <div>
              <div className="a-label mb-2.5 text-[13.5px] flex items-center gap-1.5">
                <History size={13} /> Previous cases ({selected.intakeHistory.length})
              </div>
              <div className="flex flex-col gap-2.5">
                {selected.intakeHistory.map((past, i) => {
                  const isOpen = expandedPast === i;
                  const label = (past.caseSheet?.chief_complaint || "Untitled visit").trim();
                  return (
                    <div key={i} className="a-card overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between gap-3 p-4 text-left"
                        onClick={() => setExpandedPast(isOpen ? null : i)}
                      >
                        <div>
                          <div className="font-medium text-[14px]">{label}</div>
                          <div className="text-[12px] text-faint mt-0.5">
                            Archived {formatWhen(past.archivedOn)}
                            {past.status === "approved" ? " · Approved" : past.status === "sent" ? " · Was ready for review" : ""}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="border-t border-line p-4">
                          <div
                            className="overflow-x-auto mb-3"
                            ref={(el) => (pastPrintRefs.current[i] = el)}
                          >
                            <CaseSheetReport
                              data={intakeToCaseSheetReport({
                                intake: past,
                                patient: {
                                  name: selected.name,
                                  age: selected.age,
                                  gender: selected.gender,
                                  patientId: selected.userId,
                                },
                              })}
                            />
                          </div>
                          <button
                            className="btn btn-outline"
                            onClick={() => downloadAsPdf(pastPrintRefs.current[i])}
                          >
                            <Download size={14} /> Download as PDF
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
