import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { RequirePatient, RequireDoctor } from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import PatientAuthPage from "./pages/PatientAuthPage";
import SignupSuccessPage from "./pages/SignupSuccessPage";
import PatientDashboardLayout from "./pages/PatientDashboardLayout";
import OverviewTab from "./pages/OverviewTab";
import RecordsTab from "./pages/RecordsTab";
import ChatTab from "./pages/ChatTab";
import IntakeChat from "./pages/IntakeChat";
import ExpertConsultPage from "./pages/ExpertConsultPage";
import DoctorAuthPage from "./pages/DoctorAuthPage";
import DoctorDashboardLayout from "./pages/DoctorDashboardLayout";
import DoctorDirectoryPage from "./pages/DoctorDirectoryPage";
import DoctorLookupPage from "./pages/DoctorLookupPage";
import DoctorRequestsPage from "./pages/DoctorRequestsPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: "Inter, sans-serif", fontSize: "13.5px" },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/patient/auth" element={<PatientAuthPage />} />
        <Route path="/patient/signup-success" element={<SignupSuccessPage />} />
        <Route
          path="/patient/dashboard"
          element={
            <RequirePatient>
              <PatientDashboardLayout />
            </RequirePatient>
          }
        >
          <Route index element={<OverviewTab />} />
          <Route path="records" element={<RecordsTab />} />
          <Route path="chat" element={<ChatTab />} />
          <Route path="intake" element={<IntakeChat />} />
          <Route path="consult" element={<ExpertConsultPage />} />
        </Route>

        <Route path="/doctor/auth" element={<DoctorAuthPage />} />
        <Route
          path="/doctor"
          element={
            <RequireDoctor>
              <DoctorDashboardLayout />
            </RequireDoctor>
          }
        >
          <Route index element={<DoctorDirectoryPage />} />
          <Route path="lookup" element={<DoctorLookupPage />} />
          <Route path="requests" element={<DoctorRequestsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
