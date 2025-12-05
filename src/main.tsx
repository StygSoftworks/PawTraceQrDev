import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BillingSuccess, BillingCancel } from "./routes/BillingResult";
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
const Billing = lazy(() => import("./routes/Billing"));
const Pricing = lazy(() => import("./routes/Pricing"));
const About = lazy(() => import("./routes/About"));
const Contact = lazy(() => import("./routes/Contact"));


import "./index.css";
import { AuthProvider } from "./auth/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>

            <Routes>
              {/* Private app shell */}
              <Route element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="signin" element={<SignIn />} />
                <Route path="register" element={<Register />} />
                <Route path="account" element={<Account />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="reviews/moderation" element={<ReviewsModeration />} />
                <Route path="admin/qr-export" element={<AdminQRExport />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="billing/success" element={<BillingSuccess />} />
                <Route path="billing/cancel" element={<BillingCancel />} />
                <Route path="billing" element={<Billing />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
              </Route>

              {/* Public QR landing page (no auth, no AppLayout) */}
              <Route path="/p/:id" element={<PublicPet />} />

              {/* (optional) catch-all */}
              {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            </Routes>
            </Suspense>

            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
