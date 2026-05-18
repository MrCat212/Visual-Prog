import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';

function ProtectedRoute() {
  const location = useLocation();
  const isAuthorized = useAppSelector((state) => state.auth.isAuthorized);

  if (!isAuthorized) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;