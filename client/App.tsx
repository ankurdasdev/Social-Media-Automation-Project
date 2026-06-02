import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TutorialProvider } from "./components/TutorialProvider";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";

// App Pages
import Dashboard from "./pages/Dashboard";
import Controller from "./pages/Controller";
import Contacts from "./pages/Contacts";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import IntegrationsCenter from "./pages/IntegrationsCenter";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

import NotFound from "./pages/NotFound";
import { isTokenValid } from "./lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Protected Route — checks token validity on render (no async flash)
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return <>{element}</>;
};

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Admin Route — checks if the current user is an admin
const AdminRoute = ({ element }: { element: React.ReactNode }) => {
  if (!isTokenValid()) return <Navigate to="/login" replace />;

  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfileAdminCheck"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("casthub_auth_token")}` }
      });
      if (!res.ok) throw new Error("Not authorized");
      const data = await res.json();
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user || !user.is_admin) return <Navigate to="/dashboard" replace />;

  return <>{element}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TutorialProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected App Routes */}
            <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding />} />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/controller" element={<ProtectedRoute element={<Controller />} />} />
            <Route path="/contacts" element={<ProtectedRoute element={<Contacts />} />} />
            <Route path="/templates" element={<ProtectedRoute element={<Templates />} />} />
            <Route path="/analytics" element={<ProtectedRoute element={<Analytics />} />} />
            <Route path="/integrations" element={<ProtectedRoute element={<IntegrationsCenter />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />

            {/* Default redirect to dashboard (ProtectedRoute handles auth check) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TutorialProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
