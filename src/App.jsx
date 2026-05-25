import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import UploadPage from "./Pages/UploadPage";
import ViewDataPage from "./Pages/ViewDataPage";
import RegisterUser from "./Pages/RegisterUser";
import Footer from "./Components/Footer";
import SuperAdminSidebar from "./Components/SuperAdminSidebar";
import AllRegisteredUsers from "./Pages/Allusers";
import UserList from "./Pages/UserList";
import AuthPage from "./Pages/authPage";
import ProfilePage from "./Pages/ProfilePage";
import ExEmployeePage from "./Pages/ExEmployeePage";
import StudentManagement from "./Pages/StudentManagement";
import OJTManagement from "./Pages/OJTManagement";
import ActivitiesPage from "./Pages/ActivitiesPage";
import PolicyPage from "./Pages/PolicyPage";
import { useAuthStore } from "./Store/authStore";

// Smart Assets Pages
import SmartDashboard from "./Pages/SmartAssets/Dashboard";
import SmartAddAsset from "./Pages/SmartAssets/AddAsset";
import SmartEditAsset from "./Pages/SmartAssets/EditAsset";
import SmartScanner from "./Pages/SmartAssets/Scanner";
import SmartAssetDetail from "./Pages/SmartAssets/AssetDetail";
import SmartLogin from "./Pages/SmartAssets/Login";
import SmartSignup from "./Pages/SmartAssets/Signup";

import Contacts from "./Pages/Contacts";
import Accounts from "./Pages/Accounts";
import PermissionsPage from "./Pages/PermissionsPage";
import RolesPage from "./Pages/RolesPage";
import TechmireAcademy from "./Pages/TechmireAcademy";
import CourseSettings from "./Pages/CourseSettings";
import CourseView from "./Pages/CourseView";
import QuizPage from "./Pages/QuizPage";
import QuizAttempt from "./Pages/QuizAttempt";

// Layout component
const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const isAuthPage = location.pathname === "/";
  const isSmartPageWithoutSidebar = location.pathname.startsWith("/smart-assets/login") || 
                                    location.pathname.startsWith("/smart-assets/signup") || 
                                    location.pathname.startsWith("/smart-assets/scan");

  if (!user || isAuthPage || isSmartPageWithoutSidebar) {
    return <div className="flex flex-col min-h-screen"><main className="flex-grow">{children}</main></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden md:overflow-auto">
        <main className="flex-grow pt-14 md:pt-0 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
};

// ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuthStore();
  const location = useLocation();

  if (!user) return <AuthPage />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Access Denied: You do not have permission to view this page.</div>;
  }

  // Per-user page whitelist (Super Admin bypasses; null/undefined = default access)
  if (role?.toLowerCase() !== "superadmin" && Array.isArray(user?.allowedPages)) {
    if (!user.allowedPages.includes(location.pathname)) {
      return <div className="flex items-center justify-center h-screen text-gray-500">Access Denied: Super Admin has not granted you access to this page.</div>;
    }
  }

  return children;
};

// App component
const App = () => {
  const { user, role } = useAuthStore();

  return (
    <Router>
      <Layout>
        <Routes>
          {!user && (
            <>
              <Route path="/" element={<AuthPage />} />
              <Route path="/smart-assets/asset/:id" element={<SmartAssetDetail />} />
              <Route path="/smart-assets/login" element={<SmartLogin />} />
              <Route path="/smart-assets/signup" element={<SmartSignup />} />
              <Route path="*" element={<AuthPage />} />
            </>
          )}

          {user && (
            <>
              <Route path="/view" element={<ViewDataPage />} />
              <Route path="/policies" element={<PolicyPage />} />
              <Route path="/techmire-academy" element={<TechmireAcademy />} />
              <Route path="/course-settings/:course" element={<CourseSettings />} />
              <Route path="/course/:course" element={<CourseView />} />
              <Route path="/quiz/:contentId" element={<QuizPage />} />
              <Route path="/quiz/:contentId/attempt" element={<QuizAttempt />} />

              {/* Smart Assets Routes */}
              <Route path="/smart-assets/dashboard" element={<SmartDashboard />} />
              <Route path="/smart-assets/add-asset" element={<SmartAddAsset />} />
              <Route path="/smart-assets/edit-asset/:id" element={<SmartEditAsset />} />
              <Route path="/smart-assets/scan" element={<SmartScanner />} />
              <Route path="/smart-assets/asset/:id" element={<SmartAssetDetail />} />
              <Route path="/smart-assets/login" element={<SmartLogin />} />
              <Route path="/smart-assets/signup" element={<SmartSignup />} />

              {role?.toLowerCase() === "employee" && (
                <>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/" element={<AuthPage />} />
                  <Route path="*" element={<ProfilePage />} />
                </>
              )}

              {(role?.toLowerCase() === "ojt" || role?.toLowerCase() === "student") && (
                <>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/activities" element={<ActivitiesPage />} />
                  <Route path="/" element={<AuthPage />} />
                  <Route path="*" element={<ProfilePage />} />
                </>
              )}

              {role?.toLowerCase() === "hr" && (
                <>
                  <Route path="/uploadfile"    element={<ProtectedRoute allowedRoles={["hr"]}><UploadPage /></ProtectedRoute>} />
                  <Route path="/register"      element={<ProtectedRoute allowedRoles={["hr"]}><RegisterUser /></ProtectedRoute>} />
                  <Route path="/users"         element={<ProtectedRoute allowedRoles={["hr"]}><AllRegisteredUsers /></ProtectedRoute>} />
                  <Route path="/contacts"      element={<ProtectedRoute allowedRoles={["hr"]}><Contacts /></ProtectedRoute>} />
                  <Route path="/accounts"      element={<ProtectedRoute allowedRoles={["hr"]}><Accounts /></ProtectedRoute>} />
                  <Route path="/registerusers" element={<ProtectedRoute allowedRoles={["hr"]}><UserList /></ProtectedRoute>} />
                  <Route path="/ex-employees"  element={<ProtectedRoute allowedRoles={["hr"]}><ExEmployeePage /></ProtectedRoute>} />
                  <Route path="/students"      element={<ProtectedRoute allowedRoles={["hr"]}><StudentManagement /></ProtectedRoute>} />
                  <Route path="/ojt"           element={<ProtectedRoute allowedRoles={["hr"]}><OJTManagement /></ProtectedRoute>} />
                  <Route path="/"              element={<AllRegisteredUsers />} />
                  <Route path="*"              element={<AllRegisteredUsers />} />
                </>
              )}

              {role?.toLowerCase() === "superadmin" && (
                <>
                  <Route path="/uploadfile"    element={<UploadPage />} />
                  <Route path="/register"      element={<RegisterUser />} />
                  <Route path="/users"         element={<AllRegisteredUsers />} />
                  <Route path="/contacts"      element={<Contacts />} />
                  <Route path="/accounts"      element={<Accounts />} />
                  <Route path="/registerusers" element={<UserList />} />
                  <Route path="/ex-employees"  element={<ExEmployeePage />} />
                  <Route path="/students"      element={<StudentManagement />} />
                  <Route path="/ojt"           element={<OJTManagement />} />
                  <Route path="/permissions"   element={<PermissionsPage />} />
                  <Route path="/roles"         element={<RolesPage />} />
                  <Route path="/"              element={<AllRegisteredUsers />} />
                  <Route path="*"              element={<AllRegisteredUsers />} />
                </>
              )}
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;