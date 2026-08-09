import { Link } from 'react-router-dom';
import Button from '../components/Button';

function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
        404
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900">
        Page not found
      </h1>
      <p className="text-base leading-relaxed text-ink-600">
        The page you requested is not part of the School ERP foundation yet.
      </p>
      <Button as={Link} to="/">
        Back to home
      </Button>
    </section>
  );
}

export default NotFoundPage;
