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
    <div className="flex min-h-[100dvh] w-full bg-[#FAFAFA]">
      {/* Left Pane (Hidden on smaller screens) */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between bg-[#11382D] relative overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Faint Concentric Circles */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/5 pointer-events-none" />

        {/* Top Header Branding */}
        <div className="relative z-10 px-12 py-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8FB3A8]/40 text-sm font-semibold tracking-wide text-[#8FB3A8]">
            SE
          </div>
          <div>
            <h1 className="text-white font-semibold text-[1.35rem] tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">School ERP</h1>
            <p className="text-[#8FB3A8] text-[0.65rem] font-bold uppercase tracking-[0.25em] mt-0.5">
              Campus Operations Register
            </p>
          </div>
        </div>

        {/* Center Graphic: 3D Cards */}
        <div className="relative z-10 flex-1 flex items-center justify-center pt-8">
          <div className="relative w-[340px] h-[220px]">
            {/* Card 1 (Right back) */}
            <div
              className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-[2px] border border-white/10 shadow-2xl transition-transform duration-500 ease-out hover:-translate-y-2 hover:rotate-6"
              style={{ transform: 'rotate(15deg) scale(0.9) translateX(50px) translateY(-10px)', transformOrigin: 'center center' }}
            ></div>

            {/* Card 2 (Left back) */}
            <div
              className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl transition-transform duration-500 ease-out hover:-translate-y-2 hover:rotate-[-6deg]"
              style={{ transform: 'rotate(-10deg) scale(0.95) translateX(-40px) translateY(5px)', transformOrigin: 'center center' }}
            ></div>

            {/* Card 3 (Center top translucent glass) */}
            <div
              className="absolute inset-0 z-10 rounded-2xl bg-white/[0.12] backdrop-blur-xl border border-white/[0.25] shadow-[0_12px_40px_0_rgba(0,0,0,0.4)] flex flex-col p-6 transition-transform duration-500 ease-out hover:scale-105"
              style={{ transform: 'rotate(2deg) translateY(20px)', transformOrigin: 'center center' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2 text-white/50">
                  <span className="text-sm">✓</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#E5B55E]/20 border border-[#E5B55E]/40 flex items-center justify-center text-[#E5B55E] text-sm shadow-[0_0_15px_rgba(229,181,94,0.3)]">₹</div>
              </div>
              <div className="mt-8 flex-1 flex flex-col justify-end pb-2">
                <p className="text-white/70 text-[0.65rem] font-bold uppercase tracking-[0.2em] mb-1.5">Fees</p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-[0.95rem] tracking-wide text-shadow-sm">₹ dues cleared</span>
                </div>
                <div className="h-1.5 w-12 bg-white/[0.15] rounded-full mt-4"></div>
                <div className="h-1.5 w-8 bg-white/[0.08] rounded-full mt-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text Area */}
        <div className="relative z-10 px-12 pb-16 max-w-lg mt-12">
          <h2 className="text-[1.8rem] font-display font-semibold text-white leading-[1.3]">
            One register.<br />
            Every role, its own page.
          </h2>
          <p className="text-[#8FB3A8] text-[0.9rem] mt-3 leading-relaxed max-w-[90%] opacity-90">
            Admins, teachers, students and parents each sign in through the same ledger and land exactly where their day starts.
          </p>
        </div>
      </div>

      {/* Right Pane (Form Area) */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 px-6 sm:px-12 bg-[#F9FAFB]">
        <div className="w-full max-w-[380px]">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#11382D]">
            Secure access
          </p>
          <h1 className="mt-2 font-display text-[2.2rem] pb-1 font-semibold text-[#1F2937]">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[#4B5563] leading-relaxed mb-8">
            Use your School ERP login ID and password. One portal for all roles.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="loginId"
                className="mb-1.5 block text-[0.85rem] font-medium text-[#374151]"
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
                placeholder="ADM2026000001"
                className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#276451] focus:ring-1 focus:ring-[#276451] shadow-sm placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[0.85rem] font-medium text-[#374151]"
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
                  className="w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2.5 pr-20 text-sm text-[#111827] outline-none transition focus:border-[#276451] focus:ring-1 focus:ring-[#276451] shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-1 px-4 text-[0.7rem] font-bold uppercase tracking-widest text-[#11382D] opacity-70 hover:opacity-100 transition"
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

            <Button
              type="submit"
              className="w-full text-white shadow-md transition !bg-[#276451] hover:!bg-[#194D3D] border-0"
              disabled={submitting}
            >
              <div className="py-0.5">
                {submitting ? 'Signing in…' : 'Sign in'}
              </div>
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-[#4B5563]">
            <Link to="/" className="hover:text-[#11382D] transition decoration-[#D1D5DB] hover:decoration-[#11382D] underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
