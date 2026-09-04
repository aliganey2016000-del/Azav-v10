import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, Mail } from 'lucide-react';
import api from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data?.data?.message || 'If the account exists, password reset instructions have been prepared.');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Unable to process the request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white"><Activity className="w-6 h-6" /></div>
            <span className="font-extrabold text-xl text-white tracking-tight">AZAAM MEDICS</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-200">Reset your password</h2>
          <p className="text-xs text-slate-400">Enter your account email to start the password reset process.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
          {message && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg">{message}</div>}
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg">{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 focus:outline-none focus:border-sky-500" />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-xs">
            {loading ? 'Processing...' : 'Continue'}
          </button>
          <Link to="/login" className="flex items-center justify-center gap-2 text-xs text-sky-400 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link>
        </form>
      </div>
    </div>
  );
};
