import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/roles';

function LoginPage() {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!loginId.trim() || !password) {
      setError('Login ID and password are required.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await login({
        loginId: loginId.trim(),
        password,
      });
      navigate(result.redirectTo, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Unable to sign in. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <div className="rounded-2xl border border-ink-200/80 bg-white/90 p-8 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Secure access
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Use your School ERP login ID and password. One portal for all roles.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="loginId"
              className="mb-1.5 block text-sm font-medium text-ink-700"
            >
              Login ID
            </label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="e.g. ADM2026000001"
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2.5 pr-20 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500 hover:text-brand-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link to="/" className="font-medium text-brand-700 hover:text-brand-800">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
