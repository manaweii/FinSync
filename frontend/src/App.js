import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
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
import OrganizationManagement from "./components/OrganizationManagement";
import CreateOrganization from "./components/CreateOrganization";
import RequireAuth from "./components/RequireAuth";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("user");

  // Auto-login on first load (page refresh)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    // Rule: if token exists => logged in
    if (token) setIsLoggedIn(true);

    // If user exists, try to read role
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser?.role) setRole(parsedUser.role);
      } catch {
        setRole("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setRole("user");
  };

  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} role={role} onLogout={handleLogout} />

      <Routes>
        {/* Public auth routes */}
        <Route
          path="/Login"
          element={
            <LoginPage
              onLogin={({ token, user }) => {
                // token exists => logged in
                if (token) localStorage.setItem("token", token);
                if (user) localStorage.setItem("user", JSON.stringify(user));

                setIsLoggedIn(!!token);
                setRole(user?.role || "user");
              }}
            />
          }
        />
        <Route path="/ResetPassword" element={<ResetPasswordPage />} />
        <Route path="/NewPassword" element={<NewPassword />} />


        {/* Dashboard (protected) */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />

        {/* App pages */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin (protected) */}
        <Route
          path="/users"
          element={
            <RequireAuth>
              <UserManagement />
            </RequireAuth>
          }
        />
        <Route
          path="/create-user"
          element={
            <RequireAuth>
              <CreateUser />
            </RequireAuth>
          }
        />

        {/* Organization (protected) */}
        <Route
          path="/organizations"
          element={
            <RequireAuth>
              <OrganizationManagement />
            </RequireAuth>
          }
        />
        <Route
          path="/create-organization"
          element={
            <RequireAuth>
              <CreateOrganization />
            </RequireAuth>
          }
        />

        {/* Convenience routes */}
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <ReportsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/import"
          element={
            <RequireAuth>
              <FileImportPage />
            </RequireAuth>
          }
        />

        {/* Home */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
