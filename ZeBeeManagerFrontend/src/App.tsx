import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientRegistration from "./pages/ClientRegistration";
import ListingClient from './pages/ListingClient';
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

const AppRoutes = () => {
    const { user } = useAuth();
    const isSuperuser = user?.is_superuser;

    return (
        <Routes>
            <Route element={<PublicRoute />}>
                <Route path="/" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    {isSuperuser && <Route path="/dashboard" element={<Dashboard />} />}
                    <Route path="/registrar" element={<ClientRegistration />} />
                    <Route path="/lista-clientes" element={<ListingClient />} />
                    <Route path="/dashboard" element={isSuperuser ? <Dashboard /> : <ListingClient />} />
                </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="contract-manager-theme">
      <TooltipProvider>
        <div className="w-100 bg-red-600 text-yellow-50 text-center text-2xl">Você está no ambiente de testes.</div>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
