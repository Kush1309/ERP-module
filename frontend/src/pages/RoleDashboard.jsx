import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

function RoleDashboard({ title, description }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-ink-200/80 bg-white/90 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Protected area
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-600">{description}</p>

        <dl className="mt-8 grid gap-4 rounded-xl bg-ink-50 p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">Login ID</dt>
            <dd className="mt-1 font-semibold text-ink-900">{user?.loginId}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Role</dt>
            <dd className="mt-1 font-semibold text-ink-900">{user?.role}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Account status</dt>
            <dd className="mt-1 font-semibold text-ink-900">
              {user?.isActive ? 'Active' : 'Inactive'}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Must change password</dt>
            <dd className="mt-1 font-semibold text-ink-900">
              {user?.mustChangePassword ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>

        {user?.mustChangePassword ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You are using a temporary password.{' '}
            <Link to="/change-password" className="font-semibold underline">
              Change it now
            </Link>
            .
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button as={Link} to="/change-password" variant="secondary">
            Change password
          </Button>
          <Button type="button" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoleDashboard;
