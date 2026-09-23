import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Image as ImageIcon,
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

  const heroVideoEmbed = content.hero.backgroundVideo ? youtubeEmbed(content.hero.backgroundVideo) : '';

  return (
    <div className="bg-[#f5f3ee] text-slate-800">
      {preview && (
        <div className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-xs font-black text-slate-950 shadow">
          SUPER ADMIN PREVIEW — unpublished draft
        </div>
      )}

      <section className="relative isolate min-h-[650px] overflow-hidden bg-[#0d1b2a] text-white">
        <div className="absolute inset-0">
          {content.hero.backgroundVideo ? (
            heroVideoEmbed ? (
              <iframe
                src={`${heroVideoEmbed}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroVideoEmbed.split('/').pop() || ''}`}
                title="AIMN hero video"
                className="h-full w-full scale-125 pointer-events-none"
                allow="autoplay; encrypted-media"
              />
            ) : (
              <video src={content.hero.backgroundVideo} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-45" />
            )
          ) : (
            <img src={content.hero.backgroundImage} alt="AIMN clinical training" className="h-full w-full object-cover opacity-40" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#081422]/95 via-[#0d1b2a]/82 to-[#0d1b2a]/45" />

        <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d5b56d]/40 bg-black/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e2c579] backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              {content.hero.eyebrow}
            </div>
            <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.03em] sm:text-5xl lg:text-7xl">{content.hero.title}</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-200 sm:text-xl">{content.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <SmartLink to={content.hero.primaryButtonUrl} className="inline-flex items-center gap-2 rounded-xl bg-[#d5b56d] px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-[#e5c87e]">
                {content.hero.primaryButtonText}<ArrowRight className="h-4 w-4" />
              </SmartLink>
              <SmartLink to={content.hero.secondaryButtonUrl} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15">
                {content.hero.secondaryButtonText}
              </SmartLink>
            </div>
          </div>
        </div>
      </section>

      {content.highlights.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {content.highlights.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl font-black text-[#0d1b2a]">{item.value}</div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="about" className="bg-white">
        <div className="relative isolate overflow-hidden bg-[#27368f] text-white">
          <div className="absolute inset-0">
            <img
              src={content.about.images[1] || content.hero.backgroundImage}
              alt=""
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-[#27368f]/85" />
          </div>
          <div className="relative mx-auto flex min-h-[185px] max-w-7xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black sm:text-4xl">{content.about.bannerTitle || 'About Us'}</h2>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-white/75">
              <a href="#home" className="transition hover:text-white">Home</a>
              <span className="text-[#63dc86]">•</span>
              <span>About</span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0ca94f]">{content.about.eyebrow}</p>
            <h3 className="mt-3 max-w-xl text-3xl font-black leading-tight text-[#27368f] sm:text-4xl">
              {content.about.title}
            </h3>
            <div className="mt-4 h-1 w-14 rounded-full bg-[#10b957]" />

            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-slate-600">
              {content.about.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>

            <div className="mt-8 inline-grid overflow-hidden rounded-md border border-slate-200 bg-[#f8f9fb] shadow-sm sm:grid-cols-2">
              <div className="min-w-[170px] px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Established In</p>
                <p className="mt-1 text-base font-black text-[#27368f]">{content.about.establishedIn || '2011'}</p>
              </div>
              <div className="min-w-[210px] border-t border-slate-200 px-5 py-4 sm:border-l sm:border-t-0">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Location</p>
                <p className="mt-1 text-base font-black text-[#27368f]">{content.about.location || 'Mogadishu, Somalia'}</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px] pb-8 sm:pb-10">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xl">
              <img
                src={content.about.images[0] || content.hero.backgroundImage}
                alt="AZAAM International Medics Network"
                className="aspect-[1.12/1] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 left-[-8px] flex min-h-[118px] min-w-[145px] flex-col justify-center rounded-xl bg-[#0cb451] px-5 py-4 text-white shadow-lg sm:-left-8 sm:min-w-[155px]">
              <div className="text-3xl font-black leading-none">{content.about.experienceYears || '15+'}</div>
              <div className="mt-2 text-[10px] font-black uppercase leading-4 tracking-[0.04em]">Years of<br />Experience</div>
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="bg-[#0d1b2a] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d5b56d]">Clinical Rotations</p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Practical Experience Across Essential Departments</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.programs.map((program, index) => (
              <article key={`${program.title}-${index}`} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
                <div className="h-48 bg-slate-800">
                  {program.image ? <img src={program.image} alt={program.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Stethoscope className="h-12 w-12 text-[#d5b56d]" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black">{program.title}</h3>
                  <SmartLink to={program.link || '/register'} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#e2c579]">
                    Explore more <ArrowRight className="h-4 w-4" />
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {content.news.length > 0 && (
        <section id="news" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#9c7629]">Latest Updates</p>
          <h2 className="mt-4 text-3xl font-black text-slate-950">Updates from the AIMN network</h2>
          <div className="mt-9 grid gap-6 lg:grid-cols-3">
            {content.news.map((item, index) => (
              <article key={`${item.title}-${index}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                {item.image ? <img src={item.image} alt={item.title} className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-[#e7e4de]"><CalendarDays className="h-14 w-14 text-[#b7862d]" /></div>}
                <div className="p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9c7629]">{item.label}</p>
                  <h3 className="mt-2 text-lg font-black leading-7 text-slate-950">{item.title}</h3>
                  {item.summary && <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>}
                  <SmartLink to={item.link || '/login'} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-900">Read more <ArrowRight className="h-4 w-4" /></SmartLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {content.gallery.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#9c7629]"><ImageIcon className="h-5 w-5" /><span className="text-sm font-black uppercase tracking-[0.22em]">Gallery</span></div>
            <h2 className="mt-4 text-3xl font-black text-slate-950">AIMN in action</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.gallery.map((item, index) => (
                <figure key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={item.image} alt={item.title || 'AIMN gallery'} className="h-64 w-full object-cover" />
                  {(item.title || item.caption) && <figcaption className="p-4"><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.caption}</p></figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.videos.length > 0 && (
        <section className="bg-slate-950 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#d5b56d]"><PlayCircle className="h-5 w-5" /><span className="text-sm font-black uppercase tracking-[0.22em]">Videos</span></div>
            <h2 className="mt-4 text-3xl font-black">Stories, training and partnerships</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {content.videos.map((item, index) => {
                const embed = youtubeEmbed(item.url);
                return (
                  <article key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="aspect-video bg-black">
                      {embed ? <iframe src={embed} title={item.title} className="h-full w-full" allowFullScreen /> : <video src={item.url} controls poster={item.thumbnail} className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-5"><h3 className="font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p></div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {content.networkRoles.length > 0 && (
        <section className="bg-[#f3ead1] py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#8c6727]">AIMN network ecosystem</p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">The partners who make safe placement possible</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {content.networkRoles.map((role, index) => <div key={index} className="rounded-2xl border border-[#d9c899] bg-white/70 p-4 text-sm font-bold text-slate-700">{role}</div>)}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[30px] bg-[#0d1b2a] p-8 text-white shadow-xl lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-sm font-black uppercase tracking-[0.25em] text-[#d5b56d]">{content.cta.eyebrow}</p><h2 className="mt-3 max-w-3xl text-3xl font-black sm:text-4xl">{content.cta.title}</h2></div>
            <div className="flex flex-wrap gap-3">
              <SmartLink to={content.cta.primaryUrl} className="rounded-xl bg-[#d5b56d] px-6 py-3 text-sm font-black text-slate-950">{content.cta.primaryText}</SmartLink>
              <SmartLink to={content.cta.secondaryUrl} className="rounded-xl border border-white/25 px-6 py-3 text-sm font-bold">{content.cta.secondaryText}</SmartLink>
            </div>
          </div>
        </div>
      </section>

      {(content.contact.email || content.contact.phone || content.contact.address) && (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm sm:grid-cols-3 sm:px-6 lg:px-8">
            <div><p className="text-xs font-black uppercase text-slate-400">Email</p><p className="mt-1 font-bold text-slate-800">{content.contact.email || '—'}</p></div>
            <div><p className="text-xs font-black uppercase text-slate-400">Phone</p><p className="mt-1 font-bold text-slate-800">{content.contact.phone || '—'}</p></div>
            <div><p className="text-xs font-black uppercase text-slate-400">Address</p><p className="mt-1 font-bold text-slate-800">{content.contact.address || '—'}</p></div>
          </div>
        </section>
      )}
    </div>
  );
};
