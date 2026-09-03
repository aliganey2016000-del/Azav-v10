import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Award, BookOpen, Building, GraduationCap, ShieldCheck, UserCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Top Notification Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
        <span className="bg-sky-500 text-white font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Official Notice
        </span>
        <span>AZAAM International Medics Network Clinical Attachment Platform 2026/2027 Portal</span>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block">AZAAM MEDICS</span>
              <span className="text-[10px] tracking-widest text-sky-700 uppercase font-bold block -mt-1">
                International Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#about" className="hover:text-sky-600 transition-colors">About AZAAM</a>
            <a href="#how-it-works" className="hover:text-sky-600 transition-colors">How It Works</a>
            <a href="#attachments" className="hover:text-sky-600 transition-colors">Clinical Attachments</a>
            <a href="#universities" className="hover:text-sky-600 transition-colors">Universities</a>
            <a href="#organizations" className="hover:text-sky-600 transition-colors">Healthcare Orgs</a>
            <Link to="/verify-certificate" className="hover:text-sky-600 transition-colors flex items-center gap-1.5 text-sky-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Verify Certificate
            </Link>
          </nav>

          {/* User Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-sky-600 font-medium text-sm px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
                >
                  Apply Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 text-sm">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700">About AZAAM</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700">How It Works</a>
            <a href="#attachments" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700">Clinical Attachments</a>
            <Link to="/verify-certificate" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sky-700 font-semibold">Verify Certificate</Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 text-slate-700 border border-slate-200 rounded-lg">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-sky-600 text-white rounded-lg">Apply Now</Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Activity className="w-5 h-5 text-sky-400" />
              <span>AZAAM MEDICS</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              International Clinical Attachment & Training Platform bridging medical students, accredited universities, and world-class healthcare facilities.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-white">About Platform</a></li>
              <li><a href="#attachments" className="hover:text-white">Available Rotations</a></li>
              <li><Link to="/verify-certificate" className="hover:text-white">Certificate Verification</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">User Roles</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login" className="hover:text-white">University Applicants</Link></li>
              <li><Link to="/login" className="hover:text-white">Independent Applicants</Link></li>
              <li><Link to="/login" className="hover:text-white">Clinical Supervisors</Link></li>
              <li><Link to="/login" className="hover:text-white">Healthcare Organizations</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Compliance & Disclaimer</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Official institutional accreditation & licensing partnerships: <span className="text-amber-400 font-medium">TO BE CONFIRMED</span>. All credentials subjected to multi-stage verification.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-xs text-center text-slate-400">
          © 2026 AZAAM International Medics Network. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
