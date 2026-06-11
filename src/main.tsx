import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BillingSuccess, BillingCancel } from "./routes/BillingResult";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AppLayout = lazy(() => import("./routes/AppLayout"));
const Home = lazy(() => import("./routes/Home"));
const Dashboard = lazy(() => import("./routes/Dashboard"));
const SignIn = lazy(() => import("./routes/SignIn"));
const Register = lazy(() => import("./routes/Register"));
const Account = lazy(() => import("./routes/Account"));
const PublicPet = lazy(() => import("./routes/PublicPet"));
const Privacy = lazy(() => import("./routes/Privacy"));
const Terms = lazy(() => import("./routes/Terms"));
const ForgotPassword = lazy(() => import("./routes/ForgotPassword"));
const ResetPassword = lazy(() => import("./routes/ResetPassword"));
const Feedback = lazy(() => import("./routes/Feedback"));
const Reviews = lazy(() => import("./routes/Reviews"));
const ReviewsModeration = lazy(() => import("./routes/ReviewsModeration"));
const AdminQRExport = lazy(() => import("./routes/AdminQRExport"));
const AdminPets = lazy(() => import("./routes/AdminPets"));
const Billing = lazy(() => import("./routes/Billing"));
const Pricing = lazy(() => import("./routes/Pricing"));
const About = lazy(() => import("./routes/About"));
const Contact = lazy(() => import("./routes/Contact"));
const Onboard = lazy(() => import("./routes/Onboard"));
const CheckEmail = lazy(() => import("./routes/CheckEmail"));
const NotFound = lazy(() => import("./routes/NotFound"));

import "./index.css";
import { AuthProvider } from "./auth/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((mod) => ({
    default: mod.ReactQueryDevtools,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
                <Routes>
                  {/* App shell - public routes */}
                  <Route element={<AppLayout />}>
                    <Route index element={<Home />} />
                    <Route path="signin" element={<SignIn />} />
                    <Route path="register" element={<Register />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />

                    {/* Protected routes - require auth */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="account" element={<Account />} />
                      <Route path="feedback" element={<Feedback />} />
                      <Route path="billing" element={<Billing />} />
                      <Route path="billing/success" element={<BillingSuccess />} />
                      <Route path="billing/cancel" element={<BillingCancel />} />
                      <Route path="admin/pets" element={<AdminPets />} />
                      <Route path="admin/reviews" element={<ReviewsModeration />} />
                      <Route path="admin/qr-export" element={<AdminQRExport />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Public QR landing page (no AppLayout) */}
                  <Route path="/p/:id" element={<PublicPet />} />

                  {/* Onboarding flow for new tag scans */}
                  <Route path="/onboard/:id" element={<Onboard />} />

                  {/* Email verification page */}
                  <Route path="/check-email" element={<CheckEmail />} />
                </Routes>
              </Suspense>

              {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </ThemeProvider>
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
