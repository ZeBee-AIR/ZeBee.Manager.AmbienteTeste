import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Se a verificação terminou e há um utilizador, mostra a página protegida
  if (user) {
    return <Outlet />;
  }

  // Se não houver utilizador, redireciona para o login
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
