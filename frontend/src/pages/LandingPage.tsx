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
const TESTIMONIALS = [
  { name: 'Dr. [Name 01]', role: 'Dean of Medicine', organization: 'Jamhuriya University', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85', quote: 'AIMN provides a dependable placement process and clear institutional coordination from nomination through clinical training.' },
  { name: 'Dr. [Name 02]', role: 'Clinical Coordinator', organization: 'Benadir University', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85', quote: 'The structured workflow makes student placements easier to manage and gives institutions better visibility throughout training.' },
  { name: 'Prof. [Name 03]', role: 'Faculty Representative', organization: 'Islamic University in Uganda', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85', quote: 'AIMN strengthens collaboration between universities and hospitals while keeping clinical training practical and well organized.' },
  { name: 'Dr. [Name 04]', role: 'Academic Director', organization: 'Kampala International University', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85', quote: 'Placement reliability and responsive coordination are major strengths of the AIMN model.' },
  { name: 'Dr. [Name 05]', role: 'Dean of Health Sciences', organization: 'Busitema University', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85', quote: 'The platform supports consistent communication, supervised rotations and a smoother experience for students and institutions.' },
  { name: 'Prof. [Name 06]', role: 'Medical Education Lead', organization: 'Makerere University', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=85', quote: 'AIMN brings structure to clinical attachments and helps partners coordinate placements efficiently.' },
  { name: 'Dr. [Name 07]', role: 'University Liaison', organization: 'Mogadishu University', image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=700&q=85', quote: 'The nomination and placement journey is clear, traceable and easier for academic teams to follow.' },
  { name: 'Dr. [Name 08]', role: 'Clinical Training Lead', organization: 'Zamzam University', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=85', quote: 'Students benefit from organized clinical exposure while institutions benefit from reliable coordination and documentation.' },
  { name: 'Prof. [Name 09]', role: 'Dean of Medicine', organization: 'Partner University', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=85', quote: 'AIMN creates a practical bridge between academic preparation and supervised hospital-based learning.' },
  { name: 'Dr. [Name 10]', role: 'Hospital Training Coordinator', organization: 'Regional Referral Hospital', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=85', quote: 'Hospital coordination is more efficient when student lists, rotations and communication are managed through one workflow.' },
  { name: 'Dr. [Name 11]', role: 'Clinical Supervisor', organization: 'Teaching Hospital', image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=700&q=85', quote: 'The structured approach supports supervision, accountability and a better clinical training experience.' },
  { name: 'Prof. [Name 12]', role: 'Institutional Partnership Lead', organization: 'Partner Institution', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=85', quote: 'AIMN makes cross-institutional collaboration easier through clear processes and consistent follow-up.' },
  { name: 'Dr. [Name 13]', role: 'Student Affairs Director', organization: 'Medical University', image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c6?auto=format&fit=crop&w=700&q=85', quote: 'The platform improves visibility of placement progress and gives our team confidence in the coordination process.' },
  { name: 'Dr. [Name 14]', role: 'Training Programme Lead', organization: 'Clinical Partner', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=85', quote: 'AIMN combines dependable placement support with a strong focus on quality clinical learning.' },
  { name: 'Prof. [Name 15]', role: 'Academic Partnership Director', organization: 'International Partner', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=700&q=85', quote: 'The partnership workflow is organized, responsive and designed around the needs of universities, hospitals and trainees.' },
];

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
  const recognitions = [
    { name: 'Ministry of Foreign Affairs — Uganda', icon: Globe2, logo: '/memberships/uganda-hospital-emblem.png', url: 'https://mofa.go.ug/' },
    { name: 'Ministry of Internal Affairs — Uganda', icon: ShieldCheck, logo: '/memberships/uganda-hospital-emblem.png', url: 'https://www.mia.go.ug/' },
    { name: 'Ministry of Health — Uganda', icon: Stethoscope, logo: '/memberships/uganda-hospital-emblem.png', url: 'https://health.go.ug/about-moh/' },
    { name: 'Ministry of Education and Sports — Uganda', icon: GraduationCap, logo: 'https://www.education.go.ug/wp-content/uploads/2019/07/NewLogo2.png', url: 'https://www.education.go.ug/' },
    { name: 'Ministry of Health & Human Services — Somalia', icon: Stethoscope, logo: 'data:image/webp;base64,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', url: 'https://moh.gov.so/so/' },
    { name: 'Ministry of Foreign Affairs & International Cooperation — Somalia', icon: Globe2, logo: 'https://web.mfa.gov.so/favicon.ico', url: 'https://web.mfa.gov.so/' },
    { name: 'Association of Somali Universities (ASU)', icon: GraduationCap, logo: 'https://asu.org.so/favicon.ico', url: 'https://asu.org.so/' },
    { name: 'Somali Medical Association', icon: Stethoscope, logo: 'https://www.facebook.com/favicon.ico', url: 'https://www.facebook.com/SomaliMedicalAssoc/about/' },
  ];
  const heroNetworkStats = [
    { label: 'Partner Universities', value: memberships.length, icon: GraduationCap },
    { label: 'Training Hospitals', value: hospitals.length, icon: Building2 },
    { label: 'Official Recognitions', value: recognitions.length, icon: ShieldCheck },
    { label: 'Clinical Training Programs', value: content.programs.filter((program) => program.title?.trim()).length, icon: Stethoscope },
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
                Complete
                <span className="block text-[#ffbf2f]">Clinical Training &</span>
                <span className="block text-[#ffbf2f]">Medical Placement</span>
                <span className="block text-white">Platform</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                {content.hero.subtitle || 'Manage clinical placements, student nominations, visas, hospital coordination, attendance, certificates and training operations — all in one powerful platform.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <SmartLink to={content.hero.primaryButtonUrl} className="inline-flex items-center gap-2 rounded-full bg-[#ffb612] px-7 py-3.5 text-sm font-black text-[#063b31] shadow-lg shadow-amber-500/20 transition hover:bg-[#ffc83d]">
                  {content.hero.primaryButtonText || 'Get Started'} <ArrowRight className="h-4 w-4" />
                </SmartLink>
                <a
                  href={heroShowcaseUrl ? '#organization-video' : '#programs'}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.05] px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.10]"
                >
                  <Play className="h-4 w-4" /> {heroShowcaseUrl ? 'Watch Video' : 'Explore Programs'}
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
                  <p className="text-xs text-white/65">Trusted by universities, hospitals and trainees</p>
                </div>
              </div>
            </div>

            <div id="organization-video" className="relative mx-auto w-full max-w-[620px] scroll-mt-28">
              <div className="absolute -inset-8 rounded-[36px] bg-white/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.08] shadow-2xl shadow-black/25 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffbf2f]">AIMN in Action</p>
                    <h2 className="mt-1 truncate text-base font-black text-white sm:text-lg">Organization Impact &amp; Clinical Training</h2>
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
                    Watch AIMN’s institutional partnerships, placement coordination and supervised clinical training activities without leaving the website.
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

      <section id="programs" className="bg-[#00a653] py-20">
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

      <section id="testimonials" aria-labelledby="testimonials-title" className="bg-[#303b8e] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">Partner Experience</p>
            <h2 id="testimonials-title" className="mt-3 text-3xl font-black text-white sm:text-4xl" style={headingFont}>What Our Partners Say</h2>
            <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">Sample testimonial placeholders for verified institutional feedback about placements, clinical training and partnership coordination.</p>
          </div>

          {showAllTestimonials ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {TESTIMONIALS.map((item, index) => (
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
                    <div className="mt-4 text-sm tracking-[0.14em] text-[#ffb612]" aria-label="5 out of 5 stars">★★★★★</div>
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
                    {TESTIMONIALS.map((item, index) => (
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
                          <div className="mt-4 text-sm tracking-[0.14em] text-[#ffb612]" aria-label="5 out of 5 stars">★★★★★</div>
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
              {showAllTestimonials ? 'View less' : 'View more'}
            </button>
          </div>
        </div>
      </section>

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

      {hospitals.length > 0 && (
        <section id="training-hospitals" aria-labelledby="training-hospitals-title" className="bg-[#303b8e] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-200">Clinical Training Network</p>
            <h2 id="training-hospitals-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Our Training Hospitals</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">Hospitals where students gain practical experience through supervised clinical training.</p>

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
                {showAllHospitals ? 'View less' : 'View more'}
              </button>
            )}
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

          {showAllRecognitions ? (
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {recognitions.map(({ name, icon: Icon, logo, url }) => (
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
              ))}
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
                    {recognitions.map(({ name, icon: Icon, logo, url }, index) => (
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
              {showAllRecognitions ? 'View less' : 'View more'}
            </button>
          )}
        </div>
      </section>

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
