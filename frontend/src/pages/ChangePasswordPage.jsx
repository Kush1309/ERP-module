import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../constants/roles';

function ChangePasswordPage() {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate(ROLE_HOME[user.role] || '/', { replace: true });
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-ink-200/80 bg-white/90 p-8 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          Change password
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Use at least 8 characters with one letter and one number.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Current password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              New password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Confirm new password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-md border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((value) => !value)}
            className="text-xs font-semibold uppercase tracking-wide text-ink-500 hover:text-brand-700"
          >
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {success}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link
            to={ROLE_HOME[user?.role] || '/'}
            className="font-medium text-brand-700 hover:text-brand-800"
          >
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
