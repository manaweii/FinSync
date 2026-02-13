import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Profile from "./components/Profile";
import RequireAuth from "./components/RequireAuth";
import NewPassword from "./components/NewPassword";
import useAuthStore from "./store/useAuthStore";

function App() {
  const { isLoggedIn, role } = useAuthStore();

  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} role={role} />

      <Routes>
        {/* Public auth routes */}
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/ResetPassword" element={<ResetPasswordPage />} />
        <Route path="/NewPassword" element={<NewPassword />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />


        {/* App pages */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin */}
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

        {/* Organization */}
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
