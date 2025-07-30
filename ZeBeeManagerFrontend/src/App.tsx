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
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="contract-manager-theme">
      <TooltipProvider>
        <div className="w-100 bg-red-600 text-yellow-50 text-center text-2xl">Você está no ambiente de testes.</div>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* O AuthProvider envolve TODAS as rotas para gerir o estado globalmente */}
          <AuthProvider>
            <Routes>
              {/* Rotas Públicas (como o Login) */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Login />} />
              </Route>

              {/* Rotas Protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  {/* Note que a lógica de superusuário foi movida para dentro do ProtectedRoute/PublicRoute */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/registrar" element={<ClientRegistration />} />
                  <Route path="/lista-clientes" element={<ListingClient />} />
                </Route>
              </Route>
              
              {/* Rota para página não encontrada */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
