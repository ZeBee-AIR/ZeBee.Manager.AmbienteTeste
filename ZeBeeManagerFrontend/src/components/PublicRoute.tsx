import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const PublicRoute = () => {
  const { user, isLoading } = useAuth();
  const isSuperuser = user?.is_superuser;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    const redirectTo = isSuperuser ? '/dashboard' : '/lista-clientes';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
