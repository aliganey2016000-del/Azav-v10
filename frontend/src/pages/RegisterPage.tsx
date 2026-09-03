import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User, GraduationCap, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApplicantType } from '../types/frontend';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [applicantType, setApplicantType] = useState<ApplicantType>(ApplicantType.UNIVERSITY);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [universityId, setUniversityId] = useState('uni_harvard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone,
        applicantType,
        universityId: applicantType === ApplicantType.INDEPENDENT ? null : universityId,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">AZAAM MEDICS</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-200">Clinical Attachment Registration</h2>
          <p className="text-xs text-slate-400">Choose your applicant pathway and submit your registration</p>
        </div>

        {/* Applicant Type Toggle Switcher */}
        <div className="grid grid-cols-2 gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setApplicantType(ApplicantType.UNIVERSITY)}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold transition-all ${
              applicantType === ApplicantType.UNIVERSITY
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>University Student</span>
          </button>

          <button
            type="button"
            onClick={() => setApplicantType(ApplicantType.INDEPENDENT)}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold transition-all ${
              applicantType === ApplicantType.INDEPENDENT
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Independent Applicant</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555-0192"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {applicantType === ApplicantType.UNIVERSITY ? (
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Affiliated University</label>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="uni_harvard">Harvard Medical School</option>
                <option value="uni_oxford">University of Oxford Medical Sciences</option>
                <option value="uni_johnshopkins">Johns Hopkins School of Medicine</option>
              </select>
            </div>
          ) : (
            <div className="p-3 bg-sky-950/40 border border-sky-800/40 rounded-xl text-sky-300 space-y-1">
              <p className="font-semibold">Independent Pathway Enforced:</p>
              <p className="text-[11px] text-slate-400">
                You are registering as an independent medical practitioner or student without institutional university backing (`universityId = null`).
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-11 text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1.5 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-slate-400 pt-2">
            Already registered?{' '}
            <Link to="/login" className="text-sky-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
