import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/roles';
import Button from '../components/Button';
import AdminLayout from './AdminLayout';
import StudentLayout from './StudentLayout';
import ThemeToggle from '../components/ThemeToggle';

function AppLayout() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  if (!isLoading && isAuthenticated && user?.role === 'ADMIN') {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  if (!isLoading && isAuthenticated && user?.role === 'STUDENT') {
    return (
      <StudentLayout>
        <Outlet />
      </StudentLayout>
    );
  }

  return (
    <div className="relative min-h-screen bg-page-glow">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(246,247,248,0.9)_40%,#f6f7f8_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8">
        <header className="flex items-center justify-between border-b border-ink-200/80 pb-5">
          <Link to="/" className="group flex items-center gap-3 no-underline">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold tracking-wide text-white shadow-sm transition duration-300 group-hover:bg-brand-700">
              SE
            </span>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-ink-900">
                School ERP
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-500">
                Campus operations
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium text-ink-600">
            <ThemeToggle />
            <Link to="/" className="transition-colors duration-200 hover:text-brand-700">
              Home
            </Link>

            {!isLoading && isAuthenticated ? (
              <>
                <Link
                  to={ROLE_HOME[user.role] || '/'}
                  className="transition-colors duration-200 hover:text-brand-700"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="transition-colors duration-200 hover:text-brand-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <Button as={Link} to="/login" className="!px-3 !py-2">
                Sign in
              </Button>
            )}
          </nav>
        </header>

        <main className="flex flex-1 flex-col py-10">
          <Outlet />
        </main>

        <footer className="border-t border-ink-200/80 pt-5 text-sm text-ink-500">
          School ERP foundation — Module 2 authentication ready.
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
