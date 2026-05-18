import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { setActiveDocumentId } from '@/features/documents/documentsSlice';

function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAppSelector((state) => state.auth.user);

  function getPageTitle(): string {
    if (location.pathname.startsWith('/documents/')) {
      return 'Документ';
    }

    if (location.pathname === '/profile') {
      return 'Профиль';
    }

    return 'Мои документы';
  }

  function handleLogout() {
    dispatch(setActiveDocumentId(null));
    dispatch(logout());
    navigate('/login', {
      replace: true,
    });
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>FinalProject</h2>

        {user !== null && (
          <div className="sidebar-user">
            <p>{user.name}</p>
            <small>{user.email}</small>
          </div>
        )}

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Мои документы</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          Выйти
        </button>
      </aside>

      <div className="layout-content">
        <header className="layout-header">
          <h1>{getPageTitle()}</h1>
        </header>

        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;