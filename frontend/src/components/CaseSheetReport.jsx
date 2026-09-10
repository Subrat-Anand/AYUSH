import React from "react";
import { Building2, ClipboardList, AlertTriangle, BrainCircuit, FlaskConical, MessagesSquare, User } from "lucide-react";

/**
 * Renders an AI-generated patient case sheet exactly in the "AI Generated
 * Patient Summary — For Doctor Review" layout: header, patient info strip,
 * a two-column clinical body (Clinical Summary | Red Flags / Differential /
 * Investigations), and a Conversation Summary footer.
 *
 * `data` is whatever /api/case-summary (or the local demo fallback) returns.
 *
 * Every spacing/font class also has a print: variant so that when this is
 * printed (see .printing-target in index.css), the whole report is dense
 * enough to fit on a single A4 page instead of spilling across several.
 */
export default function CaseSheetReport({ data }) {
  if (!data) return null;

  const {
    reportId,
    generatedOn,
    status = "Ready for Review",
    hospital = {},
    patient = {},
    appointment = {},
    source = "AI Case-Taking",
    chiefComplaint = "",
    clinicalSummary = {},
    redFlags = [],
    differentialDiagnosis = [],
    recommendedInvestigations = [],
    conversationSummary = {},
    demo,
    demoReason,
  } = data;

  const generatedLabel = generatedOn
    ? new Date(generatedOn).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg shadow-sm max-w-[1080px] mx-auto text-[#1F2937] font-sans print:shadow-none print:border-0 print:max-w-none print:text-[11px]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 print:px-5 print:pt-3 print:pb-2">
        <div>
          <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-[15px] print:text-[13px]">
            HealthAssist AI
          </div>
          <div className="text-[11px] text-[#9CA3AF] print:text-[9px]">AI-Powered Case-Taking</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-[15px] tracking-wide text-[#111827] print:text-[13px]">
            AI GENERATED PATIENT SUMMARY
          </div>
          <div className="text-[12px] text-[#6B7280] print:text-[9.5px]">For Doctor Review</div>
        </div>
        <div className="flex items-center gap-2.5 print:gap-1.5">
          <div className="w-9 h-9 rounded-md bg-[#EFF6FF] flex items-center justify-center shrink-0 print:w-7 print:h-7">
            <Building2 size={18} className="text-[#1D4ED8]" />
          </div>
          <div>
            <div className="font-semibold text-[13.5px] leading-tight print:text-[11px]">
              {hospital.name || "City Care Hospital"}
            </div>
            <div className="text-[11.5px] text-[#6B7280] leading-tight print:text-[9px]">
              {hospital.department || "Outpatient Department"}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[#E4E7EC]" />

      {/* Meta row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-8 py-3 text-[12.5px] print:px-5 print:py-1.5 print:text-[10px]">
        <div>
          <span className="font-semibold">Report ID:</span> {reportId}
        </div>
        <div>
          <span className="font-semibold">Generated On:</span> {generatedLabel}
        </div>
        <div>
          <span className="font-semibold">Status: </span>
          <span
            className="font-semibold"
            style={{
              color: status.startsWith("Sent back")
                ? "#B45309"
                : status.startsWith("Approved")
                ? "#16A34A"
                : "#2563EB",
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Patient info strip */}
      <div className="mx-8 mb-6 border border-[#E4E7EC] rounded-lg px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 print:mx-5 print:mb-3 print:px-4 print:py-3 print:gap-4 print:grid-cols-3">
        <div className="flex items-center gap-4 print:gap-2.5">
          <div className="w-14 h-14 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0 print:w-9 print:h-9">
            <User size={26} className="text-[#2563EB] print:w-4 print:h-4" />
          </div>
          <div className="text-[13px] leading-6 print:text-[10px] print:leading-4">
            <div>
              <span className="text-[#6B7280]">Patient Name: </span>
              <span className="text-[#1D4ED8] font-semibold">{patient.name || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Age / Gender: </span>
              {patient.age ? `${patient.age} Years / ${patient.gender || "—"}` : "—"}
            </div>
            <div>
              <span className="text-[#6B7280]">Patient ID: </span>
              {patient.patientId || patient.userId || "—"}
            </div>
            <div>
              <span className="text-[#6B7280]">Contact: </span>
              {patient.contact || "—"}
            </div>
          </div>
        </div>

        <div className="text-[13px] leading-7 print:text-[10px] print:leading-4">
          <div>
            <span className="text-[#6B7280]">Appointment Date: </span>
            {appointment.date || "—"}
          </div>
          <div>
            <span className="text-[#6B7280]">Time: </span>
            {appointment.time || "—"}
          </div>
          <div>
            <span className="text-[#6B7280]">Source: </span>
            {source}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[13px] text-[#374151] font-medium mb-1 print:text-[10px] print:mb-0.5 print:gap-1">
            <ClipboardList size={15} className="print:w-3 print:h-3" /> Chief Complaint
          </div>
          <div className="text-[#DC2626] font-bold text-[17px] leading-tight print:text-[13px]">
            {chiefComplaint || "—"}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="px-8 grid grid-cols-1 lg:grid-cols-2 gap-6 print:px-5 print:gap-4 print:grid-cols-2">
        {/* Left: Clinical summary */}
        <div className="border border-[#E4E7EC] rounded-lg p-6 print:p-4">
          <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-[14.5px] mb-4 print:text-[11.5px] print:mb-2 print:gap-1.5">
            <ClipboardList size={17} className="print:w-3.5 print:h-3.5" /> CLINICAL SUMMARY
          </div>

          <Section n={1} title="Chief Complaint">
            <p>{clinicalSummary.chiefComplaintText || chiefComplaint}</p>
          </Section>
          <Section n={2} title="History of Present Illness">
            {(clinicalSummary.historyOfPresentIllness || []).map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </Section>
          <Section n={3} title="Past Medical History">
            <BulletList items={clinicalSummary.pastMedicalHistory} />
          </Section>
          <Section n={4} title="Medication History">
            <BulletList items={clinicalSummary.medicationHistory} />
          </Section>
          <Section n={5} title="Allergy History">
            <BulletList items={clinicalSummary.allergyHistory} />
          </Section>
          <Section n={6} title="Family History">
            <BulletList items={clinicalSummary.familyHistory} />
          </Section>
          <Section n={7} title="Personal History">
            <BulletList items={clinicalSummary.personalHistory} />
          </Section>
          <Section n={8} title="Review of Systems" last>
            {(clinicalSummary.reviewOfSystems || []).map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </Section>
        </div>

        {/* Right: AI cards */}
        <div className="flex flex-col gap-6 print:gap-3">
          <div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-lg p-5 print:p-3">
            <div className="flex items-center gap-2 text-[#B91C1C] font-bold text-[14px] mb-3 print:text-[11px] print:mb-1.5 print:gap-1.5">
              <AlertTriangle size={17} className="print:w-3.5 print:h-3.5" /> RED FLAGS IDENTIFIED
            </div>
            <ul className="text-[13px] text-[#374151] space-y-1.5 mb-3 print:text-[10px] print:space-y-1 print:mb-1.5">
              {redFlags.length === 0 ? (
                <li className="text-[#6B7280]">Not auto-flagged — doctor to assess from the history below.</li>
              ) : (
                redFlags.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#B91C1C]">•</span> {f}
                  </li>
                ))
              )}
            </ul>
            <div className="text-[#B91C1C] text-[12.5px] font-semibold print:text-[9.5px]">
              Recommend clinical evaluation.
            </div>
          </div>

          <div className="border border-[#BFDBFE] bg-[#EFF6FF] rounded-lg p-5 print:p-3">
            <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-[14px] mb-3 print:text-[11px] print:mb-1.5 print:gap-1.5">
              <BrainCircuit size={17} className="print:w-3.5 print:h-3.5" /> AI SUGGESTED DIFFERENTIAL DIAGNOSIS
            </div>
            <ol className="text-[13px] text-[#374151] space-y-1.5 mb-3 list-decimal list-inside print:text-[10px] print:space-y-1 print:mb-1.5">
              {differentialDiagnosis.length === 0 ? (
                <li className="list-none text-[#6B7280]">Not generated for this intake — doctor to evaluate directly.</li>
              ) : (
                differentialDiagnosis.map((d, i) => <li key={i}>{d}</li>)
              )}
            </ol>
            <div className="text-[#1D4ED8] text-[12px] font-medium print:text-[9.5px]">
              AI suggestion only. Doctor to evaluate.
            </div>
          </div>

          <div className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-lg p-5 print:p-3">
            <div className="flex items-center gap-2 text-[#15803D] font-bold text-[14px] mb-3 print:text-[11px] print:mb-1.5 print:gap-1.5">
              <FlaskConical size={17} className="print:w-3.5 print:h-3.5" /> AI RECOMMENDED INVESTIGATIONS
            </div>
            <ul className="text-[13px] text-[#374151] space-y-1.5 mb-3 print:text-[10px] print:space-y-1 print:mb-1.5">
              {recommendedInvestigations.map((inv, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#15803D]">•</span> {inv}
                </li>
              ))}
            </ul>
            <div className="text-[#15803D] text-[12px] font-medium print:text-[9.5px]">
              AI suggestion only. Doctor to evaluate.
            </div>
          </div>
        </div>
      </div>

      {/* Conversation summary footer */}
      <div className="mx-8 mt-6 border border-[#E9D5FF] bg-[#FAF5FF] rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-4 print:mx-5 print:mt-3 print:p-3 print:gap-3 print:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-[#7E22CE] font-bold text-[13.5px] mb-2 print:text-[10.5px] print:mb-1 print:gap-1.5">
            <MessagesSquare size={16} className="print:w-3.5 print:h-3.5" /> CONVERSATION SUMMARY
          </div>
          <div className="text-[13px] leading-6 print:text-[10px] print:leading-4">
            <div>
              <span className="font-semibold">Total Questions Asked by AI:</span>{" "}
              {conversationSummary.totalQuestions ?? 0}
            </div>
            <div>
              <span className="font-semibold">Total Patient Responses:</span>{" "}
              {conversationSummary.totalResponses ?? 0}
            </div>
            {conversationSummary.durationText && (
              <div>
                <span className="font-semibold">Duration of Conversation:</span> {conversationSummary.durationText}
              </div>
            )}
          </div>
        </div>
        <div className="text-[12.5px] text-[#6B7280] md:border-l md:border-[#E9D5FF] md:pl-4 print:text-[9.5px] print:pl-3">
          <span className="font-semibold text-[#374151]">Note:</span> This summary is generated by AI based on
          patient conversation. Please review before making clinical decisions.
          {demo && (
            <div className="mt-1 text-[#B45309]">
              Demo data — {demoReason || "connect GEMINI_API_KEY in backend/.env for live AI output."}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-8 py-4 mt-4 border-t border-[#E4E7EC] text-[11.5px] text-[#9CA3AF] print:px-5 print:py-2 print:mt-2 print:text-[8.5px]">
        <div>
          Generated by <span className="text-[#1D4ED8] font-medium">HealthAssist AI</span>
        </div>
        <div>This is not a medical advice. For clinical use by authorized doctors only.</div>
        <div>Page 1 of 1</div>
      </div>
    </div>
  );
}

function Section({ n, title, children, last }) {
  return (
    <div
      className={`text-[13px] text-[#374151] print:text-[10px] ${
        last ? "" : "pb-3 mb-3 border-b border-[#F1F1EF] print:pb-1.5 print:mb-1.5"
      }`}
    >
      <div className="font-semibold text-[#1F2937] mb-1 print:mb-0.5">
        {n}. {title}
      </div>
      <div className="space-y-0.5 print:space-y-0">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) return <p>—</p>;
  return (
    <ul className="space-y-0.5 print:space-y-0">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 print:gap-1">
          <span>•</span> {it}
        </li>
      ))}
    </ul>
  );
}
