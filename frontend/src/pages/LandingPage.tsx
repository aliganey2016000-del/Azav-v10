import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import {
  defaultLandingPageContent,
  LandingPageCmsService,
  LandingPageContent,
} from '../services/landingPageCms.service';

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

export const LandingPage: React.FC = () => {
  const [content, setContent] = useState<LandingPageContent>(defaultLandingPageContent);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    setPreview(isPreview);
    const request = isPreview ? LandingPageCmsService.getPreview() : LandingPageCmsService.getPublic();
    request.then(setContent).catch(() => setContent(defaultLandingPageContent));
  }, []);

  useEffect(() => {
    document.title = content.seo.title || 'AZAAM International Medics Network';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', content.seo.description || '');
  }, [content.seo]);

  const heroEmbed = content.hero.backgroundVideo ? youtubeEmbed(content.hero.backgroundVideo) : '';
  const facilityItems = useMemo(() => {
    if (content.gallery.length > 0) return content.gallery.slice(0, 3);
    return content.about.images.filter(Boolean).slice(0, 3).map((image, index) => ({
      title: ['Clinical Learning', 'Skills & Simulation', 'Partner Facilities'][index] || 'AIMN Facility',
      image,
      caption: [
        'Structured clinical learning supported by qualified professionals and host institutions.',
        'Practical exposure that strengthens confidence, competence and professional readiness.',
        'Trusted partner facilities supporting safe and supervised clinical attachment experiences.',
      ][index] || '',
    }));
  }, [content.gallery, content.about.images]);

  return (
    <div id="home" className="bg-white text-slate-800">
      {preview && (
        <div className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-xs font-black text-slate-950 shadow">
          SUPER ADMIN PREVIEW — unpublished draft
        </div>
      )}

      <section className="relative isolate min-h-[620px] overflow-hidden bg-[#0b2440] text-white">
        <div className="absolute inset-0">
          {content.hero.backgroundVideo ? (
            heroEmbed ? (
              <iframe
                src={`${heroEmbed}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroEmbed.split('/').pop() || ''}`}
                title="AIMN hero video"
                className="h-full w-full scale-125 pointer-events-none"
                allow="autoplay; encrypted-media"
              />
            ) : (
              <video src={content.hero.backgroundVideo} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            )
          ) : (
            <img src={content.hero.backgroundImage} alt="AIMN clinical education" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#06213a]/88 via-[#06213a]/64 to-[#06213a]/32" />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#74e39b]">{content.hero.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">{content.hero.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">{content.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SmartLink to={content.hero.primaryButtonUrl} className="inline-flex items-center gap-2 rounded-md bg-[#0a8f3d] px-6 py-3 text-sm font-black text-white transition hover:bg-[#087c35]">
                {content.hero.primaryButtonText}<ArrowRight className="h-4 w-4" />
              </SmartLink>
              <SmartLink to={content.hero.secondaryButtonUrl} className="inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                {content.hero.secondaryButtonText}
              </SmartLink>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
          <div className="relative">
            <div className="absolute -left-4 -top-4 h-28 w-28 bg-[#0a8f3d]" />
            <div className="relative overflow-hidden bg-slate-100 shadow-xl">
              <img
                src={content.about.images[0] || content.hero.backgroundImage}
                alt="AIMN leadership and clinical education"
                className="h-[420px] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 right-4 bg-[#1668b2] px-5 py-4 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em]">AZAAM International</p>
              <p className="mt-1 text-lg font-black">Medics Network</p>
            </div>
          </div>

          <div className="lg:pl-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a8f3d]">{content.about.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-black text-[#0b2440] sm:text-4xl">Executive Welcome</h2>
            <h3 className="mt-4 text-xl font-black text-slate-900">{content.about.title}</h3>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-slate-600">
              {content.about.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <div className="mt-6 border-l-4 border-[#0a8f3d] pl-4">
              <p className="font-black text-[#0b2440]">AZAAM International Medics Network</p>
              <p className="text-sm text-slate-500">Clinical Education & Partnership Network</p>
            </div>
          </div>
        </div>
      </section>

      {content.highlights.length > 0 && (
        <section className="bg-[#0a8f3d] py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">AIMN Facts & Figures</p>
              <h2 className="mt-2 text-3xl font-black">Our network at a glance</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {content.highlights.map((item, index) => (
                <div key={`${item.label}-${index}`} className="text-center">
                  <div className="text-4xl font-black">{item.value}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/85">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="programs" className="bg-[#f7f8fa] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a8f3d]">Our Programs</p>
              <h2 className="mt-2 text-3xl font-black text-[#0b2440]">Clinical Training Areas</h2>
            </div>
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-black text-[#1668b2]">
              View all programs <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.programs.map((program, index) => (
              <article key={`${program.title}-${index}`} className="group overflow-hidden bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  {program.image ? (
                    <img src={program.image} alt={program.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Stethoscope className="h-12 w-12 text-[#0a8f3d]" /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-[#0a8f3d]" />
                </div>
                <div className="p-5">
                  <div className="mb-3 inline-flex rounded-full bg-[#eaf7ef] p-2 text-[#0a8f3d]"><GraduationCap className="h-4 w-4" /></div>
                  <h3 className="text-lg font-black text-[#0b2440]">{program.title}</h3>
                  <SmartLink to={program.link || '/register'} className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#1668b2]">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {facilityItems.length > 0 && (
        <section id="facilities" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a8f3d]">Campus Facilities</p>
                <h2 className="mt-2 text-3xl font-black text-[#0b2440]">Clinical learning environments</h2>
              </div>
              <span className="hidden text-sm font-black text-[#1668b2] md:block">View all</span>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {facilityItems.map((item, index) => (
                <article key={index} className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={item.image} alt={item.title || 'AIMN facility'} className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <h3 className="text-xl font-black text-[#0b2440]">{item.title || 'Clinical Facility'}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.videos.length > 0 && (
        <section id="events" className="bg-[#f7f8fa] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a8f3d]">Latest Events</p>
                <h2 className="mt-2 text-3xl font-black text-[#0b2440]">Training, seminars and network activities</h2>
              </div>
              <span className="hidden text-sm font-black text-[#1668b2] md:block">View all</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {content.videos.slice(0, 4).map((item, index) => {
                const embed = youtubeEmbed(item.url);
                return (
                  <article key={index} className="grid overflow-hidden bg-white shadow-sm sm:grid-cols-[200px_1fr]">
                    <div className="min-h-48 bg-slate-900">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                      ) : embed ? (
                        <iframe src={embed} title={item.title} className="h-full w-full" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><PlayCircle className="h-12 w-12 text-white/70" /></div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#0a8f3d]"><CalendarDays className="h-4 w-4" /> AIMN Event</div>
                      <h3 className="text-lg font-black leading-7 text-[#0b2440]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Network activity</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> AIMN</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {content.news.length > 0 && (
        <section id="news" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a8f3d]">Latest News</p>
                <h2 className="mt-2 text-3xl font-black text-[#0b2440]">News from the AIMN network</h2>
              </div>
              <span className="hidden text-sm font-black text-[#1668b2] md:block">View all posts</span>
            </div>
            <div className="grid gap-7 lg:grid-cols-3">
              {content.news.map((item, index) => (
                <article key={`${item.title}-${index}`} className="border-b-4 border-transparent bg-white shadow-sm transition hover:border-[#0a8f3d] hover:shadow-lg">
                  <div className="h-52 bg-slate-100">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><CalendarDays className="h-14 w-14 text-[#1668b2]/45" /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-[#0a8f3d]">{item.label}</div>
                    <h3 className="mt-3 text-lg font-black leading-7 text-[#0b2440]">{item.title}</h3>
                    {item.summary && <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>}
                    <SmartLink to={item.link || '/login'} className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#1668b2]">
                      Read more <ArrowRight className="h-4 w-4" />
                    </SmartLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.networkRoles.length > 0 && (
        <section id="memberships" className="border-t border-slate-200 bg-[#f7f8fa] py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0a8f3d]">Local and International Memberships</p>
            <h2 className="mt-2 text-3xl font-black text-[#0b2440]">Institutional network and partners</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {content.networkRoles.map((name, index) => (
                <div key={index} className="flex min-h-28 items-center justify-center border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#1668b2] py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white/75"><ShieldCheck className="h-4 w-4" /> {content.cta.eyebrow}</div>
            <h2 className="max-w-3xl text-3xl font-black">{content.cta.title}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <SmartLink to={content.cta.primaryUrl} className="rounded-md bg-[#0a8f3d] px-6 py-3 text-sm font-black text-white hover:bg-[#087c35]">{content.cta.primaryText}</SmartLink>
            <SmartLink to={content.cta.secondaryUrl} className="rounded-md border border-white/70 px-6 py-3 text-sm font-black text-white hover:bg-white/10">{content.cta.secondaryText}</SmartLink>
          </div>
        </div>
      </section>
    </div>
  );
};
