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
  Handshake,
  MapPin,
  Maximize2,
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
  X,
} from 'lucide-react';
import {
  defaultLandingPageContent,
  LandingPageCmsService,
  LandingPageContent,
  VideoItem,
} from '../services/landingPageCms.service';
import {
  RecognitionEvidenceDocument,
  RecognitionEvidenceService,
  resolveRecognitionEvidenceUrl,
} from '../services/recognitionEvidence.service';

const headingFont = { fontFamily: "Georgia, 'Times New Roman', serif" };

const aimnHighlightIcons = [Users, CalendarDays, Stethoscope, TrendingUp, Globe2, Activity, Building2, Award];

const SmartLink: React.FC<{ to: string; className?: string; children: React.ReactNode }> = ({ to, className, children }) => {
  if (/^https?:\/\//i.test(to)) {
    return <a href={to} className={className} target="_blank" rel="noreferrer">{children}</a>;
  }
  return <Link to={to || '/'} className={className}>{children}</Link>;
};

// Keep manual navigation and autoplay on the same seamless animation timeline.
const CarouselControls: React.FC<{ label: string; className: string; children: React.ReactNode }> = ({ label, className, children }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const track = viewportRef.current?.firstElementChild as HTMLElement | null;
    if (track) track.style.animationPlayState = hovered || focused ? 'paused' : 'running';
  }, [hovered, focused]);

  const move = (direction: number) => {
    const viewport = viewportRef.current;
    const track = viewport?.firstElementChild as HTMLElement | null;
    const group = track?.firstElementChild as HTMLElement | null;
    const card = group?.firstElementChild as HTMLElement | null;
    if (!viewport || !track || !group || !card) return;
    const step = card.getBoundingClientRect().width + (parseFloat(getComputedStyle(group).columnGap) || 0);
    const animation = track.getAnimations()[0];
    const duration = animation?.effect?.getComputedTiming().duration;
    const loopWidth = track.getBoundingClientRect().width / 2;
    if (animation && typeof duration === 'number' && duration > 0 && loopWidth > 0) {
      const next = Number(animation.currentTime || 0) + direction * step / loopWidth * duration;
      animation.currentTime = ((next % duration) + duration) % duration;
    } else {
      // Reduced motion: arrows still work, without animation.
      viewport.scrollBy({ left: direction * step, behavior: 'instant' });
    }
  };

  return (
    <div className="relative mt-10 px-12 sm:px-14" role="region" aria-label={label} aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <button type="button" aria-label={`Previous ${label.toLowerCase()}`} onClick={() => move(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#303b8e] shadow-md transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>
      <div ref={viewportRef} className={className}>{children}</div>
      <button type="button" aria-label={`Next ${label.toLowerCase()}`} onClick={() => move(1)}
        className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#303b8e] shadow-md transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
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
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [galleryOffset, setGalleryOffset] = useState(0);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState('All');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const [recognitionAccessTarget, setRecognitionAccessTarget] = useState<LandingPageContent['recognitions'][number] | null>(null);
  const [recognitionAccessCode, setRecognitionAccessCode] = useState('');
  const [recognitionAccessError, setRecognitionAccessError] = useState('');
  const [recognitionAccessBusy, setRecognitionAccessBusy] = useState(false);
  const [recognitionDocuments, setRecognitionDocuments] = useState<RecognitionEvidenceDocument[]>([]);
  const [recognitionViewExpiresAt, setRecognitionViewExpiresAt] = useState('');
  const [activeRecognitionDocument, setActiveRecognitionDocument] = useState<RecognitionEvidenceDocument | null>(null);

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
  const galleryItems = content.gallery.filter((item) => item.image?.trim());
  const galleryCategories = [
    { label: 'All', icon: ImageIcon },
    { label: 'Clinical Training', icon: Stethoscope },
    { label: 'Hospital Visits', icon: Building2 },
    { label: 'Students', icon: Users },
    { label: 'Partnerships', icon: Handshake },
    { label: 'Events', icon: CalendarDays },
  ];
  const filteredGalleryItems = activeGalleryCategory === 'All'
    ? galleryItems
    : galleryItems.filter((item) => (item.category || 'Clinical Training') === activeGalleryCategory);
  const galleryStart = filteredGalleryItems.length ? galleryOffset % filteredGalleryItems.length : 0;
  const visibleGalleryItems = showAllGallery ? filteredGalleryItems : [
    ...filteredGalleryItems.slice(galleryStart), ...filteredGalleryItems.slice(0, galleryStart),
  ].slice(0, 3);
  const moveGallery = (direction: number) => {
    if (filteredGalleryItems.length > 1) {
      setGalleryOffset((current) => (current + direction + filteredGalleryItems.length) % filteredGalleryItems.length);
    }
  };
  const recognitions = content.recognitions.filter((item) => item.name?.trim());
  const recognitionIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('health') || lower.includes('medical')) return Stethoscope;
    if (lower.includes('education') || lower.includes('universit')) return GraduationCap;
    if (lower.includes('foreign')) return Globe2;
    return ShieldCheck;
  };
  const openRecognitionEvidence = (item: LandingPageContent['recognitions'][number]) => {
    setRecognitionAccessTarget(item);
    setRecognitionAccessCode('');
    setRecognitionAccessError('');
    setRecognitionDocuments([]);
    setRecognitionViewExpiresAt('');
    setActiveRecognitionDocument(null);
  };

  const closeRecognitionEvidence = () => {
    setRecognitionAccessTarget(null);
    setRecognitionAccessCode('');
    setRecognitionAccessError('');
    setRecognitionDocuments([]);
    setRecognitionViewExpiresAt('');
    setActiveRecognitionDocument(null);
  };

  const verifyRecognitionEvidence = async () => {
    if (!recognitionAccessTarget || !/^\d{6}$/.test(recognitionAccessCode)) {
      setRecognitionAccessError('Enter the 6-digit access code provided by AZAAM Medics.');
      return;
    }
    try {
      setRecognitionAccessBusy(true);
      setRecognitionAccessError('');
      const access = await RecognitionEvidenceService.verify(recognitionAccessTarget.name, recognitionAccessCode);
      setRecognitionDocuments(access.documents || []);
      setRecognitionViewExpiresAt(access.viewExpiresAt || '');
      setRecognitionAccessCode('');
    } catch (error: any) {
      setRecognitionAccessError(error?.response?.data?.error?.message || 'The access code could not be verified.');
    } finally {
      setRecognitionAccessBusy(false);
    }
  };

  const recognitionCard = (item: LandingPageContent['recognitions'][number], index: number, duplicate = false) => {
    const Icon = recognitionIcon(item.name);
    return (
      <button
        key={`${duplicate ? 'copy' : 'original'}-${item.name}-${index}`}
        type="button"
        onClick={() => openRecognitionEvidence(item)}
        tabIndex={duplicate ? -1 : undefined}
        className="flex min-h-40 w-40 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#008267]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008267] sm:w-44"
        aria-label={`View protected evidence for ${item.name}`}
      >
        <div className="flex h-20 w-20 items-center justify-center">
          <img
            src={item.logo}
            alt={duplicate ? '' : item.name}
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
        <h3 className="mt-4 text-center text-xs font-bold leading-snug text-slate-900">{item.name}</h3>
      </button>
    );
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
    <div id="home" className="w-full max-w-full overflow-x-hidden bg-[#003d33] text-white">
      {preview && (
        <div className="sticky top-[78px] z-40 bg-[#ffb612] px-4 py-2 text-center text-xs font-black text-[#003d33] shadow">
          SUPER ADMIN PREVIEW — unpublished draft
        </div>
      )}

      <section className="relative isolate w-full max-w-full overflow-x-hidden bg-[#303b8e]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_82%_70%,rgba(0,185,104,0.12),transparent_30%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-14 sm:px-6 md:pt-20 lg:px-8 lg:pb-16">
          <div className="grid min-w-0 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            <div className="w-full min-w-0 max-w-2xl">
              <div className="flex w-fit max-w-full items-start gap-2 rounded-[24px] border border-[#ffb612]/35 bg-[#ffb612]/10 px-4 py-2 text-[10px] font-black uppercase leading-5 tracking-[0.14em] text-[#ffd55b] sm:items-center sm:rounded-full sm:text-[11px] sm:tracking-[0.2em]">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{content.hero.eyebrow || 'Trusted by medical schools & hospitals worldwide'}</span>
              </div>

              <h1 className="mt-6 w-full max-w-[680px] break-words text-[38px] font-black leading-[0.98] tracking-[-0.035em] text-white [overflow-wrap:anywhere] sm:text-[54px] lg:text-[62px] xl:text-[66px]" style={headingFont}>
                {content.hero.titleLines.map((line, index) => (
                  <span key={index} className={`block max-w-full break-words [overflow-wrap:anywhere] ${index > 0 && index < content.hero.titleLines.length - 1 ? 'text-[#ffbf2f]' : 'text-white'}`}>{line}</span>
                ))}
              </h1>

              <p className="mt-6 w-full max-w-2xl break-words text-[15px] leading-7 text-white/85 [overflow-wrap:anywhere] sm:text-base sm:leading-8 lg:text-[17px]">
                {content.hero.subtitle || 'Manage clinical placements, student nominations, visas, hospital coordination, attendance, certificates and training operations — all in one powerful platform.'}
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <SmartLink to={content.hero.primaryButtonUrl} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ffb612] px-5 py-3.5 text-sm font-black text-[#063b31] shadow-lg shadow-amber-500/20 transition hover:bg-[#ffc83d] sm:w-auto sm:px-7">
                  {content.hero.primaryButtonText || 'Get Started'} <ArrowRight className="h-4 w-4" />
                </SmartLink>
                <a
                  href={content.hero.secondaryButtonUrl || (heroShowcaseUrl ? '#organization-video' : '#programs')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.05] px-5 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.10] sm:w-auto sm:px-7"
                >
                  <Play className="h-4 w-4" /> {content.hero.secondaryButtonText || (heroShowcaseUrl ? 'Watch Video' : 'Explore Programs')}
                </a>
              </div>

              <div className="mt-7 flex min-w-0 items-start gap-4 sm:items-center">
                <div className="flex shrink-0 -space-x-2">
                  {['#ffb612','#3fd0b6','#4bb6ff','#f270b5'].map((color, index) => (
                    <span key={index} className="h-8 w-8 rounded-full border-2 border-[#303b8e]" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm tracking-[0.18em] text-[#ffbf2f]">★★★★★</div>
                  <p className="break-words text-xs leading-5 text-white/65 [overflow-wrap:anywhere]">{content.hero.trustText}</p>
                </div>
              </div>
            </div>

            <div id="organization-video" className="relative mx-auto w-full min-w-0 max-w-full scroll-mt-28 sm:max-w-[620px]">
              <div className="absolute -inset-3 rounded-[28px] bg-white/10 blur-3xl sm:-inset-8 sm:rounded-[36px]" />
              <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/[0.08] shadow-2xl shadow-black/25 backdrop-blur-xl sm:rounded-[28px]">
                <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-4 sm:gap-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.14em] text-[#ffbf2f] [overflow-wrap:anywhere] sm:text-[10px] sm:tracking-[0.18em]">{content.sectionHeadings.heroVideoEyebrow}</p>
                    <h2 className="mt-1 break-words text-sm font-black leading-5 text-white [overflow-wrap:anywhere] sm:text-lg sm:leading-6">{content.sectionHeadings.heroVideoTitle}</h2>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffb612]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#45d2aa]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#4bb6ff]" />
                  </div>
                </div>

                <div className="aspect-video w-full min-w-0 max-w-full overflow-hidden bg-[#18236f]">
                  {heroShowcaseEmbed ? (
                    <iframe
                      src={`${heroShowcaseEmbed}${heroShowcaseEmbed.includes('?') ? '&' : '?'}rel=0&modestbranding=1&playsinline=1`}
                      title="AIMN organization impact video"
                      className="block h-full w-full max-w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : heroShowcaseUrl ? (
                    <video src={heroShowcaseUrl} controls playsInline className="block h-full w-full max-w-full object-cover" />
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

                <div className="min-w-0 border-t border-white/10 px-4 py-4 sm:px-6">
                  <p className="break-words text-sm leading-6 text-white/70 [overflow-wrap:anywhere]">
                    {content.sectionHeadings.heroVideoDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.08] shadow-xl backdrop-blur-xl">
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

      <section
        id="programs"
        className="relative isolate overflow-hidden bg-[#009b58] py-16 sm:py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_90%_22%,rgba(0,92,69,0.28),transparent_34%),linear-gradient(135deg,rgba(0,105,77,0.10),transparent_48%)]" />
        <div className="pointer-events-none absolute -right-56 -top-44 h-[560px] w-[560px] rounded-full bg-white/[0.035]" />

        <div className="relative mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffbf2f] sm:text-[11px]">
              <GraduationCap className="h-4 w-4" />
              {content.sectionHeadings.programsEyebrow}
            </div>
            <h2
              className="mt-3 max-w-3xl text-[38px] font-black leading-[0.98] tracking-[-0.035em] text-white sm:text-[48px] lg:text-[54px]"
              style={headingFont}
            >
              {content.sectionHeadings.programsTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              {content.sectionHeadings.programsDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {content.programs.slice(0, 10).map((program, index) => (
              <article
                key={`${program.title}-${index}`}
                className="group min-w-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#08785c]/80 shadow-[0_16px_38px_rgba(0,70,50,0.16)] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_22px_48px_rgba(0,70,50,0.24)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#0b5f50]">
                  {program.image ? (
                    <img
                      src={program.image}
                      alt={program.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Stethoscope className="h-12 w-12 text-[#ffbf2f]" />
                    </div>
                  )}
                </div>

                <div className="flex min-h-[112px] flex-col p-4 sm:min-h-[118px]">
                  <h3 className="text-[15px] font-black leading-snug text-white sm:text-base">
                    {program.title}
                  </h3>
                  <SmartLink
                    to={program.link || '/register'}
                    className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-black text-[#ffbf2f] transition group-hover:gap-3 sm:text-[13px]"
                  >
                    {content.sectionHeadings.programButtonLabel}
                    <ArrowRight className="h-4 w-4" />
                  </SmartLink>
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
            <CarouselControls className="aimn-testimonial-window overflow-hidden" label="Partner testimonials">
              <div className="aimn-testimonial-track">
                {[false, true].map((duplicate) => (
                  <div key={duplicate ? 'testimonials-copy' : 'testimonials-original'} className="flex shrink-0 gap-5 pr-5" aria-hidden={duplicate ? 'true' : undefined}>
                    {content.testimonials.map((item, index) => (
                      <article
                        key={`${duplicate ? 'copy' : 'original'}-${index}`}
                        className="group w-[calc(100vw-128px)] max-w-[320px] shrink-0 overflow-hidden rounded-[22px] border border-white/15 bg-white text-left text-slate-800 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-[320px] lg:w-[340px]"
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
            </CarouselControls>
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

      {galleryItems.length > 0 && (
        <section className="overflow-hidden bg-[#f8fbfa] py-8 text-slate-800 sm:py-10 lg:py-12">
          <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 text-[#006a61]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white shadow-sm">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{content.sectionHeadings.galleryEyebrow}</span>
                </div>
                <h2
                  className="mt-2.5 text-[36px] font-black leading-[0.98] tracking-[-0.035em] text-[#073f35] sm:text-[46px] lg:text-[54px]"
                  style={headingFont}
                >
                  {content.sectionHeadings.galleryTitle}
                </h2>
                <p className="mt-2.5 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  {content.sectionHeadings.galleryDescription}
                </p>
              </div>

              {filteredGalleryItems.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllGallery((current) => !current)}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-[#008267]/35 bg-white px-5 text-sm font-black text-[#07534a] shadow-sm transition hover:border-[#008267] hover:bg-emerald-50"
                >
                  {showAllGallery ? content.sectionHeadings.viewLessLabel : 'View All Photos'}
                  <ArrowRight className={`h-4 w-4 transition ${showAllGallery ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
              {galleryCategories.map(({ label, icon: Icon }) => {
                const active = activeGalleryCategory === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setActiveGalleryCategory(label);
                      setGalleryOffset(0);
                      setShowAllGallery(false);
                    }}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition sm:text-sm ${
                      active
                        ? 'border-[#006a61] bg-[#006a61] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-[#006a61]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            {filteredGalleryItems.length > 0 ? (
              <div className="relative mt-4 sm:mt-5" role="region" aria-label="Gallery photos">
                {!showAllGallery && filteredGalleryItems.length > 1 && (
                  <>
                    <button type="button" onClick={() => moveGallery(-1)} aria-label="Previous gallery photo"
                      className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white/95 text-[#006a61] shadow-md backdrop-blur hover:bg-emerald-50 sm:-left-4 lg:-left-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
                      <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => moveGallery(1)} aria-label="Next gallery photo"
                      className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white/95 text-[#006a61] shadow-md backdrop-blur hover:bg-emerald-50 sm:-right-4 lg:-right-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
                      <ChevronRight className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleGalleryItems.map((item, index) => {
                  const originalIndex = galleryItems.indexOf(item);
                  return (
                    <article key={`${item.image}-${originalIndex}`} className={`min-w-0 ${!showAllGallery ? (index === 1 ? 'hidden sm:block' : index === 2 ? 'hidden lg:block' : '') : ''}`}>
                      <button
                        type="button"
                        onClick={() => setActiveGalleryIndex(originalIndex)}
                        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-slate-200 text-left shadow-[0_12px_34px_rgba(7,63,53,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(7,63,53,0.18)] focus:outline-none focus:ring-4 focus:ring-emerald-200/60"
                        aria-label={`Open ${item.title || 'AIMN gallery image'}`}
                      >
                        <div
                          className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-xl"
                          style={{ backgroundImage: `url("${item.image}")` }}
                          aria-hidden="true"
                        />
                        <img
                          src={item.image}
                          alt={item.title || 'AIMN clinical training activity'}
                          loading="lazy"
                          decoding="async"
                          className="relative z-[1] h-full w-full object-contain transition duration-500 group-hover:scale-[1.015]"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            const fallback = event.currentTarget.parentElement?.querySelector('[data-gallery-fallback]');
                            fallback?.classList.remove('hidden');
                            fallback?.classList.add('flex');
                          }}
                        />
                        <div data-gallery-fallback className="hidden absolute inset-0 z-[2] flex-col items-center justify-center gap-3 bg-emerald-50 px-6 text-center text-[#073f35]">
                          <ImageIcon className="h-9 w-9 text-[#008267]" />
                          <p className="text-sm font-black">Image unavailable</p>
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#00584f]/95 via-[#00584f]/10 to-transparent" />

                        {item.photoCount && (
                          <span className="pointer-events-none absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#163f45]/80 px-3 text-xs font-black text-white backdrop-blur-sm">
                            <ImageIcon className="h-4 w-4" />
                            {item.photoCount}
                          </span>
                        )}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
                          <h3 className="text-[16px] font-black leading-tight text-white sm:text-lg">
                            {item.title || 'Clinical Training'}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] font-medium text-white/90 sm:text-xs">
                            {item.location && (
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </span>
                            )}
                            {item.date && (
                              <span className="inline-flex shrink-0 items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {item.date}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-emerald-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
                No photos are currently assigned to this category.
              </div>
            )}
          </div>
        </section>
      )}

      {content.videos.length > 0 && (
        <section id="videos" className="bg-[#002f28] py-20" style={heroPattern}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#ffbf2f]"><PlayCircle className="h-5 w-5" /><span className="text-[11px] font-black uppercase tracking-[0.18em]">{content.sectionHeadings.videosEyebrow}</span></div>
            <h2
              className="mt-3 max-w-4xl text-[30px] font-black leading-[1.08] tracking-[-0.02em] text-white sm:text-[36px] lg:text-[42px] [text-wrap:balance]"
              style={headingFont}
            >
              {content.sectionHeadings.videosTitle}
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {content.videos.map((item, index) => {
                const embed = youtubeEmbed(item.url);
                return (
                  <article key={index} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05]">
                    <div className="aspect-video bg-black">{embed ? <iframe src={embed} title={item.title} className="h-full w-full" allowFullScreen /> : <video src={item.url} controls poster={item.thumbnail} className="h-full w-full object-cover" />}</div>
                    <div className="p-5 sm:p-6">
                      <h3 className="text-lg font-black leading-tight text-white sm:text-xl [text-wrap:balance]" style={headingFont}>{item.title}</h3>
                      {item.description && <p className="mt-2 text-justify text-sm leading-6 text-emerald-50/70">{item.description}</p>}
                    </div>
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
                <CarouselControls className="aimn-membership-window overflow-hidden" label="Partner universities">
                  <div className="aimn-membership-track" style={{ animationDuration: `${Math.max(28, memberships.length * 4)}s` }}>
                    <div className="flex shrink-0 gap-4 pr-4">{memberships.map((item, index) => membershipCard(item, index))}</div>
                    <div className="flex shrink-0 gap-4 pr-4" aria-hidden="true">{memberships.map((item, index) => membershipCard(item, index, true))}</div>
                  </div>
                </CarouselControls>
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
              <CarouselControls className="aimn-membership-window overflow-hidden" label="Training hospitals">
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
              </CarouselControls>
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

      {activeGalleryIndex !== null && galleryItems[activeGalleryIndex] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001f1a]/90 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image preview"
          onClick={() => setActiveGalleryIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveGalleryIndex(null)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur transition hover:bg-black/55 sm:right-6 sm:top-6"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-5xl overflow-hidden rounded-[24px] bg-[#062f29] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex max-h-[76vh] min-h-[280px] items-center justify-center bg-black">
              <img
                src={galleryItems[activeGalleryIndex].image}
                alt={galleryItems[activeGalleryIndex].title || 'AIMN activity'}
                className="max-h-[76vh] w-full object-contain"
              />
            </div>
            {(galleryItems[activeGalleryIndex].title || galleryItems[activeGalleryIndex].caption || galleryItems[activeGalleryIndex].location || galleryItems[activeGalleryIndex].date) && (
              <div className="px-5 py-4 text-white sm:px-7 sm:py-5">
                {galleryItems[activeGalleryIndex].title && (
                  <h3 className="text-lg font-black sm:text-xl" style={headingFont}>{galleryItems[activeGalleryIndex].title}</h3>
                )}
                {(galleryItems[activeGalleryIndex].location || galleryItems[activeGalleryIndex].date) && (
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
                    {galleryItems[activeGalleryIndex].location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{galleryItems[activeGalleryIndex].location}</span>}
                    {galleryItems[activeGalleryIndex].date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{galleryItems[activeGalleryIndex].date}</span>}
                  </div>
                )}
                {galleryItems[activeGalleryIndex].caption && (
                  <p className="mt-2 text-sm leading-6 text-white/70">{galleryItems[activeGalleryIndex].caption}</p>
                )}
              </div>
            )}
          </div>
        </div>
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
              {recognitions.map((item, index) => recognitionCard(item, index))}
            </div>
          ) : (
            <CarouselControls className="aimn-membership-window overflow-hidden" label="Official recognitions">
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
                    {recognitions.map((item, index) => recognitionCard(item, index, duplicate))}
                  </div>
                ))}
              </div>
            </CarouselControls>
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

      {recognitionAccessTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Protected recognition evidence"
          onClick={closeRecognitionEvidence}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#073f35] px-5 py-5 text-white sm:px-6">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Protected Recognition Evidence</div>
                <h2 className="mt-1 break-words text-lg font-black sm:text-xl">{recognitionAccessTarget.name}</h2>
              </div>
              <button type="button" onClick={closeRecognitionEvidence} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {recognitionDocuments.length === 0 ? (
              <div className="p-5 sm:p-7">
                <div className="mx-auto max-w-lg text-center">
                  <ShieldCheck className="mx-auto h-11 w-11 text-[#008267]" />
                  <h3 className="mt-3 text-lg font-black text-slate-900">Enter the 6-digit access code</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">This evidence is private. Use the one-time code shared directly by AZAAM Medics.</p>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={recognitionAccessCode}
                    onChange={(event) => setRecognitionAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(event) => event.key === 'Enter' && verifyRecognitionEvidence()}
                    placeholder="000000"
                    className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.32em] text-slate-900 outline-none transition focus:border-[#008267] focus:ring-4 focus:ring-emerald-100"
                  />
                  {recognitionAccessError && <p className="mt-3 text-sm font-semibold text-rose-600">{recognitionAccessError}</p>}
                  <button
                    type="button"
                    disabled={recognitionAccessBusy || recognitionAccessCode.length !== 6}
                    onClick={verifyRecognitionEvidence}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#303b8e] px-5 text-sm font-black text-white disabled:opacity-50"
                  >
                    {recognitionAccessBusy ? 'Verifying...' : 'View Evidence'}
                  </button>
                  <p className="mt-4 text-[11px] leading-5 text-slate-400">Each code can be verified once. A verified viewing session is temporary.</p>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">Recognition & Agreement Documents</h3>
                    <p className="mt-1 text-xs text-slate-500">Protected view-only session. No download action is provided.</p>
                  </div>
                  {recognitionViewExpiresAt && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">Temporary access active</span>
                  )}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {recognitionDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setActiveRecognitionDocument(doc)}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-[#008267]/40 hover:bg-emerald-50/50"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#303b8e]">
                        {doc.mimeType === 'application/pdf' ? <ShieldCheck className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-black text-slate-900">{doc.title || doc.originalName}</div>
                        <div className="mt-1 text-[10px] text-slate-500">{doc.mimeType === 'application/pdf' ? 'Protected PDF' : 'Protected image'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeRecognitionDocument && (
        <div
          className="fixed inset-0 z-[120] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Protected evidence document viewer"
          onContextMenu={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            const key = event.key.toLowerCase();
            if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p')) event.preventDefault();
            if (event.key === 'PrintScreen') event.preventDefault();
            if (event.key === 'Escape') setActiveRecognitionDocument(null);
          }}
          tabIndex={-1}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#071d1a] px-4 text-white sm:px-6">
            <div className="min-w-0">
              <div className="truncate text-sm font-black">{activeRecognitionDocument.title || activeRecognitionDocument.originalName}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/45">AZAAM Medics · Protected View</div>
            </div>
            <button type="button" onClick={() => setActiveRecognitionDocument(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10" aria-label="Close document">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#111] select-none">
            {activeRecognitionDocument.mimeType === 'application/pdf' ? (
              <iframe
                src={`${resolveRecognitionEvidenceUrl(activeRecognitionDocument.url)}#toolbar=0&navpanes=0`}
                title={activeRecognitionDocument.title || activeRecognitionDocument.originalName}
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-3 sm:p-6">
                <img
                  src={resolveRecognitionEvidenceUrl(activeRecognitionDocument.url)}
                  alt={activeRecognitionDocument.title || activeRecognitionDocument.originalName}
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="-rotate-12 whitespace-nowrap text-3xl font-black uppercase tracking-[0.18em] text-white/[0.08] sm:text-5xl">AZAAM MEDICS · CONFIDENTIAL · VIEW ONLY</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
