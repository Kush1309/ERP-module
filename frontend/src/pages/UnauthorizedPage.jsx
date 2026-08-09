import { Link } from 'react-router-dom';
import Button from '../components/Button';

function UnauthorizedPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        Access denied
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">
        Unauthorized
      </h1>
      <p className="mt-3 text-sm text-ink-600">
        Your account does not have permission to view this area.
      </p>
      <Button as={Link} to="/" className="mt-8">
        Go home
      </Button>
    </div>
  );
}

export default UnauthorizedPage;
