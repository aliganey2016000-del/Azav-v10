import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Menu,
  Network,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
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
    const isPreview = new URLSearchParams(location.search).get('preview') === '1';
    const request = isPreview ? LandingPageCmsService.getPreview() : LandingPageCmsService.getPublic();
    request.then(setSiteContent).catch(() => setSiteContent(defaultLandingPageContent));
  }, [location.search]);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#003d33] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#003d33]/95 shadow-[0_10px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        <div className="mx-auto flex h-[94px] max-w-7xl items-center justify-between px-4 sm:h-[88px] sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-4 sm:gap-3">
            {siteContent.branding.logo ? (
              <img src={siteContent.branding.logo} alt={siteContent.branding.name} className="h-14 w-14 shrink-0 rounded-[18px] bg-white object-contain p-1.5 shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#ffb612] text-[#003d33] shadow-lg shadow-amber-400/20 sm:h-12 sm:w-12 sm:rounded-2xl">
                <Activity className="h-7 w-7 sm:h-6 sm:w-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-[23px] font-black leading-none text-white sm:text-[22px]" style={headingFont}>{siteContent.branding.name}</div>
              <div className="mt-1.5 truncate text-[8px] font-black uppercase tracking-[0.18em] text-emerald-100/65 sm:text-[10px] sm:tracking-[0.22em]">{siteContent.branding.tagline}</div>
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
                <Link to="/login" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/5">{siteContent.branding.signInLabel}</Link>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#ffb612] px-6 py-2.5 text-sm font-black text-[#07382f] shadow-lg shadow-amber-400/20 hover:bg-[#ffc533]">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/15 text-white transition hover:bg-white/5 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
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
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-full border border-white/20 px-4 py-2.5 text-center">{siteContent.branding.signInLabel}</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-[#ffb612] px-4 py-2.5 text-center font-black text-[#07382f]">{siteContent.branding.getStartedLabel}</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="relative overflow-hidden border-t border-white/10 bg-[linear-gradient(135deg,#0d3f93_0%,#0b2f79_48%,#0b245f_100%)] text-white/80">
        <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full border border-white/[0.04] opacity-60">
          <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
          <div className="absolute inset-16 rounded-full border border-white/[0.04]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-3 rounded-[20px] border border-white/15 bg-white/[0.035] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:grid-cols-3 sm:p-4">
            {[
              { label: siteContent.sectionHeadings.contactEmailLabel, value: siteContent.contact.email || '—', Icon: Mail },
              { label: siteContent.sectionHeadings.contactPhoneLabel, value: siteContent.contact.phone || '—', Icon: Phone },
              { label: siteContent.sectionHeadings.contactAddressLabel, value: siteContent.contact.address || siteContent.about.location || '—', Icon: MapPin },
            ].map(({ label, value, Icon }, index) => (
              <div key={label} className={`flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2.5 ${index > 0 ? 'sm:border-l sm:border-white/10 sm:pl-5' : ''}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#ffbf2f]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
                  <p className="mt-1 break-words text-[13px] font-bold leading-5 text-white sm:text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 border-b border-white/10 pb-8">
            {siteContent.branding.logo ? (
              <img src={siteContent.branding.logo} alt={siteContent.branding.name} className="h-16 w-16 shrink-0 rounded-[18px] bg-white object-contain p-1.5 shadow-lg sm:h-20 sm:w-20" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-[#ffb612] text-[#003d33] shadow-lg sm:h-20 sm:w-20">
                <Activity className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-[25px] font-black leading-none text-white sm:text-4xl" style={headingFont}>{siteContent.branding.name}</div>
              <div className="mt-2 truncate text-[9px] font-black uppercase tracking-[0.22em] text-white/65 sm:text-xs sm:tracking-[0.28em]">{siteContent.branding.tagline}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7 border-b border-white/10 py-8 sm:gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="min-w-0">
              <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffbf2f] sm:text-xs">{siteContent.footer.exploreTitle}</h3>
              <div className="mt-3 h-1 w-8 rounded-full bg-[#ffe18a]" />
              <ul className="mt-5 space-y-3 text-[12px] sm:text-sm">
                {siteContent.footer.exploreLinks.map((item, index) => {
                  const Icon = [Landmark, BookOpen, UsersRound, Network][index % 4];
                  const linkClass = "flex min-w-0 items-center gap-2.5 text-white/80 transition hover:text-white";
                  const inner = <><Icon className="h-4 w-4 shrink-0 text-white/90" /><span className="truncate">{item.label}</span></>;
                  return (
                    <li key={`${item.label}-${item.href}`}>
                      {item.href.startsWith('#')
                        ? <a href={onLandingPage ? item.href : `/${item.href}`} className={linkClass}>{inner}</a>
                        : <Link to={item.href} className={linkClass}>{inner}</Link>}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="min-w-0 border-l border-white/10 pl-5 sm:pl-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffbf2f] sm:text-xs">{siteContent.footer.portalsTitle}</h3>
              <div className="mt-3 h-1 w-8 rounded-full bg-[#ffe18a]" />
              <ul className="mt-5 space-y-3 text-[12px] sm:text-sm">
                {siteContent.footer.portalLinks.map((item, index) => {
                  const Icon = [GraduationCap, Building2, UserRound, BadgeCheck][index % 4];
                  return (
                    <li key={`${item.label}-${item.href}`}>
                      <Link to={item.href} className="flex min-w-0 items-center gap-2.5 text-white/80 transition hover:text-white">
                        <Icon className="h-4 w-4 shrink-0 text-white/90" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="my-7 rounded-[20px] border border-white/15 bg-white/[0.035] p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#ffbf2f] sm:h-14 sm:w-14">
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0">
                <div className="font-black text-white sm:text-lg">{siteContent.footer.qualityTitle}</div>
                <p className="mt-1.5 text-[12px] leading-5 text-white/65 sm:text-sm sm:leading-6">{siteContent.footer.qualityDescription}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <span className="leading-5 text-white/65">{siteContent.footer.copyrightText}</span>
            <span className="inline-flex items-center gap-2 font-medium text-white/80">
              <Sparkles className="h-4 w-4 shrink-0 text-[#ffbf2f]" />
              {siteContent.footer.motto}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
