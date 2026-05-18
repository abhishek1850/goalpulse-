import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { getRoleDashboard } from '../App';
import { Zap, Eye, EyeOff, UserCircle2, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// Quick-fill demo users
const DEMO_USERS = [
  {
    label: 'Employee',
    email: 'employee@goalpulse.com',
    password: 'employee123',
    icon: UserCircle2,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700',
    description: 'John Doe · Engineering',
  },
  {
    label: 'Manager',
    email: 'manager@goalpulse.com',
    password: 'manager123',
    icon: Users,
    color: 'from-primary-500 to-primary-600',
    bg: 'bg-primary-50 border-primary-200 hover:bg-primary-100 text-primary-700',
    description: 'Sarah Johnson · Engineering',
  },
  {
    label: 'Admin / HR',
    email: 'admin@goalpulse.com',
    password: 'admin123',
    icon: ShieldCheck,
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
    description: 'Admin HR · Human Resources',
  },
];

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // tracks which demo button
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (email, password, isDemoIdx = null) => {
    if (isDemoIdx !== null) setDemoLoading(isDemoIdx);
    else setLoading(true);

    try {
      const res = await loginUser({ email, password });
      login(res.data.user, res.data.token);
      toast.success(`Welcome, ${res.data.user.firstName}! 🎉`);
      navigate(getRoleDashboard(res.data.user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setDemoLoading(null);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(form.email, form.password);
  };

  const handleDemoLogin = (demo, idx) => {
    doLogin(demo.email, demo.password, idx);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ───────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-surface-950 via-primary-950 to-surface-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-16 left-16 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-16 right-16 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">GoalPulse</h1>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Set Goals.<br />Track Progress.<br />Achieve More.
          </h2>
          <p className="text-surface-300 text-base leading-relaxed mb-12">
            Your organization's in-house goal setting and quarterly check-in portal. Empower teams to align, track, and excel.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[{ n: '500+', l: 'Goals Set' }, { n: '98%', l: 'Completion' }, { n: '4.8★', l: 'Rating' }].map((s) => (
              <div key={s.l} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                <p className="text-2xl font-bold text-white">{s.n}</p>
                <p className="text-xs text-surface-300 mt-1">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Role cards */}
          <div className="mt-10 space-y-3">
            {DEMO_USERS.map((d) => (
              <div key={d.label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${d.color} flex items-center justify-center flex-shrink-0`}>
                  <d.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{d.label}</p>
                  <p className="text-xs text-surface-400">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login form ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50 overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">GoalPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
          <p className="text-surface-300 mb-8 text-sm">Sign in to your performance portal</p>

          {/* ── Quick Demo Login Buttons ──── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
              ⚡ Quick Demo Login
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_USERS.map((demo, idx) => (
                <button
                  key={demo.label}
                  type="button"
                  disabled={demoLoading !== null || loading}
                  onClick={() => handleDemoLogin(demo, idx)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${demo.bg}`}
                >
                  {demoLoading === idx ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${demo.color} flex items-center justify-center flex-shrink-0`}>
                      <demo.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="text-left">
                    <span className="block leading-tight">Login as {demo.label}</span>
                    <span className="text-xs font-normal opacity-70">{demo.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-surface-50 text-xs text-surface-300 font-medium">or sign in manually</span>
            </div>
          </div>

          {/* ── Manual Login Form ──── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-700 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || demoLoading !== null}
              className="btn-primary w-full py-3 text-base mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-300 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              Create account
            </Link>
          </p>

          {/* Credentials reference */}
          <div className="mt-8 p-4 bg-surface-100 rounded-xl border border-surface-200">
            <p className="text-xs font-semibold text-surface-700 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-surface-500">
              <p><span className="font-medium text-surface-700">Employee:</span> employee@goalpulse.com / employee123</p>
              <p><span className="font-medium text-surface-700">Manager:</span>  manager@goalpulse.com  / manager123</p>
              <p><span className="font-medium text-surface-700">Admin:</span>    admin@goalpulse.com    / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
