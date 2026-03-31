import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/nav/Navbar";
import Profile from "./components/nav/Profile";

import HomePage from "./components/homepage/LandingPage";
import ContactPage from "./components/homepage/ContactPage";
import PricingPage from "./components/homepage/PricingPage";
import SubscriptionDetail from "./components/payment/SubscriptionDetail";
import SubscriptionSuccess from "./components/payment/SubscriptionSuccess";
import SubscriptionLogs from "./components/payment/SubscriptionLogs";

import LoginPage from "./components/auth/Login";
import RequireAuth from "./components/auth/RequireAuth";
import NewPassword from "./components/auth/NewPassword";
import useAuthStore from "./store/useAuthStore";
import ResetPasswordPage from "./components/auth/ResetPassword";

import UserManagement from "./components/auth/UserManagement";
import CreateUser from "./components/auth/CreateUser";
import OrganizationManagement from "./components/auth/OrganizationManagement";
import CreateOrganization from "./components/auth/CreateOrganization";

import DashboardPage from "./components/dashboard/DashboardPage";
import DashboardSettings from "./components/dashboard/DashboardSettings";
import RecordsPage from "./components/data manager/RecordsPage";
import ReportsPage from "./components/data manager/ReportsPage";
import PLReport from "./components/data manager/PLReport";
import CashFlowReport from "./components/data manager/CashFlowReport";
import BalanceSheetReport from "./components/data manager/BalanceSheetReport";
import FileImportPage from "./components/data manager/FileImportPage";

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
