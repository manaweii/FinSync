import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/nav/Navbar";
import Profile from "./components/nav/Profile";
import Terms from "./components/auth/TermsConditions";

import HomePage from "./pages/LandingPage";
import ContactPage from "./pages/ContactPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionDetail from "./components/payment/SubscriptionDetail";
import RenewSubscription from "./components/payment/RenewSubscription";
import SubscriptionSuccess from "./components/payment/SubscriptionSuccess";
import SubscriptionFailure from "./components/payment/SubscriptionFailure";
import SubscriptionLogs from "./components/payment/SubscriptionLogs";

import LoginPage from "./components/auth/Login";
import RequireAuth from "./components/auth/RequireAuth";
import RequireRole from "./components/auth/RequireRole";
import NewPassword from "./components/auth/NewPassword";
import useAuthStore from "./store/useAuthStore";
import ResetPassword from "./components/auth/ResetPassword";

import UserManagement from "./components/auth/UserManagement";
import CreateUser from "./components/auth/CreateUser";
import OrganizationManagement from "./components/auth/OrganizationManagement";
import CreateOrganization from "./components/auth/CreateOrganization";
import { NotificationProvider } from "./components/nav/NotificationContext";

import DashboardPage from "./pages/DashboardPage";
import DashboardSettings from "./components/dashboard/DashboardSettings";
import RecordsPage from "./pages/RecordsPage";
import PredictionsPage from "./pages/PredictionsPage";
import ReportsPage from "./pages/ReportsPage";
import PLReport from "./components/datamanager/PLReport";
import CashFlowReport from "./components/datamanager/CashFlowReport";
import BalanceSheetReport from "./components/datamanager/BalanceSheetReport";
import FileImportPage from "./pages/FileImportPage";
import FinSyncChatbot from "./components/chat/FinSyncChatbot";
import { isSuperadminRole } from "./utils/roles";

function DashboardRoute() {
  const { role, user } = useAuthStore();

  if (isSuperadminRole(user?.role || role)) {
    return <SubscriptionLogs />;
  }

  return <DashboardPage />;
}

function App() {
  const { isLoggedIn, role } = useAuthStore();

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Navbar isLoggedIn={isLoggedIn} role={role} />

        <Routes>
          {/* Public auth routes */}
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/NewPassword" element={<NewPassword />} />

          <Route path="/terms-conditions" element={<Terms />} />

          {/* Subscription routes */}
          <Route path="/subscription-detail" element={<SubscriptionDetail />} />
          <Route
            path="/renew-subscription"
            element={
              <RequireAuth>
                <RenewSubscription />
              </RequireAuth>
            }
          />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/subscription-failure" element={<SubscriptionFailure />} />
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
                <DashboardRoute />
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

          <Route
            path="/predictions"
            element={
              <RequireAuth>
                <PredictionsPage />
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
                <RequireRole allowedRoles={["admin"]}>
                  <UserManagement />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/create-user"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["admin"]}>
                  <CreateUser />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Organization */}
          <Route
            path="/organizations"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["superadmin"]}>
                  <OrganizationManagement />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/create-organization"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["superadmin"]}>
                  <CreateOrganization />
                </RequireRole>
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

        {isLoggedIn ? <FinSyncChatbot /> : null}
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
