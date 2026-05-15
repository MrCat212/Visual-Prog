import { Navigate, Outlet } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';

function ProtectedRoute() {
  const isAuthorized = useAppSelector((state) => state.auth.isAuthorized);

  if (!isAuthorized) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;