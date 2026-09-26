import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { defaultLandingPageContent, LandingPageCmsService } from '../services/landingPageCms.service';

const headingFont = { fontFamily: "Georgia, 'Times New Roman', serif" };


export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onLandingPage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [siteContent, setSiteContent] = React.useState(defaultLandingPageContent);

  // The public marketing site has its own fixed brand palette and was never
  // designed with a dark mode. If the visitor toggled dark mode in the admin
  // portal earlier in the same session, the `dark` class stays on <html> and
  // a global stylesheet override (index.css) forcibly re-colors bg-white /
  // text-slate-* utility classes everywhere, breaking contrast here. Suspend
  // that class for as long as a public page is mounted, and restore it when
  // navigating back into an authenticated portal.
  useEffect(() => {
    LandingPageCmsService.getPublic().then(setSiteContent).catch(() => setSiteContent(defaultLandingPageContent));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#003d33] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#003d33]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            {siteContent.branding.logo ? (
              <img src={siteContent.branding.logo} alt={siteContent.branding.name} className="h-10 w-10 rounded-xl bg-white object-contain p-1 shadow-lg" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb612] text-[#003d33] shadow-lg shadow-amber-400/20">
                <Activity className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="text-[18px] font-black leading-none text-white" style={headingFont}>{siteContent.branding.name}</div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-100/65">{siteContent.branding.tagline}</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-[13px] font-semibold text-emerald-50/80 lg:flex">
            {siteContent.navigation.map((item) => {
              const isHash = item.href.startsWith('#');
              if (isHash && onLandingPage) {
                return <a key={`${item.label}-${item.href}`} href={item.href} className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">{item.label}</a>;
              }
              const target = isHash ? `/${item.href}` : item.href;
              return <Link key={`${item.label}-${item.href}`} to={target} className="rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">{item.label}</Link>;
            })}
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
              {siteContent.navigation.map((item) => {
                const isHash = item.href.startsWith('#');
                if (isHash && onLandingPage) {
                  return <a key={`${item.label}-${item.href}`} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-white/5">{item.label}</a>;
                }
                const target = isHash ? `/${item.href}` : item.href;
                return <Link key={`${item.label}-${item.href}`} to={target} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2.5 hover:bg-white/5">{item.label}</Link>;
              })}
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

      <footer className="border-t border-white/15 bg-[#303b8e] text-white/75">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                {siteContent.branding.logo ? (
                  <img src={siteContent.branding.logo} alt={siteContent.branding.name} className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb612] text-[#003d33]"><Activity className="h-5 w-5" /></div>
                )}
                <div>
                  <div className="text-lg font-black text-white" style={headingFont}>{siteContent.branding.name}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em]">{siteContent.branding.tagline}</div>
                </div>
              </div>
              <p className="text-sm leading-7">{siteContent.footer.description}</p>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#ffbf2f]">{siteContent.footer.exploreTitle}</h3>
              <ul className="space-y-2 text-sm">
                {siteContent.footer.exploreLinks.map((item) => (
                  <li key={`${item.label}-${item.href}`}>
                    {item.href.startsWith('#') ? <a href={onLandingPage ? item.href : `/${item.href}`} className="hover:text-white">{item.label}</a> : <Link to={item.href} className="hover:text-white">{item.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#ffbf2f]">{siteContent.footer.portalsTitle}</h3>
              <ul className="space-y-2 text-sm">
                {siteContent.footer.portalLinks.map((item) => (
                  <li key={`${item.label}-${item.href}`}><Link to={item.href} className="hover:text-white">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#ffbf2f]">Quality</h3>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 font-bold text-white"><ShieldCheck className="h-4 w-4 text-[#ffbf2f]" /> {siteContent.footer.qualityTitle}</div>
                <p className="mt-2 text-sm leading-6">{siteContent.footer.qualityDescription}</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs md:flex-row md:items-center md:justify-between">
            <span>{siteContent.footer.copyrightText}</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#ffbf2f]" /> {siteContent.footer.motto}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
