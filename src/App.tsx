import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AthleterDashboard from "./pages/AthleteDashboard";
import AthleteSettings from "./pages/AthleteSettings";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import LoginLogs from "./pages/LoginLogs";
import { DebugLogs } from "./pages/DebugLogs";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/athlete-dashboard" element={
            <ProtectedRoute requiredUserType="athlete">
              <AthleterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/athlete-settings" element={
            <ProtectedRoute requiredUserType="athlete">
              <AthleteSettings />
            </ProtectedRoute>
          } />
          <Route path="/login-logs" element={
            <ProtectedRoute requiredUserType="athlete">
              <LoginLogs />
            </ProtectedRoute>
          } />
          <Route path="/debug-logs" element={
            <ProtectedRoute requiredUserType="athlete">
              <DebugLogs />
            </ProtectedRoute>
          } />
          <Route path="/professional-dashboard" element={
            <ProtectedRoute requiredUserType="professional">
              <ProfessionalDashboard />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
