import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PublicRoute = () => {
  const { user, isLoading } = useAuth();
  const isSuperuser = user?.is_superuser;

  if (isLoading) {
    return null;
  }

  if (user) {
    const redirectTo = isSuperuser ? '/dashboard' : '/lista-clientes';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
