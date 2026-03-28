import { lazy, Suspense, useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Loader } from "./components/Loader";
import { Navbar } from "./components/Navbar";
import {
  AdminRoute,
  ProtectedRoute,
  PublicOnlyRoute,
} from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { HomePage } from "./pages/HomePage";
import { useThemeStore } from "./store/themeStore";
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ScorePage = lazy(() =>
  import("./pages/ScorePage").then((module) => ({
    default: module.ScorePage,
  })),
);
const CharityPage = lazy(() =>
  import("./pages/CharityPage").then((module) => ({
    default: module.CharityPage,
  })),
);
const CharityProfilePage = lazy(() =>
  import("./pages/CharityProfilePage").then((module) => ({
    default: module.CharityProfilePage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const SignupPage = lazy(() =>
  import("./pages/SignupPage").then((module) => ({
    default: module.SignupPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

const AdminDashboardPage = lazy(() =>
  import("./pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);

function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/charities"
            element={
              <Suspense fallback={<Loader label="Loading charities" />}>
                <CharityPage />
              </Suspense>
            }
          />
          <Route
            path="/charities/:id"
            element={
              <Suspense fallback={<Loader label="Loading charity profile" />}>
                <CharityProfilePage />
              </Suspense>
            }
          />
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <Suspense fallback={<Loader label="Loading login" />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/signup"
              element={
                <Suspense fallback={<Loader label="Loading signup" />}>
                  <SignupPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<Loader label="Loading dashboard" />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/scores"
              element={
                <Suspense fallback={<Loader label="Loading scores" />}>
                  <ScorePage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin"
              element={
                <Suspense fallback={<Loader label="Loading admin workspace" />}>
                  <AdminDashboardPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Suspense fallback={<Loader label="Loading page" />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const theme = useThemeStore((state) => state.theme);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <>
      <AnimatedRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:
              theme === "dark"
                ? "rgba(15, 23, 42, 0.9)"
                : "rgba(248, 250, 252, 0.95)",
            color: theme === "dark" ? "#e2e8f0" : "#0f172a",
            border:
              theme === "dark"
                ? "1px solid rgba(148, 163, 184, 0.25)"
                : "1px solid rgba(148, 163, 184, 0.45)",
          },
        }}
      />
    </>
  );
}

export default App;
