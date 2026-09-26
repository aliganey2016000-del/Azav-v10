import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  Play,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
  Telescope,
  Diamond,
} from 'lucide-react';
import {
  defaultLandingPageContent,
  LandingPageCmsService,
  LandingPageContent,
  VideoItem,
} from '../services/landingPageCms.service';

const headingFont = { fontFamily: "Georgia, 'Times New Roman', serif" };

const aimnHighlightIcons = [Users, CalendarDays, Stethoscope, TrendingUp, Globe2, Activity, Building2, Award];

const SmartLink: React.FC<{ to: string; className?: string; children: React.ReactNode }> = ({ to, className, children }) => {
  if (/^https?:\/\//i.test(to)) {
    return <a href={to} className={className} target="_blank" rel="noreferrer">{children}</a>;
  }
  return <Link to={to || '/'} className={className}>{children}</Link>;
};

const youtubeEmbed = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith('/embed/')) return url;
    }
  } catch {}
  return '';
};

const HeroVideoCarousel: React.FC<{ videos: VideoItem[] }> = ({ videos }) => {
  const [index, setIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const items = videos.slice(0, 5);

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  const goNext = () => setIndex((current) => (current + 1) % items.length);
  const goPrev = () => setIndex((current) => (current - 1 + items.length) % items.length);

  const current = items[index];
  const embed = current ? youtubeEmbed(current.url) : '';

  // YouTube videos only move to the next one once they actually finish playing
  // (via the IFrame API's onStateChange === 0 "ended" event), not on a timer.
  useEffect(() => {
    if (!embed) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange' && data.info === 0) goNext();
      } catch {
        // Not a JSON message from the YouTube player; ignore.
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed, items.length]);

  if (items.length === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-black">
      <div className="aspect-video w-full">
        {embed ? (
          <iframe
            ref={iframeRef}
            key={`${current.url}-${index}`}
            src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1&mute=1&controls=1&rel=0&enablejsapi=1`}
            title={current.title || `AIMN video ${index + 1}`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            key={`${current.url}-${index}`}
            src={current.url}
            poster={current.thumbnail}
            autoPlay
            muted
            controls
            playsInline
            onEnded={goNext}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {current.title && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-[80%] rounded-full bg-black/55 px-4 py-2 text-xs font-bold text-white backdrop-blur">
          {current.title}
        </div>
      )}

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous video"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next video"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-2 backdrop-blur">
            {items.map((item, itemIndex) => (
              <button
                key={item.url || itemIndex}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`Show video ${itemIndex + 1}`}
                className={`h-2 rounded-full transition-all ${itemIndex === index ? 'w-6 bg-[#ffb612]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const heroPattern = {
  backgroundImage:
    'radial-gradient(circle at 15% 15%, rgba(255,182,18,0.12), transparent 28%), radial-gradient(circle at 85% 78%, rgba(30,210,160,0.13), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.025) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.025) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.025) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.025) 25%, #004b3e 25%)',
  backgroundPosition: '0 0, 0 0, 18px 0, 18px 0, 0 0, 0 0',
  backgroundSize: 'auto, auto, 36px 36px, 36px 36px, 36px 36px, 36px 36px',
};

export const LandingPage: React.FC = () => {
  const [content, setContent] = useState<LandingPageContent>(defaultLandingPageContent);
  const [preview, setPreview] = useState(false);
  const [showAllMemberships, setShowAllMemberships] = useState(false);

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    setPreview(isPreview);
    const request = isPreview ? LandingPageCmsService.getPreview() : LandingPageCmsService.getPublic();
    request.then(setContent).catch(() => setContent(defaultLandingPageContent));
  }, []);

  useEffect(() => {
    const title = content.seo.title || 'AZAAM International Medics Network';
    const description = content.seo.description || '';
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el && value) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    if (content.seo.shareImage) setMeta('meta[property="og:image"]', 'content', content.seo.shareImage);
  }, [content.seo]);

  const heroVideoEmbed = content.hero.backgroundVideo ? youtubeEmbed(content.hero.backgroundVideo) : '';
  const memberships = content.memberships.filter((item) => item?.name?.trim() && item?.logo?.trim());
  const membershipCard = (item: LandingPageContent['memberships'][number], index: number, duplicate = false) => {
    const isMakerere = item.logo === '/memberships/makerere.png';
    const isKampala = item.logo === '/memberships/kampala.png';
    const card = <div className={`flex h-40 w-40 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-[#303b8e] sm:h-48 sm:w-44 ${isMakerere || isKampala ? 'p-2' : 'p-5'}`}>
      {isMakerere ? (
        <span className="block h-28 w-36 overflow-hidden" role="img" aria-label={item.name}><img src={item.logo} alt="" loading="eager" className="h-full max-w-none" /></span>
      ) : (
        <img src={item.logo} alt={duplicate ? '' : item.name} loading="eager" className={`max-h-full max-w-full object-contain ${isKampala ? 'scale-105' : ''}`} />
      )}
    </div>;
    return <div key={`${duplicate ? 'copy' : 'original'}-${index}`} className="shrink-0" title={duplicate ? undefined : item.name}>
      {!duplicate && /^https?:\/\//i.test(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${item.name}`}>{card}</a> : card}
    </div>;
  };

  return (
    <div id="home" className="bg-[#003d33] text-white">
      {preview && (
        <div className="sticky top-[78px] z-40 bg-[#ffb612] px-4 py-2 text-center text-xs font-black text-[#003d33] shadow">
          SUPER ADMIN PREVIEW — unpublished draft
        </div>
      )}

      <section className="relative isolate overflow-hidden" style={heroPattern}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#173f2f]/50 via-[#003d33]/35 to-[#007256]/45" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 md:pt-20 lg:px-8 lg:pb-16">
          <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb612]/35 bg-[#ffb612]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffd55b]">
                <Sparkles className="h-3.5 w-3.5" /> {content.hero.eyebrow || 'Trusted by medical schools & hospitals worldwide'}
              </div>

              <h1 className="mt-6 text-[48px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[64px] lg:text-[72px]" style={headingFont}>
                Complete
                <span className="block text-[#ffbf2f]">Clinical Training &</span>
                <span className="block text-[#ffbf2f]">Medical Placement</span>
                <span className="block text-white">Platform</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-emerald-50/85 sm:text-lg">
                {content.hero.subtitle || 'Manage clinical placements, student nominations, visas, hospital coordination, attendance, certificates and training operations — all in one powerful platform.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <SmartLink to={content.hero.primaryButtonUrl} className="inline-flex items-center gap-2 rounded-full bg-[#ffb612] px-7 py-3.5 text-sm font-black text-[#063b31] shadow-lg shadow-amber-500/20 transition hover:bg-[#ffc83d]">
                  {content.hero.primaryButtonText || 'Get Started'} <ArrowRight className="h-4 w-4" />
                </SmartLink>
                <a href={content.videos.length > 0 ? '#videos' : '#programs'} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08]">
                  <Play className="h-4 w-4" /> {content.videos.length > 0 ? 'Watch Demo' : 'Explore Programs'}
                </a>
              </div>

              <div className="mt-7 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['#ffb612','#3fd0b6','#4bb6ff','#f270b5'].map((color, index) => (
                    <span key={index} className="h-8 w-8 rounded-full border-2 border-[#00483b]" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div>
                  <div className="text-sm tracking-[0.18em] text-[#ffbf2f]">★★★★★</div>
                  <p className="text-xs text-emerald-50/65">Trusted by universities, hospitals and trainees</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[590px]">
              <div className="absolute -inset-10 rounded-full bg-emerald-300/10 blur-3xl" />
              <div className="relative rounded-[28px] border border-white/20 bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
                {content.videos.length > 0 ? (
                  <HeroVideoCarousel videos={content.videos} />
                ) : (
                  <div className="rounded-[22px] border border-white/10 bg-[#174f42]/90 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffb612] text-[#003d33]"><Stethoscope className="h-6 w-6" /></div>
                        <div>
                          <h2 className="font-black text-white">AZAAM Medics</h2>
                          <p className="text-xs text-emerald-50/60">Clinical Training Dashboard</p>
                        </div>
                      </div>
                      <div className="flex -space-x-2">
                        <span className="h-7 w-7 rounded-full border-2 border-[#174f42] bg-[#ffb612]" />
                        <span className="h-7 w-7 rounded-full border-2 border-[#174f42] bg-[#39d0b2]" />
                        <span className="h-7 w-7 rounded-full border-2 border-[#174f42] bg-[#45baff]" />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { icon: Users, label: 'Total Trainees', value: '1,248', accent: '+12%' },
                        { icon: Building2, label: 'Active Placements', value: '386', accent: '+8%' },
                        { icon: FileCheck2, label: 'Visa Pipeline', value: '214', accent: '+24%' },
                        { icon: Award, label: 'Certificates Issued', value: '892', accent: '+18%' },
                      ].map(({ icon: Icon, label, value, accent }) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                          <Icon className="h-5 w-5 text-[#45d2aa]" />
                          <p className="mt-3 text-[10px] font-bold text-emerald-50/60">{label}</p>
                          <div className="mt-1 flex items-end gap-2"><span className="text-xl font-black text-white">{value}</span><span className="pb-0.5 text-[9px] font-bold text-[#54d9a7]">{accent}</span></div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white">Placements Trend</p>
                          <p className="mt-1 text-[10px] text-emerald-50/50">Last 6 months</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] text-emerald-50/60">Live</span>
                      </div>
                      <div className="mt-5 flex h-28 items-end gap-3">
                        {[28,42,55,66,70,80,95].map((height, index) => (
                          <div key={index} className="flex flex-1 flex-col items-center gap-2">
                            <div className="w-full rounded-t-md bg-[#45c894]/70" style={{ height: `${height}%` }} />
                            <span className="text-[9px] text-emerald-50/45">{['Jan','Feb','Mar','Apr','May','Jun','Jul'][index]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute -left-5 top-[42%] hidden rounded-2xl border border-white/15 bg-[#06473a]/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#ffb612] text-xs font-black text-white">92%</div>
                  <div><p className="text-[10px] text-emerald-50/55">Placement</p><p className="text-sm font-black text-white">Success Rate</p></div>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-3 right-[-6px] hidden rounded-2xl border border-white/15 bg-[#06473a]/95 px-4 py-3 shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb612] text-[#003d33]"><Award className="h-5 w-5" /></div>
                <div><p className="text-[10px] text-emerald-50/55">Certificates</p><p className="text-sm font-black text-white">Auto-generated & Verified</p></div>
                <CheckCircle2 className="h-5 w-5 text-[#4be0a7]" />
              </div>
            </div>
          </div>

          {content.highlights.length > 0 && (
            <div className="mt-16 overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.08] shadow-xl backdrop-blur-xl">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {content.highlights.slice(0,4).map((item, index) => (
                  <div key={`${item.label}-${index}`} className="border-white/10 px-6 py-6 text-center sm:border-r last:border-r-0">
                    <div className="text-3xl font-black text-[#ffbf2f]" style={headingFont}>{item.value}</div>
                    <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-50/60">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="bg-[#f7f8fa] px-4 py-20 text-[#303b89] sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Our Strategy &amp; Values</h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#00aa60]" />
          <div className="mt-12 grid gap-5 md:grid-cols-3 md:items-stretch lg:gap-7">
            <article className="rounded-[4px] bg-[#303b8e] p-7 text-white shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded bg-white/10"><Telescope className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">Our Vision</h3>
              <p className="mt-4 text-base leading-7 text-white/90">{content.strategy.vision}</p>
            </article>
            <article className="rounded-[4px] bg-white p-7 shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center text-[#3949a3]"><Target className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">Our Mission</h3>
              <ul className="mt-4 space-y-4">
                {content.strategy.mission.filter(Boolean).map((item, index) => <li key={index} className="flex gap-3 text-base leading-7"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#00a960]" aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
            </article>
            <article className="rounded-[4px] bg-[#00a653] p-7 text-white shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded bg-white/10"><Diamond className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">Core Values</h3>
              <ul className="mt-4 space-y-3">
                {content.strategy.values.filter(Boolean).map((value, index) => <li key={index} className="rounded bg-white/10 px-3 py-2.5 text-base font-semibold">•&nbsp; {value}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="aimn-highlights-title" className="bg-[#303b8e] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 id="aimn-highlights-title" className="text-center text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">AIMN Highlights</h2>
          <div className="mt-10 grid grid-cols-2 border-l border-t border-white/15 md:grid-cols-3">
            {content.aimnHighlights.slice(0, 4).map((item, index) => {
              const Icon = aimnHighlightIcons[index];
              return <div key={index} className="flex min-h-40 flex-col items-center justify-center border-b border-r border-white/15 px-3 py-6 text-center sm:min-h-44">
                <Icon className="mb-3 h-8 w-8 text-white" strokeWidth={1.6} aria-hidden="true" />
                <p className="max-w-full break-words text-xl font-semibold leading-tight sm:text-3xl">{item.value.endsWith('+') ? <>{item.value.slice(0, -1)}<span className="text-[#00b968]">+</span></> : item.value}</p>
                <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-white/65 sm:text-sm">{item.label}</p>
              </div>;
            })}
            <div className="col-span-2 flex min-h-40 flex-col items-center justify-center border-b border-r border-white/15 bg-white px-4 text-center text-[#303b8e] md:col-span-1 md:min-h-44">
              <strong className="text-4xl font-black tracking-tight sm:text-5xl">AIMN</strong>
              <span className="mt-1 text-xs font-bold uppercase tracking-wider">AZAAM Medics Network</span>
            </div>
            {content.aimnHighlights.slice(4, 8).map((item, offset) => {
              const Icon = aimnHighlightIcons[offset + 4];
              return <div key={offset + 4} className="flex min-h-40 flex-col items-center justify-center border-b border-r border-white/15 px-3 py-6 text-center sm:min-h-44">
                <Icon className="mb-3 h-8 w-8 text-white" strokeWidth={1.6} aria-hidden="true" />
                <p className="max-w-full break-words text-xl font-semibold leading-tight sm:text-3xl">{item.value.endsWith('+') ? <>{item.value.slice(0, -1)}<span className="text-[#00b968]">+</span></> : item.value}</p>
                <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-white/65 sm:text-sm">{item.label}</p>
              </div>;
            })}
          </div>
        </div>
      </section>

      <section id="programs" className="bg-[#003d33] py-20" style={heroPattern}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffbf2f]"><GraduationCap className="h-4 w-4" /> Clinical Training</div>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl" style={headingFont}>Build experience across essential departments</h2>
            <p className="mt-4 text-sm leading-7 text-emerald-50/65">Structured rotations designed for practical learning, institutional coordination and supervised clinical exposure.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.programs.map((program, index) => (
              <article key={`${program.title}-${index}`} className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06] shadow-lg">
                <div className="h-48 overflow-hidden bg-[#0c5648]">
                  {program.image ? <img src={program.image} alt={program.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Stethoscope className="h-12 w-12 text-[#ffbf2f]" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-white">{program.title}</h3>
                  <SmartLink to={program.link || '/register'} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#ffbf2f]">Explore more <ArrowRight className="h-4 w-4" /></SmartLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {content.news.length > 0 && (
        <section id="news" className="bg-[#f6fbf8] py-20 text-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#008267]">Latest Updates</p>
                <h2 className="mt-2 text-4xl font-black text-[#073f35]" style={headingFont}>News from the AIMN network</h2>
              </div>
              <span className="text-sm font-bold text-[#008267]">View all updates →</span>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {content.news.map((item, index) => (
                <article key={`${item.title}-${index}`} className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  {item.image ? <img src={item.image} alt={item.title} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-emerald-50"><CalendarDays className="h-14 w-14 text-[#008267]/40" /></div>}
                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#008267]">{item.label}</p>
                    <h3 className="mt-2 text-xl font-black leading-7 text-[#073f35]" style={headingFont}>{item.title}</h3>
                    {item.summary && <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>}
                    <SmartLink to={item.link || '/login'} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#006d56]">Read more <ArrowRight className="h-4 w-4" /></SmartLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.gallery.length > 0 && (
        <section className="bg-white py-20 text-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#008267]"><ImageIcon className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-[0.18em]">Gallery</span></div>
            <h2 className="mt-3 text-4xl font-black text-[#073f35]" style={headingFont}>AIMN in action</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.gallery.map((item, index) => (
                <figure key={index} className="overflow-hidden rounded-[22px] border border-emerald-100 bg-[#f6fbf8]">
                  <img src={item.image} alt={item.title || 'AIMN gallery'} className="h-64 w-full object-cover" />
                  {(item.title || item.caption) && <figcaption className="p-4"><p className="font-black text-[#073f35]">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.caption}</p></figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.videos.length > 0 && (
        <section id="videos" className="bg-[#002f28] py-20" style={heroPattern}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#ffbf2f]"><PlayCircle className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-[0.18em]">Videos</span></div>
            <h2 className="mt-3 text-4xl font-black text-white" style={headingFont}>Stories, training and partnerships</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {content.videos.map((item, index) => {
                const embed = youtubeEmbed(item.url);
                return (
                  <article key={index} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05]">
                    <div className="aspect-video bg-black">{embed ? <iframe src={embed} title={item.title} className="h-full w-full" allowFullScreen /> : <video src={item.url} controls poster={item.thumbnail} className="h-full w-full object-cover" />}</div>
                    <div className="p-5"><h3 className="text-xl font-black text-white" style={headingFont}>{item.title}</h3><p className="mt-2 text-sm leading-6 text-emerald-50/60">{item.description}</p></div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="recognitions" aria-labelledby="recognitions-title" className="bg-white px-4 py-16 text-[#202020] sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#008267]">Institutional Recognition</p>
          <h2 id="recognitions-title" className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Our Official Recognitions &amp; Approvals</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Official institutional recognitions and approvals supporting our international medical education and clinical training activities.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Ministry of Foreign Affairs — Uganda', icon: Globe2 },
              { name: 'Ministry of Internal Affairs — Uganda', icon: ShieldCheck },
              { name: 'Ministry of Health — Uganda', icon: Stethoscope },
              { name: 'Ministry of Education & Sports — Uganda', icon: GraduationCap },
            ].map(({ name, icon: Icon }) => (
              <article key={name} className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm transition hover:border-[#008267]/40 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#008267]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-black leading-6 text-slate-900">{name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="network" aria-labelledby="memberships-title" className="bg-white px-4 pb-16 pt-10 text-[#202020] sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#008267]">Institutional Network</p>
          <h2 id="memberships-title" className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Our Partners</h2>
          {memberships.length > 0 ? (
            <>
              {showAllMemberships ? (
                <div className="mt-10 flex flex-wrap justify-center gap-4">{memberships.map((item, index) => membershipCard(item, index))}</div>
              ) : (
                <div className="aimn-membership-window mt-10 overflow-hidden" aria-label="Partner universities">
                  <div className="aimn-membership-track" style={{ animationDuration: `${Math.max(28, memberships.length * 4)}s` }}>
                    <div className="flex shrink-0 gap-4 pr-4">{memberships.map((item, index) => membershipCard(item, index))}</div>
                    <div className="flex shrink-0 gap-4 pr-4" aria-hidden="true">{memberships.map((item, index) => membershipCard(item, index, true))}</div>
                  </div>
                </div>
              )}
              {memberships.length > 6 && <button type="button" onClick={() => setShowAllMemberships((current) => !current)} className="mt-8 rounded bg-[#303b8e] px-7 py-2.5 text-sm font-bold text-white transition hover:bg-[#253174]">{showAllMemberships ? 'View less' : 'View more'}</button>}
            </>
          ) : <p className="mx-auto mt-10 max-w-xl rounded border border-slate-200 px-6 py-12 text-base text-slate-600">Our partners will be displayed here when confirmed.</p>}
        </div>
      </section>

      {content.hospitals.some((hospital) => hospital.name?.trim()) && (
        <section id="training-hospitals" aria-labelledby="training-hospitals-title" className="bg-[#303b8e] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-200">Clinical Training Network</p>
            <h2 id="training-hospitals-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Our Training Hospitals</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">Hospitals where students gain practical experience through supervised clinical training.</p>
            <div className="aimn-membership-window mt-10 overflow-hidden" aria-label="Training hospitals">
              <div
                className="aimn-membership-track"
                style={{ animationDuration: `${Math.max(36, content.hospitals.filter((hospital) => hospital.name?.trim()).length * 3.2)}s` }}
              >
                {[false, true].map((duplicate) => (
                  <div key={duplicate ? 'hospitals-copy' : 'hospitals-original'} className="flex shrink-0 gap-4 pr-4" aria-hidden={duplicate ? 'true' : undefined}>
                    {content.hospitals.filter((hospital) => hospital.name?.trim()).map((hospital, index) => (
                      <article
                        key={`${duplicate ? 'copy' : 'original'}-${hospital.name}-${index}`}
                        className="flex min-h-44 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-4 shadow-sm sm:w-44"
                      >
                        <img
                          src={hospital.image || '/memberships/uganda-hospital-emblem.png'}
                          alt={duplicate ? '' : hospital.name}
                          loading="lazy"
                          className="h-20 w-20 object-contain"
                        />
                        <h3 className="text-center text-xs font-bold leading-snug text-[#073f35]">{hospital.name}</h3>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {(content.contact.email || content.contact.phone || content.contact.address) && (
        <section className="border-t border-white/15 bg-[#303b8e]">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm sm:grid-cols-3 sm:px-6 lg:px-8">
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/40">Email</p><p className="mt-1 font-bold text-white">{content.contact.email || '—'}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/40">Phone</p><p className="mt-1 font-bold text-white">{content.contact.phone || '—'}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/40">Address</p><p className="mt-1 font-bold text-white">{content.contact.address || '—'}</p></div>
          </div>
        </section>
      )}
    </div>
  );
};
