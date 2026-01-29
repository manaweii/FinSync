import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/LandingPage";
import LoginPage from "./components/Login";
import ResetPasswordPage from "./components/ResetPassword";
import PricingPage from "./components/PricingPage";
import DashboardPage from "./components/DashboardPage";
import ContactPage from "./components/ContactPage";
import ReportsPage from "./components/ReportsPage";
import FileImportPage from "./components/FileImportPage";
import UserManagement from "./components/UserManagement";
import CreateUser from "./components/CreateUser";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/ResetPassword" element={<ResetPasswordPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* App pages */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin */}
        <Route path="/users" element={<UserManagement />} />
        <Route path="/create-user" element={<CreateUser />} />

        {/* Convenience routes that map to dashboard for now */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/import" element={<FileImportPage />} />

        {/* Home */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
