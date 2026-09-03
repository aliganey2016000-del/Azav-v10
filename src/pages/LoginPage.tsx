import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types/frontend';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@azaammedics.org');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/portal');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setLoading(true);
    await switchDemoRole(role);
    setLoading(false);
    navigate('/portal');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">AZAAM MEDICS</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-200">Sign In to Portal</h2>
          <p className="text-xs text-slate-400">Enter your credentials to access clinical attachment records</p>
        </div>

        {/* Quick Demo Switcher Bar */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Select Any Account to Log In:</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Click to test role</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-[11px]">
            {Object.keys(DEMO_USERS).map((rKey) => {
              const r = rKey as UserRole;
              const isSelected = email.toLowerCase() === DEMO_USERS[r].email.toLowerCase();
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setEmail(DEMO_USERS[r].email);
                    setPassword('Password123!');
                    handleQuickRole(r);
                  }}
                  className={`p-2 rounded-lg text-left transition-all border ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-500 text-sky-200'
                      : 'bg-slate-900/90 hover:bg-slate-700/60 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold block truncate">{DEMO_USERS[r].roleName}</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-mono">GO</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 block truncate">{DEMO_USERS[r].email}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-400 font-semibold hover:underline">
              Apply Now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
