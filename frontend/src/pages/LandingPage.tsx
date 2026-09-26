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
  const [showAllHospitals, setShowAllHospitals] = useState(false);
  const [showAllRecognitions, setShowAllRecognitions] = useState(false);
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);

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

  const heroShowcaseUrl = content.hero.backgroundVideo || content.videos[0]?.url || '';
  const heroShowcaseEmbed = heroShowcaseUrl ? youtubeEmbed(heroShowcaseUrl) : '';
  const memberships = content.memberships.filter((item) => item?.name?.trim() && item?.logo?.trim());
  const hospitals = content.hospitals.filter((hospital) => hospital.name?.trim());
  const recognitions = content.recognitions.filter((item) => item.name?.trim());
  const recognitionIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('health') || lower.includes('medical')) return Stethoscope;
    if (lower.includes('education') || lower.includes('universit')) return GraduationCap;
    if (lower.includes('foreign')) return Globe2;
    return ShieldCheck;
  };
  const heroNetworkStats = [
    { label: content.hero.statsLabels.universities, value: memberships.length, icon: GraduationCap },
    { label: content.hero.statsLabels.hospitals, value: hospitals.length, icon: Building2 },
    { label: content.hero.statsLabels.recognitions, value: recognitions.length, icon: ShieldCheck },
    { label: content.hero.statsLabels.programs, value: content.programs.filter((program) => program.title?.trim()).length, icon: Stethoscope },
  ];

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

      <section className="relative isolate overflow-hidden bg-[#303b8e]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_82%_70%,rgba(0,185,104,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 md:pt-20 lg:px-8 lg:pb-16">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb612]/35 bg-[#ffb612]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#ffd55b]">
                <Sparkles className="h-3.5 w-3.5" /> {content.hero.eyebrow || 'Trusted by medical schools & hospitals worldwide'}
              </div>

              <h1 className="mt-6 text-[48px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[64px] lg:text-[72px]" style={headingFont}>
                {content.hero.titleLines.map((line, index) => (
                  <span key={index} className={`block ${index > 0 && index < content.hero.titleLines.length - 1 ? 'text-[#ffbf2f]' : 'text-white'}`}>{line}</span>
                ))}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                {content.hero.subtitle || 'Manage clinical placements, student nominations, visas, hospital coordination, attendance, certificates and training operations — all in one powerful platform.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <SmartLink to={content.hero.primaryButtonUrl} className="inline-flex items-center gap-2 rounded-full bg-[#ffb612] px-7 py-3.5 text-sm font-black text-[#063b31] shadow-lg shadow-amber-500/20 transition hover:bg-[#ffc83d]">
                  {content.hero.primaryButtonText || 'Get Started'} <ArrowRight className="h-4 w-4" />
                </SmartLink>
                <a
                  href={content.hero.secondaryButtonUrl || (heroShowcaseUrl ? '#organization-video' : '#programs')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.05] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.10]"
                >
                  <Play className="h-4 w-4" /> {content.hero.secondaryButtonText || (heroShowcaseUrl ? 'Watch Video' : 'Explore Programs')}
                </a>
              </div>

              <div className="mt-7 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['#ffb612','#3fd0b6','#4bb6ff','#f270b5'].map((color, index) => (
                    <span key={index} className="h-8 w-8 rounded-full border-2 border-[#303b8e]" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div>
                  <div className="text-sm tracking-[0.18em] text-[#ffbf2f]">★★★★★</div>
                  <p className="text-xs text-white/65">{content.hero.trustText}</p>
                </div>
              </div>
            </div>

            <div id="organization-video" className="relative mx-auto w-full max-w-[620px] scroll-mt-28">
              <div className="absolute -inset-8 rounded-[36px] bg-white/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.08] shadow-2xl shadow-black/25 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffbf2f]">{content.sectionHeadings.heroVideoEyebrow}</p>
                    <h2 className="mt-1 truncate text-base font-black text-white sm:text-lg">{content.sectionHeadings.heroVideoTitle}</h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffb612]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#45d2aa]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#4bb6ff]" />
                  </div>
                </div>

                <div className="aspect-video w-full bg-[#18236f]">
                  {heroShowcaseEmbed ? (
                    <iframe
                      src={`${heroShowcaseEmbed}${heroShowcaseEmbed.includes('?') ? '&' : '?'}rel=0&modestbranding=1&playsinline=1`}
                      title="AIMN organization impact video"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : heroShowcaseUrl ? (
                    <video src={heroShowcaseUrl} controls playsInline className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffb612] text-[#303b8e] shadow-lg">
                        <Play className="ml-1 h-7 w-7" fill="currentColor" />
                      </div>
                      <p className="mt-5 text-lg font-black text-white">Organization video</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">Add a YouTube or MP4 link from Website Management → Hero media. The video will play directly inside this page.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 px-5 py-4 sm:px-6">
                  <p className="text-sm leading-6 text-white/70">
                    {content.sectionHeadings.heroVideoDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.08] shadow-xl backdrop-blur-xl">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {heroNetworkStats.map(({ label, value, icon: Icon }, index) => (
                <div
                  key={label}
                  className={`flex min-h-28 flex-col items-center justify-center px-4 py-5 text-center sm:min-h-32 sm:px-6 sm:py-6 ${index % 2 === 0 ? 'border-r border-white/10 lg:border-r' : ''} ${index < 2 ? 'border-b border-white/10 lg:border-b-0' : ''} ${index > 0 ? 'lg:border-l lg:border-white/10' : ''}`}
                >
                  <Icon className="mb-2 h-5 w-5 text-white/70 sm:h-6 sm:w-6" strokeWidth={1.8} aria-hidden="true" />
                  <div className="text-3xl font-black text-[#ffbf2f] sm:text-4xl" style={headingFont}>
                    {String(value).padStart(2, '0')}
                  </div>
                  <div className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/65 sm:text-[10px] sm:tracking-[0.18em]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#f7f8fa] px-4 py-20 text-[#303b89] sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{content.sectionHeadings.strategyTitle}</h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#00aa60]" />
          <div className="mt-12 grid gap-5 md:grid-cols-3 md:items-stretch lg:gap-7">
            <article className="rounded-[4px] bg-[#303b8e] p-7 text-white shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded bg-white/10"><Telescope className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">{content.sectionHeadings.visionTitle}</h3>
              <p className="mt-4 text-base leading-7 text-white/90">{content.strategy.vision}</p>
            </article>
            <article className="rounded-[4px] bg-white p-7 shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center text-[#3949a3]"><Target className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">{content.sectionHeadings.missionTitle}</h3>
              <ul className="mt-4 space-y-4">
                {content.strategy.mission.filter(Boolean).map((item, index) => <li key={index} className="flex gap-3 text-base leading-7"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#00a960]" aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
            </article>
            <article className="rounded-[4px] bg-[#00a653] p-7 text-white shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded bg-white/10"><Diamond className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">{content.sectionHeadings.valuesTitle}</h3>
              <ul className="mt-4 space-y-3">
                {content.strategy.values.filter(Boolean).map((value, index) => <li key={index} className="rounded bg-white/10 px-3 py-2.5 text-base font-semibold">•&nbsp; {value}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="aimn-highlights-title" className="bg-[#303b8e] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 id="aimn-highlights-title" className="text-center text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">{content.sectionHeadings.highlightsTitle}</h2>
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
              <strong className="text-4xl font-black tracking-tight sm:text-5xl">{content.sectionHeadings.highlightsCenterTitle}</strong>
              <span className="mt-1 text-xs font-bold uppercase tracking-wider">{content.sectionHeadings.highlightsCenterSubtitle}</span>
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

      <section id="programs" className="bg-[#00a653] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffbf2f]"><GraduationCap className="h-4 w-4" /> {content.sectionHeadings.programsEyebrow}</div>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl" style={headingFont}>{content.sectionHeadings.programsTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-emerald-50/65">{content.sectionHeadings.programsDescription}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.programs.map((program, index) => (
              <article key={`${program.title}-${index}`} className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.06] shadow-lg">
                <div className="h-48 overflow-hidden bg-[#0c5648]">
                  {program.image ? <img src={program.image} alt={program.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Stethoscope className="h-12 w-12 text-[#ffbf2f]" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-white">{program.title}</h3>
                  <SmartLink to={program.link || '/register'} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#ffbf2f]">{content.sectionHeadings.programButtonLabel} <ArrowRight className="h-4 w-4" /></SmartLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" aria-labelledby="testimonials-title" className="bg-[#303b8e] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">{content.sectionHeadings.testimonialsEyebrow}</p>
            <h2 id="testimonials-title" className="mt-3 text-3xl font-black text-white sm:text-4xl" style={headingFont}>{content.sectionHeadings.testimonialsTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">{content.sectionHeadings.testimonialsDescription}</p>
          </div>

          {showAllTestimonials ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {content.testimonials.map((item, index) => (
                <article
                  key={`testimonial-grid-${index}`}
                  className="group overflow-hidden rounded-[22px] border border-white/15 bg-white text-slate-800 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black leading-tight text-[#073f35]">{item.name}</h3>
                    <p className="mt-1 text-sm font-bold text-[#303b8e]">{item.role}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.organization}</p>
                    <div className="mt-4 text-sm tracking-[0.14em] text-[#ffb612]" aria-label={`${item.rating || '5'} out of 5 stars`}>{'★'.repeat(Math.max(1, Math.min(5, Number(item.rating) || 5)))}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">“{item.quote}”</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="aimn-testimonial-window mt-10 overflow-hidden" aria-label="Partner testimonials">
              <div className="aimn-testimonial-track">
                {[false, true].map((duplicate) => (
                  <div key={duplicate ? 'testimonials-copy' : 'testimonials-original'} className="flex shrink-0 gap-5 pr-5" aria-hidden={duplicate ? 'true' : undefined}>
                    {content.testimonials.map((item, index) => (
                      <article
                        key={`${duplicate ? 'copy' : 'original'}-${index}`}
                        className="group w-[82vw] max-w-[320px] shrink-0 overflow-hidden rounded-[22px] border border-white/15 bg-white text-left text-slate-800 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-[320px] lg:w-[340px]"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                          <img src={item.image} alt={duplicate ? '' : item.name} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-black leading-tight text-[#073f35]">{item.name}</h3>
                          <p className="mt-1 text-sm font-bold text-[#303b8e]">{item.role}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.organization}</p>
                          <div className="mt-4 text-sm tracking-[0.14em] text-[#ffb612]" aria-label={`${item.rating || '5'} out of 5 stars`}>{'★'.repeat(Math.max(1, Math.min(5, Number(item.rating) || 5)))}</div>
                          <p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-600">“{item.quote}”</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAllTestimonials((current) => !current)}
              className="rounded bg-white px-7 py-2.5 text-sm font-bold text-[#303b8e] transition hover:bg-slate-100"
            >
              {showAllTestimonials ? content.sectionHeadings.viewLessLabel : content.sectionHeadings.viewMoreLabel}
            </button>
          </div>
        </div>
      </section>

      {content.gallery.length > 0 && (
        <section className="bg-white py-20 text-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#008267]"><ImageIcon className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-[0.18em]">{content.sectionHeadings.galleryEyebrow}</span></div>
            <h2 className="mt-3 text-4xl font-black text-[#073f35]" style={headingFont}>{content.sectionHeadings.galleryTitle}</h2>
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
            <div className="flex items-center gap-2 text-[#ffbf2f]"><PlayCircle className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-[0.18em]">{content.sectionHeadings.videosEyebrow}</span></div>
            <h2 className="mt-3 text-4xl font-black text-white" style={headingFont}>{content.sectionHeadings.videosTitle}</h2>
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

      <section id="network" aria-labelledby="memberships-title" className="bg-white px-4 pb-16 pt-10 text-[#202020] sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#008267]">{content.sectionHeadings.partnersEyebrow}</p>
          <h2 id="memberships-title" className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{content.sectionHeadings.partnersTitle}</h2>
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
              {memberships.length > 6 && <button type="button" onClick={() => setShowAllMemberships((current) => !current)} className="mt-8 rounded bg-[#303b8e] px-7 py-2.5 text-sm font-bold text-white transition hover:bg-[#253174]">{showAllMemberships ? content.sectionHeadings.viewLessLabel : content.sectionHeadings.viewMoreLabel}</button>}
            </>
          ) : <p className="mx-auto mt-10 max-w-xl rounded border border-slate-200 px-6 py-12 text-base text-slate-600">Our partners will be displayed here when confirmed.</p>}
        </div>
      </section>

      {hospitals.length > 0 && (
        <section id="training-hospitals" aria-labelledby="training-hospitals-title" className="bg-[#303b8e] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-200">{content.sectionHeadings.hospitalsEyebrow}</p>
            <h2 id="training-hospitals-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{content.sectionHeadings.hospitalsTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{content.sectionHeadings.hospitalsDescription}</p>

            {showAllHospitals ? (
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {hospitals.map((hospital, index) => (
                  <article key={`${hospital.name}-${index}`} className="flex min-h-44 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-4 shadow-sm sm:w-44">
                    <img src={hospital.image || '/memberships/uganda-hospital-emblem.png'} alt={hospital.name} loading="lazy" className="h-20 w-20 object-contain" />
                    <h3 className="text-center text-xs font-bold leading-snug text-[#073f35]">{hospital.name}</h3>
                  </article>
                ))}
              </div>
            ) : (
              <div className="aimn-membership-window mt-10 overflow-hidden" aria-label="Training hospitals">
                <div
                  className="aimn-membership-track"
                  style={{ animationDuration: `${Math.max(36, hospitals.length * 3.2)}s` }}
                >
                  <div className="flex shrink-0 gap-4 pr-4">
                    {hospitals.map((hospital, index) => (
                      <article key={`original-${hospital.name}-${index}`} className="flex min-h-44 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-4 shadow-sm sm:w-44">
                        <img src={hospital.image || '/memberships/uganda-hospital-emblem.png'} alt={hospital.name} loading="lazy" className="h-20 w-20 object-contain" />
                        <h3 className="text-center text-xs font-bold leading-snug text-[#073f35]">{hospital.name}</h3>
                      </article>
                    ))}
                  </div>
                  <div className="flex shrink-0 gap-4 pr-4" aria-hidden="true">
                    {hospitals.map((hospital, index) => (
                      <article key={`copy-${hospital.name}-${index}`} className="flex min-h-44 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-4 shadow-sm sm:w-44">
                        <img src={hospital.image || '/memberships/uganda-hospital-emblem.png'} alt="" loading="lazy" className="h-20 w-20 object-contain" />
                        <h3 className="text-center text-xs font-bold leading-snug text-[#073f35]">{hospital.name}</h3>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hospitals.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllHospitals((current) => !current)}
                className="mt-8 rounded bg-white px-7 py-2.5 text-sm font-bold text-[#303b8e] transition hover:bg-slate-100"
              >
                {showAllHospitals ? content.sectionHeadings.viewLessLabel : content.sectionHeadings.viewMoreLabel}
              </button>
            )}
          </div>
        </section>
      )}

      <section id="recognitions" aria-labelledby="recognitions-title" className="bg-white px-4 py-16 text-[#202020] sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#008267]">{content.sectionHeadings.recognitionsEyebrow}</p>
          <h2 id="recognitions-title" className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{content.sectionHeadings.recognitionsTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {content.sectionHeadings.recognitionsDescription}
          </p>

          {showAllRecognitions ? (
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {recognitions.map(({ name, logo, url }) => {
                const Icon = recognitionIcon(name);
                return (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-40 w-40 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#008267]/40 hover:shadow-md sm:w-44"
                >
                  <div className="flex h-20 w-20 items-center justify-center">
                    <img
                      src={logo}
                      alt={name}
                      loading="lazy"
                      className="h-20 w-20 object-contain"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        event.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#008267]">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-center text-xs font-bold leading-snug text-slate-900">{name}</h3>
                </a>
              )})}
            </div>
          ) : (
            <div className="aimn-membership-window mt-10 overflow-hidden" aria-label="Official recognitions">
              <div
                className="aimn-membership-track"
                style={{ animationDuration: `${Math.max(36, recognitions.length * 3.4)}s` }}
              >
                {[false, true].map((duplicate) => (
                  <div
                    key={duplicate ? 'recognitions-copy' : 'recognitions-original'}
                    className="flex shrink-0 gap-4 pr-4"
                    aria-hidden={duplicate ? 'true' : undefined}
                  >
                    {recognitions.map(({ name, logo, url }, index) => {
                      const Icon = recognitionIcon(name);
                      return (
                      <a
                        key={`${duplicate ? 'copy' : 'original'}-${name}-${index}`}
                        href={duplicate ? undefined : url}
                        target={duplicate ? undefined : '_blank'}
                        rel={duplicate ? undefined : 'noopener noreferrer'}
                        tabIndex={duplicate ? -1 : undefined}
                        className="flex min-h-40 w-40 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#008267]/40 hover:shadow-md sm:w-44"
                      >
                        <div className="flex h-20 w-20 items-center justify-center">
                          <img
                            src={logo}
                            alt={duplicate ? '' : name}
                            loading="lazy"
                            className="h-20 w-20 object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                              event.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#008267]">
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                        <h3 className="mt-4 text-center text-xs font-bold leading-snug text-slate-900">{name}</h3>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recognitions.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllRecognitions((current) => !current)}
              className="mt-8 rounded bg-[#303b8e] px-7 py-2.5 text-sm font-bold text-white transition hover:bg-[#253174]"
            >
              {showAllRecognitions ? content.sectionHeadings.viewLessLabel : content.sectionHeadings.viewMoreLabel}
            </button>
          )}
        </div>
      </section>

      {(content.contact.email || content.contact.phone || content.contact.address) && (
        <section className="border-t border-white/15 bg-[#303b8e]">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm sm:grid-cols-3 sm:px-6 lg:px-8">
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/40">{content.sectionHeadings.contactEmailLabel}</p><p className="mt-1 font-bold text-white">{content.contact.email || '—'}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/40">{content.sectionHeadings.contactPhoneLabel}</p><p className="mt-1 font-bold text-white">{content.contact.phone || '—'}</p></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/40">{content.sectionHeadings.contactAddressLabel}</p><p className="mt-1 font-bold text-white">{content.contact.address || '—'}</p></div>
          </div>
        </section>
      )}
    </div>
  );
};
