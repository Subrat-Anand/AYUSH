import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle, KeyRound, Loader2, Plus } from "lucide-react";
import Brandmark from "../components/Brandmark";
import { useAuth } from "../context/AuthContext";
import { LANGUAGES } from "../lib/constants";

export default function PatientAuthPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ userId: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", age: "", dob: "", gender: "", password: "", language: "English" });

  async function handleLogin() {
    setError("");
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      await login(loginForm);
      navigate("/patient/dashboard");
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup() {
    setError("");
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const result = await signup(signupForm);
      navigate("/patient/signup-success", { state: result });
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="bg-leaf text-parchment px-8 md:px-[52px] py-12 flex flex-col">
        <div className="cursor-pointer w-fit" onClick={() => navigate("/")}>
          <Brandmark light />
        </div>
        <div className="mt-auto">
          <h2 className="font-serif text-[32px] max-w-[380px] leading-tight">
            {mode === "signup" ? "A record built around you." : "Welcome back."}
          </h2>
          <p className="mt-3.5 text-[#D9E6DE] max-w-[360px] text-[15px] leading-relaxed">
            {mode === "signup"
              ? "We'll assign you a User ID and password once you've told us the basics — save them somewhere safe."
              : "Sign in with the User ID and password you were given when you registered."}
          </p>
        </div>
      </div>

      <div className="px-8 md:px-14 py-12 flex flex-col justify-center">
        <div className="max-w-[380px] w-full mx-auto">
          <div className="flex gap-6 border-b-[1.5px] border-line mb-7">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`bg-none border-none pb-3 text-[15px] font-semibold cursor-pointer -mb-px border-b-2 ${
                  mode === m ? "text-leaf border-leaf" : "text-[#9AA69D] border-transparent"
                }`}
              >
                {m === "login" ? "Sign in" : "Create record"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <div className="flex flex-col gap-5">
              <div>
                <label className="a-label">User ID</label>
                <input
                  className="a-input"
                  placeholder="AYU-XXXXX"
                  value={loginForm.userId}
                  onChange={(e) => setLoginForm({ ...loginForm, userId: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="a-label">Password</label>
                <input
                  className="a-input"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-coral text-[13.5px]">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <button className="btn btn-primary mt-1.5" onClick={handleLogin} disabled={busy}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Sign in
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <label className="a-label">Full name</label>
                <input
                  className="a-input"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="a-label">Age</label>
                  <input
                    className="a-input"
                    type="number"
                    min="0"
                    max="120"
                    value={signupForm.age}
                    onChange={(e) => setSignupForm({ ...signupForm, age: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="a-label">Gender</label>
                  <select
                    className="a-select"
                    value={signupForm.gender}
                    onChange={(e) => setSignupForm({ ...signupForm, gender: e.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="a-label">Preferred language</label>
                <select
                  className="a-select"
                  value={signupForm.language}
                  onChange={(e) => setSignupForm({ ...signupForm, language: e.target.value })}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="a-label">Date of birth</label>
                <input
                  className="a-input"
                  type="date"
                  value={signupForm.dob}
                  onChange={(e) => setSignupForm({ ...signupForm, dob: e.target.value })}
                />
              </div>
              <div>
                <label className="a-label">Password (optional — we'll generate one if left blank)</label>
                <input
                  className="a-input"
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-coral text-[13.5px]">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <button className="btn btn-primary mt-1.5" onClick={handleSignup} disabled={busy}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create my record
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
