import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  PresentationGallery,
  PresentationGalleryService,
  resolvePresentationMediaUrl,
} from '../services/presentationGallery.service';

export const PresentationViewPage: React.FC = () => {
  const { token = '' } = useParams();
  const [gallery, setGallery] = useState<PresentationGallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presentingIndex, setPresentingIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    PresentationGalleryService.getShared(token)
      .then(setGallery)
      .catch((err) => setError(err?.response?.data?.error?.message || 'This presentation is unavailable.'))
      .finally(() => setLoading(false));
  }, [token]);

  const current = useMemo(() => presentingIndex !== null ? gallery?.media[presentingIndex] : null, [gallery, presentingIndex]);

  useEffect(() => {
    if (presentingIndex === null || !gallery?.media.length) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresentingIndex(null);
      if (event.key === 'ArrowRight') setPresentingIndex((value) => value === null ? 0 : (value + 1) % gallery.media.length);
      if (event.key === 'ArrowLeft') setPresentingIndex((value) => value === null ? 0 : (value - 1 + gallery.media.length) % gallery.media.length);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [presentingIndex, gallery]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#071f2b] text-sm font-bold text-white/70">Loading presentation...</div>;
  if (error || !gallery) return <div className="flex min-h-screen items-center justify-center bg-[#071f2b] p-6 text-center text-white"><div><h1 className="text-2xl font-black">Presentation unavailable</h1><p className="mt-3 text-sm text-white/60">{error}</p></div></div>;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0a7465_0%,#073a42_36%,#071f2b_78%)] text-white">
      <header className="border-b border-white/10 bg-black/10 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">AZAAM Medics · Private Presentation</div>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">{gallery.title}</h1>
          </div>
          {gallery.media.length > 0 && (
            <button type="button" onClick={() => setPresentingIndex(0)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#ffb612] px-4 py-2.5 text-xs font-black text-[#073a42]"><Maximize2 className="h-4 w-4" /> Start Presentation</button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {gallery.description && <p className="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">{gallery.description}</p>}
        {gallery.audienceNote && <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/65">{gallery.audienceNote}</div>}

        {gallery.media.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-6 py-20 text-center text-white/55">No media has been added to this presentation yet.</div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.media.map((media, index) => (
              <button key={media.id} type="button" onClick={() => setPresentingIndex(index)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] text-left shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.09]">
                <div className="relative aspect-video overflow-hidden bg-black/70">
                  {media.type === 'VIDEO' ? (
                    <video src={resolvePresentationMediaUrl(media.url)} preload="metadata" muted className="h-full w-full object-contain" />
                  ) : (
                    <img src={resolvePresentationMediaUrl(media.url)} alt={media.title || media.originalName} loading="lazy" className="h-full w-full object-contain" />
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-[10px] font-black backdrop-blur">
                    {media.type === 'VIDEO' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}{media.type}
                  </span>
                </div>
                {(media.title || media.caption) && <div className="p-4"><h2 className="text-sm font-black">{media.title || media.originalName}</h2>{media.caption && <p className="mt-1 text-xs leading-5 text-white/60">{media.caption}</p>}</div>}
              </button>
            ))}
          </div>
        )}
      </main>

      {presentingIndex !== null && current && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
            <div className="min-w-0"><div className="truncate text-sm font-black">{current.title || gallery.title}</div><div className="text-[10px] text-white/45">{presentingIndex + 1} / {gallery.media.length}</div></div>
            <button type="button" onClick={() => setPresentingIndex(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
            {current.type === 'VIDEO' ? (
              <video src={resolvePresentationMediaUrl(current.url)} controls autoPlay playsInline className="max-h-full max-w-full object-contain" />
            ) : (
              <img src={resolvePresentationMediaUrl(current.url)} alt={current.title || current.originalName} className="max-h-full max-w-full object-contain" />
            )}
            {gallery.media.length > 1 && <>
              <button type="button" aria-label="Previous" onClick={() => setPresentingIndex((presentingIndex - 1 + gallery.media.length) % gallery.media.length)} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/70"><ChevronLeft className="h-7 w-7" /></button>
              <button type="button" aria-label="Next" onClick={() => setPresentingIndex((presentingIndex + 1) % gallery.media.length)} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/70"><ChevronRight className="h-7 w-7" /></button>
            </>}
          </div>
          {current.caption && <div className="border-t border-white/10 px-5 py-3 text-center text-xs leading-5 text-white/60">{current.caption}</div>}
        </div>
      )}
    </div>
  );
};
