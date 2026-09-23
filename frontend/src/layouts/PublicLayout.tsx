import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, ChevronDown, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const headingFont = { fontFamily: "Georgia, 'Times New Roman', serif" };

const SECTION_LINKS = [
  { hash: '#about', label: 'About' },
  { hash: '#programs', label: 'Training' },
  { hash: '#news', label: 'Updates' },
  { hash: '#network', label: 'Partners' },
];

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onLandingPage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#003d33] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#003d33]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb612] text-[#003d33] shadow-lg shadow-amber-400/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[18px] font-black leading-none text-white" style={headingFont}>AZAAM Medics</div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-100/65">International Medics Network</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-[13px] font-semibold text-emerald-50/80 lg:flex">
            {SECTION_LINKS.map((item) =>
              onLandingPage ? (
                <a key={item.hash} href={item.hash} className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">{item.label}</a>
              ) : (
                <Link key={item.hash} to={`/${item.hash}`} className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">{item.label}</Link>
              ),
            )}
            <Link to="/verify-certificate" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">
              Certificates <ChevronDown className="h-3.5 w-3.5" />
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <button
                onClick={() => navigate('/portal')}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/5"
              >
                Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <Link to="/login" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/5">Sign in</Link>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#ffb612] px-6 py-2.5 text-sm font-black text-[#07382f] shadow-lg shadow-amber-400/20 hover:bg-[#ffc533]">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-xl border border-white/15 p-2.5 text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#003d33] px-4 py-4 lg:hidden">
            <div className="space-y-2 text-sm font-semibold text-emerald-50/85">
              {SECTION_LINKS.map((item) =>
                onLandingPage ? (
                  <a key={item.hash} href={item.hash} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-white/5">{item.label}</a>
                ) : (
                  <Link key={item.hash} to={`/${item.hash}`} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-white/5">{item.label}</Link>
                ),
              )}
              <Link to="/verify-certificate" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-white/5">Verify Certificate</Link>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-full border border-white/20 px-4 py-2.5 text-center">Sign in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-[#ffb612] px-4 py-2.5 text-center font-black text-[#07382f]">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-[#002d27] text-emerald-50/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb612] text-[#003d33]"><Activity className="h-5 w-5" /></div>
                <div>
                  <div className="text-lg font-black text-white" style={headingFont}>AZAAM Medics</div>
                  <div className="text-[9px] uppercase tracking-[0.2em]">Clinical training network</div>
                </div>
              </div>
              <p className="text-sm leading-7">A connected platform for student nominations, clinical placements, hospital coordination, supervision and certification.</p>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#ffbf2f]">Explore</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white">About AIMN</a></li>
                <li><a href="#programs" className="hover:text-white">Clinical Training</a></li>
                <li><a href="#news" className="hover:text-white">Latest Updates</a></li>
                <li><a href="#network" className="hover:text-white">Partner Network</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#ffbf2f]">Portals</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white">University Portal</Link></li>
                <li><Link to="/login" className="hover:text-white">Hospital Portal</Link></li>
                <li><Link to="/login" className="hover:text-white">Student Portal</Link></li>
                <li><Link to="/verify-certificate" className="hover:text-white">Verify Certificate</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#ffbf2f]">Quality</h3>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 font-bold text-white"><ShieldCheck className="h-4 w-4 text-[#ffbf2f]" /> Trusted workflow</div>
                <p className="mt-2 text-sm leading-6">Structured, traceable and institution-connected clinical education management.</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs md:flex-row md:items-center md:justify-between">
            <span>© 2026 AZAAM International Medics Network. All rights reserved.</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#ffbf2f]" /> Train • Place • Empower</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
