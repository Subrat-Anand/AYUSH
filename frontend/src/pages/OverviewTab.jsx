import React, { useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Bell, Plus, Trash2, Languages } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { bodyPartMeta, formatWhen } from "../lib/constants";

// Builds a simple month-by-month activity trend from the patient's own
// files + history timestamps — real data, just visualised.
function buildActivitySeries(patient) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: "short" }), files: 0, history: 0 });
  }
  const findBucket = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
  };
  patient.files.forEach((f) => {
    const b = findBucket(f.uploadedAt);
    if (b) b.files += 1;
  });
  patient.history.forEach((h) => {
    const b = findBucket(h.date);
    if (b) b.history += 1;
  });
  return months;
}

export default function OverviewTab() {
  const { patient, addReminder, toggleReminder, deleteReminder } = useAuth();
  const series = useMemo(() => buildActivitySeries(patient), [patient]);
  const [reminderText, setReminderText] = useState("");
  const reminders = patient.reminders || [];

  function handleAddReminder() {
    if (!reminderText.trim()) return;
    addReminder(reminderText);
    setReminderText("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="a-card p-5">
          <div className="a-label">Age</div>
          <div className="font-serif text-[26px]">{patient.age}</div>
        </div>
        <div className="a-card p-5">
          <div className="a-label">History entries</div>
          <div className="font-serif text-[26px]">{patient.history.length}</div>
        </div>
        <div className="a-card p-5">
          <div className="a-label">Documents uploaded</div>
          <div className="font-serif text-[26px]">{patient.files.length}</div>
        </div>
      </div>

      <div className="a-card p-6">
        <div className="a-label mb-3">Activity, last 6 months</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="filesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1F5C4A" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1F5C4A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E7A233" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#E7A233" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDD6C4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8A9188" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8A9188" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #DDD6C4", fontSize: 13 }} />
            <Area type="monotone" dataKey="files" name="Documents" stroke="#1F5C4A" fill="url(#filesGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="history" name="History" stroke="#E7A233" fill="url(#historyGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="a-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="a-label flex items-center gap-1.5"><Bell size={13} /> Continuous care — reminders</div>
          <span className="chip"><Languages size={11} /> {patient.language || "English"}</span>
        </div>
        <div className="flex items-center gap-2.5 mb-4">
          <input
            className="a-input border-b-0 bg-[#F7F5EC] rounded-md px-3 py-2 text-[13.5px]"
            placeholder="e.g. Take evening medicine at 8pm"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddReminder()}
          />
          <button className="btn btn-outline py-2 px-3" onClick={handleAddReminder}>
            <Plus size={15} />
          </button>
        </div>
        {reminders.length === 0 ? (
          <p className="text-[13.5px] text-faint">
            No reminders yet — add a follow-up or medicine reminder to stay on track between visits.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-1.5">
                <input type="checkbox" checked={r.done} onChange={() => toggleReminder(r.id)} className="w-4 h-4 accent-[#1F5C4A]" />
                <span className={`flex-1 text-[13.5px] ${r.done ? "line-through text-faint" : ""}`}>{r.text}</span>
                <button onClick={() => deleteReminder(r.id)} className="text-faint hover:text-coral">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="a-card p-6">
        <div className="a-label mb-2.5">Recently uploaded</div>
        {patient.files.length === 0 ? (
          <p className="text-[13.5px] text-faint">
            Nothing uploaded yet — head to Medical records to add your first file.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {patient.files.slice(0, 4).map((f) => {
              const meta = bodyPartMeta(f.bodyPart);
              return (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="bg-sage w-[34px] h-[34px] rounded flex items-center justify-center shrink-0">
                    <meta.icon size={16} color="#1F5C4A" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-faint">{meta.label}</div>
                  </div>
                  <div className="text-xs text-faint">{formatWhen(f.uploadedAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
