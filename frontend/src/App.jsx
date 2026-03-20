import { Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import ComplaintStatusPage from "./pages/ComplaintStatusPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MyComplaintsPage from "./pages/MyComplaintsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import PublicMapPage from "./pages/PublicMapPage";
import SignupPage from "./pages/SignupPage";
import SubmitComplaintPage from "./pages/SubmitComplaintPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/submit" element={<SubmitComplaintPage />} />
      <Route path="/complaints/:id" element={<ComplaintStatusPage />} />
      <Route path="/my-complaints" element={<MyComplaintsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/map" element={<PublicMapPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
