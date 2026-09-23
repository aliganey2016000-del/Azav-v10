import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Mail,
  Menu,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="bg-[#0a8f3d] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[12px] sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href="tel:+252612223999" className="inline-flex items-center gap-1.5 hover:text-white/80">
              <Phone className="h-3.5 w-3.5" /> +252-61-2223999
            </a>
            <a href="mailto:info@azaammedics.com" className="inline-flex items-center gap-1.5 hover:text-white/80">
              <Mail className="h-3.5 w-3.5" /> info@azaammedics.com
            </a>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/login" className="font-semibold hover:text-white/80">Student Login</Link>
            <Link to="/login" className="font-semibold hover:text-white/80">Partner Login</Link>
            <Link to="/verify-certificate" className="font-semibold hover:text-white/80">Verify Certificate</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0a8f3d] bg-white text-[#0a8f3d] shadow-sm">
              <Activity className="h-7 w-7" />
            </div>
            <div className="leading-tight">
              <div className="text-[20px] font-black uppercase tracking-tight text-[#1668b2]">AZAAM</div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0a8f3d]">International Medics Network</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-bold text-slate-700 lg:flex">
            <a href="#home" className="px-3 py-8 text-[#0a8f3d]">Home</a>
            <a href="#about" className="px-3 py-8 hover:text-[#0a8f3d]">About Us</a>
            <a href="#programs" className="inline-flex items-center gap-1 px-3 py-8 hover:text-[#0a8f3d]">
              Academics <ChevronDown className="h-3.5 w-3.5" />
            </a>
            <Link to="/register" className="px-3 py-8 hover:text-[#0a8f3d]">Admission</Link>
            <a href="#facilities" className="px-3 py-8 hover:text-[#0a8f3d]">Campus Life</a>
            <a href="#news" className="inline-flex items-center gap-1 px-3 py-8 hover:text-[#0a8f3d]">
              Media <ChevronDown className="h-3.5 w-3.5" />
            </a>
            <a href="#memberships" className="px-3 py-8 hover:text-[#0a8f3d]">Partners</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <button
                onClick={() => navigate('/portal')}
                className="inline-flex items-center gap-2 rounded-md bg-[#1668b2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#105997]"
              >
                Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-[#0a8f3d]">Sign in</Link>
                <Link to="/register" className="rounded-md bg-[#0a8f3d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#087c35]">Apply Now</Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="space-y-1 text-sm font-bold text-slate-700">
              {[
                ['Home', '#home'],
                ['About Us', '#about'],
                ['Academics', '#programs'],
                ['Campus Life', '#facilities'],
                ['Media', '#news'],
                ['Partners', '#memberships'],
              ].map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-slate-50 hover:text-[#0a8f3d]">
                  {label}
                </a>
              ))}
              <Link to="/verify-certificate" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-[#1668b2]">
                Verify Certificate
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg border border-slate-200 px-3 py-2.5 text-center">
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-[#0a8f3d] px-3 py-2.5 text-center text-white">
                Apply Now
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-[#0b2440] text-slate-300">
        <div className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-[#39c16c]">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-black text-white">AZAAM</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#66d08c]">International Medics Network</div>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                International medical education, clinical attachments and supervised healthcare training through trusted institutional partnerships.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase text-white">Useful Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#programs" className="hover:text-white">Academics</a></li>
                <li><Link to="/register" className="hover:text-white">Admission</Link></li>
                <li><a href="#news" className="hover:text-white">Media</a></li>
                <li><Link to="/verify-certificate" className="hover:text-white">Verify Certificate</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase text-white">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-[#39c16c]" /> +252-61-2223999</li>
                <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-[#39c16c]" /> info@azaammedics.com</li>
                <li>International Medical Training Network</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase text-white">Portal Access</h3>
              <div className="space-y-2">
                <Link to="/login" className="block rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Student & Partner Login</Link>
                <Link to="/register" className="block rounded-md bg-[#0a8f3d] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#087c35]">Apply Now</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>© 2026 AZAAM International Medics Network. All rights reserved.</span>
          <span>Quality • Partnership • Clinical Excellence</span>
        </div>
      </footer>
    </div>
  );
};
