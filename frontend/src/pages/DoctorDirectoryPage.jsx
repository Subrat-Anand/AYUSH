import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatWhen } from "../lib/constants";
import { onPatientsChanged } from "../lib/storage";

export default function DoctorDirectoryPage() {
  const { listPatients } = useAuth();
  const navigate = useNavigate();
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDirectory(listPatients());
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return onPatientsChanged(() => setDirectory(listPatients()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[22px]">Patient sheet</h2>
        <span className="text-[13px] text-faint">
          {directory.length} patient{directory.length === 1 ? "" : "s"} registered
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-faint text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading patient sheet…
        </div>
      ) : directory.length === 0 ? (
        <div className="a-card p-6 text-[13.5px] text-faint">No patients have registered yet.</div>
      ) : (
        <div className="a-card overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-sage text-left">
                {["Name", "Age", "User ID", "History", "Files", "AI Intake", "Registered"].map((h) => (
                  <th key={h} className="py-2.5 px-4 font-semibold text-[12.5px] text-leaf-dark">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {directory.map((p) => (
                <tr
                  key={p.userId}
                  className="border-t border-line cursor-pointer hover:bg-sage/40"
                  onClick={() => navigate("/doctor/lookup", { state: { userId: p.userId } })}
                >
                  <td className="py-2.5 px-4 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4">{p.age}</td>
                  <td className="py-2.5 px-4">{p.userId}</td>
                  <td className="py-2.5 px-4">{p.history.length}</td>
                  <td className="py-2.5 px-4">{p.files.length}</td>
                  <td className="py-2.5 px-4">
                    <IntakeStatusChip status={p.intake?.status} />
                  </td>
                  <td className="py-2.5 px-4 text-faint">{formatWhen(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IntakeStatusChip({ status }) {
  const map = {
    sent: { label: "Ready for review", className: "bg-[#DCFCE7] text-[#15803D]" },
    needs_more_info: { label: "Waiting on patient", className: "bg-[#FEF3C7] text-[#B45309]" },
    in_progress: { label: "In progress", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  };
  const meta = map[status];
  if (!meta) return <span className="text-faint text-[12.5px]">—</span>;
  return <span className={`chip ${meta.className}`}>{meta.label}</span>;
}
