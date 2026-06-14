import React, { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";

// Lazy load pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin"));
const DashboardDoctor = lazy(() => import("./pages/DashboardDoctor"));
const DashboardPatient = lazy(() => import("./pages/DashboardPatient"));
const DoctorsList = lazy(() => import("./pages/DoctorsList"));
const ConsultationPage = lazy(() => import("./pages/ConsultationPage"));
const MedicinesPage = lazy(() => import("./pages/MedicinesPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const ConsultationHistory = lazy(() => import("./pages/ConsultationHistory"));
const ApplyDoctor = lazy(() => import("./pages/ApplyDoctor"));
const Settings = lazy(() => import("./pages/Settings"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin")
      return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "dokter")
      return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }
  return children;
};

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log(
      "AppContent - User role:",
      user?.role,
      "Path:",
      location.pathname,
    );
  }, [user, location]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                user ? (
                  user.role === "admin" ? (
                    <Navigate to="/admin/dashboard" replace />
                  ) : user.role === "dokter" ? (
                    <Navigate to="/doctor/dashboard" replace />
                  ) : (
                    <Navigate to="/patient/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["dokter"]}>
                  <DashboardDoctor />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={["pasien"]}>
                  <DashboardPatient />
                </ProtectedRoute>
              }
            />

            {/* PUBLIC ROUTES - Bisa diakses semua user yang login */}
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <DoctorsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medicines"
              element={
                <ProtectedRoute>
                  <MedicinesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={["pasien"]}>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consultations/history"
              element={
                <ProtectedRoute>
                  <ConsultationHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/consultation"
              element={
                <ProtectedRoute allowedRoles={["pasien"]}>
                  <ConsultationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/apply-doctor"
              element={
                <ProtectedRoute allowedRoles={["pasien"]}>
                  <ApplyDoctor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment/:orderId"
              element={
                <ProtectedRoute allowedRoles={["pasien"]}>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
