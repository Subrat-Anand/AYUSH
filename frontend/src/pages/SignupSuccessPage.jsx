import React from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";

export default function SignupSuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.userId) return <Navigate to="/patient/auth" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="a-card max-w-[440px] w-full p-10">
        <div className="w-11 h-11 rounded-full bg-sage flex items-center justify-center">
          <CheckCircle2 size={22} color="#1F5C4A" />
        </div>
        <h2 className="font-serif text-2xl mt-4.5 mt-[18px]">
          You're all set, {state.name.split(" ")[0]}.
        </h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Here's your login for next time. We won't show this password again, so save it
          somewhere safe.
        </p>
        <div className="mt-[22px] flex flex-col gap-3.5">
          <div className="border-b border-line pb-2.5">
            <div className="a-label">User ID</div>
            <div className="font-serif text-xl tracking-wide">{state.userId}</div>
          </div>
          <div>
            <div className="a-label">Password</div>
            <div className="font-serif text-xl tracking-wide">{state.password}</div>
          </div>
        </div>
        <button
          className="btn btn-primary w-full mt-7"
          onClick={() => navigate("/patient/dashboard")}
        >
          Continue to my record <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
