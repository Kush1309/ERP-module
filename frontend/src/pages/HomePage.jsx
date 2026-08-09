import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { checkHealth } from '../services/healthService';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/roles';

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [health, setHealth] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    let isMounted = true;

    const loadHealth = async () => {
      try {
        const data = await checkHealth();
        if (isMounted) {
          setHealth({ status: 'ok', message: data.message });
        }
      } catch {
        if (isMounted) {
          setHealth({
            status: 'error',
            message: 'Unable to reach the API. Start the backend server.',
          });
        }
      }
    };

    loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          Module 2 — Authentication
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
          A calm starting point for school operations.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-ink-600">
          Secure login with role-based access for Admin, Teacher, Student, and
          Parent. Business modules will be added one at a time.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">API status</h2>
            <p className="mt-1 text-sm text-ink-600">
              {health.status === 'idle' && 'Checking health endpoint...'}
              {health.status === 'ok' && health.message}
              {health.status === 'error' && health.message}
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
              health.status === 'ok'
                ? 'bg-brand-100 text-brand-700'
                : health.status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-ink-100 text-ink-600'
            }`}
          >
            {health.status === 'ok'
              ? 'Online'
              : health.status === 'error'
                ? 'Offline'
                : 'Checking'}
          </span>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        {isAuthenticated ? (
          <Button as={Link} to={ROLE_HOME[user.role] || '/'}>
            Go to dashboard
          </Button>
        ) : (
          <Button as={Link} to="/login">
            Sign in
          </Button>
        )}
        <Button
          as="a"
          href="/api/health"
          target="_blank"
          rel="noreferrer"
          variant="secondary"
        >
          Open health API
        </Button>
      </div>
    </section>
  );
}

export default HomePage;
