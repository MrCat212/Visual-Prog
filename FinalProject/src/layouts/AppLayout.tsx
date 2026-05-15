import { NavLink, Outlet, useLocation } from 'react-router-dom';

function AppLayout() {
  const location = useLocation();

  function getPageTitle(): string {
    if (location.pathname.startsWith('/documents/')) {
      return 'Документ';
    }

    if (location.pathname === '/profile') {
      return 'Профиль';
    }

    return 'Мои документы';
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>FinalProject</h2>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Мои документы</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </nav>
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