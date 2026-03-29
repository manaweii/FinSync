import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Profile from "./components/Profile";

import HomePage from "./components/LandingPage";
import ContactPage from "./components/ContactPage";
import PricingPage from "./components/PricingPage";
import SubscriptionDetail from "./components/SubscriptionDetail";
import SubscriptionSuccess from "./components/SubscriptionSuccess";
import SubscriptionLogs from "./components/SubscriptionLogs";

import LoginPage from "./components/Login";
import RequireAuth from "./components/RequireAuth";
import NewPassword from "./components/NewPassword";
import useAuthStore from "./store/useAuthStore";
import ResetPasswordPage from "./components/ResetPassword";

import UserManagement from "./components/UserManagement";
import CreateUser from "./components/CreateUser";
import OrganizationManagement from "./components/OrganizationManagement";
import CreateOrganization from "./components/CreateOrganization";

import DashboardPage from "./components/DashboardPage";
import DashboardSettings from "./components/DashboardSettings";
import RecordsPage from "./components/RecordsPage";
import ReportsPage from "./components/ReportsPage";
import PLReport from "./components/PLReport";
import CashFlowReport from "./components/CashFlowReport";
import BalanceSheetReport from "./components/BalanceSheetReport";
import FileImportPage from "./components/FileImportPage";

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

          {/* Subscription routes */}
        <Route path="/subscription-detail" element={<SubscriptionDetail />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/subscription-logs" element={
          <RequireAuth>
            <SubscriptionLogs />
          </RequireAuth>
        } />


        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />

        {/* Record */}
        <Route
          path="/records"
          element={
            <RequireAuth>
              <RecordsPage />
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

        {/* Dashboard Settings */}
        <Route
          path="/dashboard-settings"
          element={
            <RequireAuth>
              <DashboardSettings />
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
        >
          {/* Nested report routes */}
          <Route index element={<PLReport />} />
          <Route path="pl" element={<PLReport />} />
          <Route path="balance-sheet" element={<BalanceSheetReport />} />
          <Route path="cash-flow" element={<CashFlowReport />} />
        </Route>
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
