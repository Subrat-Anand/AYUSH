import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Stethoscope } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAuth } from "../context/AuthContext";

export default function DoctorDashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen">
      <div className="bg-leaf-dark text-white px-8 py-4 flex items-center justify-between">
        <Brandmark light />
        <div className="flex items-center gap-5">
          <span className="chip bg-white/10 text-[#F3ECD9]">
            <Stethoscope size={13} /> Doctor view
          </span>
          <div className="flex items-center gap-2 cursor-pointer text-[#CFE0D6] text-sm" onClick={handleLogout}>
            <LogOut size={15} /> Log out
          </div>
        </div>
      </div>

      <div className="px-6 md:px-11 py-8">
        <div className="flex items-center gap-3 mb-6 border-b-[1.5px] border-line">
          {[
            { to: "/doctor", label: "All patients", end: true },
            { to: "/doctor/lookup", label: "Patient lookup" },
            { to: "/doctor/requests", label: "Consultation requests" },
          ].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `bg-none border-none pb-3 mr-5 text-[15px] font-semibold cursor-pointer -mb-px border-b-2 ${
                  isActive ? "text-leaf border-leaf" : "text-[#9AA69D] border-transparent"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}
