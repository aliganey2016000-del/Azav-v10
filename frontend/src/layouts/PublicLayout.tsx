import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ee] text-slate-800 font-sans">
      <div className="bg-[#0d1b2a] px-4 py-2 text-center text-[11px] font-medium tracking-[0.14em] text-slate-200 uppercase">
        AZAAM International Medics Network (AIMN) • International clinical education with purpose
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d1b2a] text-[#d5b56d] shadow-md">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black uppercase tracking-tight text-slate-900">AIMN</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6a24]">AZAAM International Medics</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex">
            <a href="#about" className="transition hover:text-[#8a6a24]">About</a>
            <a href="#programs" className="transition hover:text-[#8a6a24]">Academics</a>
            <a href="#events" className="transition hover:text-[#8a6a24]">Events</a>
            <a href="#news" className="transition hover:text-[#8a6a24]">News</a>
            <Link to="/verify-certificate" className="inline-flex items-center gap-1.5 text-[#8a6a24] hover:text-[#6a4f18]">
              <ShieldCheck className="h-4 w-4" />
              Verify Certificate
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <button onClick={() => navigate('/portal')} className="inline-flex items-center gap-2 rounded-lg bg-[#0d1b2a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2c46]">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900">Sign in</Link>
                <Link to="/register" className="rounded-lg bg-[#d5b56d] px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-[#e7c77a]">Apply Now</Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="space-y-3 text-sm font-medium text-slate-700">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block">About</a>
              <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="block">Academics</a>
              <a href="#events" onClick={() => setMobileMenuOpen(false)} className="block">Events</a>
              <a href="#news" onClick={() => setMobileMenuOpen(false)} className="block">News</a>
              <Link to="/verify-certificate" onClick={() => setMobileMenuOpen(false)} className="block text-[#8a6a24]">Verify Certificate</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg border border-slate-200 px-3 py-2 text-center">Sign in</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-[#d5b56d] px-3 py-2 text-center font-bold text-slate-900">Apply Now</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#0d1b2a] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 text-xl font-black uppercase tracking-tight text-white">AIMN</div>
              <p className="text-sm leading-7 text-slate-300">
                AZAAM International Medics Network is an international clinical education platform connecting medical students, universities, healthcare organizations, and supervisors through trusted training pathways.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#d5b56d]">Quick links</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#about" className="hover:text-white">About AIMN</a></li>
                <li><a href="#programs" className="hover:text-white">Academics</a></li>
                <li><a href="#events" className="hover:text-white">Events</a></li>
                <li><Link to="/verify-certificate" className="hover:text-white">Verify Certificates</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#d5b56d]">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>International Medical Training Network</li>
                <li><a href="tel:+252612223999" className="hover:text-white">+252-61-2223999</a></li>
                <li><a href="mailto:info@azaammedics.com" className="hover:text-white">info@azaammedics.com</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#d5b56d]">Follow us</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                <a className="rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 hover:text-white" href="https://www.facebook.com/azaammedics" target="_blank" rel="noreferrer">Facebook</a>
                <a className="rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 hover:text-white" href="https://www.linkedin.com/company/azaam-international-medics-network" target="_blank" rel="noreferrer">LinkedIn</a>
                <a className="rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 hover:text-white" href="https://twitter.com/azaammedics" target="_blank" rel="noreferrer">Twitter</a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-400">
            © 2026 AZAAM International Medics Network (AIMN). All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

