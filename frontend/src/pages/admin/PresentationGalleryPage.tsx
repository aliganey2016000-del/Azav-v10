import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  PresentationGallery,
  PresentationGalleryService,
  resolvePresentationMediaUrl,
} from '../../services/presentationGallery.service';

export const PresentationGalleryPage: React.FC = () => {
  const [galleries, setGalleries] = useState<PresentationGallery[]>([]);
  const [selected, setSelected] = useState<PresentationGallery | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (preferredId?: string) => {
    try {
      setLoading(true);
      const items = await PresentationGalleryService.list();
      setGalleries(items);
      const next = items.find((item) => item.id === (preferredId || selected?.id)) || items[0] || null;
      setSelected(next);
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Unable to load presentation galleries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const syncSelected = (gallery: PresentationGallery) => {
    setSelected(gallery);
    setGalleries((items) => items.map((item) => item.id === gallery.id ? gallery : item));
  };

  const createGallery = async () => {
    if (!newTitle.trim()) return;
    try {
      setBusy(true);
      const gallery = await PresentationGalleryService.create({ title: newTitle.trim() });
      setNewTitle('');
      setGalleries((items) => [gallery, ...items]);
      setSelected(gallery);
      setMessage('Private presentation created.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not create presentation.');
    } finally {
      setBusy(false);
    }
  };

  const savePatch = async (patch: any) => {
    if (!selected) return;
    try {
      setBusy(true);
      const gallery = await PresentationGalleryService.update(selected.id, patch);
      syncSelected(gallery);
      setMessage('Presentation updated.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not update presentation.');
    } finally {
      setBusy(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    try {
      setBusy(true);
      let current = selected;
      for (const file of Array.from(files)) {
        current = await PresentationGalleryService.upload(selected.id, file);
      }
      syncSelected(current);
      setMessage(`${files.length} media file(s) uploaded.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Upload failed.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const shareUrl = selected?.sharePath ? `${window.location.origin}${selected.sharePath}` : '';

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage('Private share link copied.');
  };

  const regenerate = async () => {
    if (!selected || !window.confirm('Generate a new private link? The old link will stop working.')) return;
    try {
      setBusy(true);
      const gallery = await PresentationGalleryService.regenerateLink(selected.id);
      syncSelected(gallery);
      setMessage('New private link generated. The previous link is no longer valid.');
    } finally {
      setBusy(false);
    }
  };

  const deleteGallery = async () => {
    if (!selected || !window.confirm(`Delete "${selected.title}" and all of its private media?`)) return;
    try {
      setBusy(true);
      await PresentationGalleryService.remove(selected.id);
      setSelected(null);
      await load();
      setMessage('Presentation deleted.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading private presentation gallery...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-[#063f38] to-[#0b6d60] p-5 text-white shadow-lg sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200"><ShieldCheck className="h-4 w-4" /> Super Admin Only</div>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Private Presentation Gallery</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">A separate private space for presentation photos and videos. Nothing here is added to the public website gallery.</p>
        </div>
        <div className="flex w-full max-w-md gap-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createGallery()} placeholder="New presentation title" className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:bg-white/15" />
          <button type="button" disabled={busy || !newTitle.trim()} onClick={createGallery} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#ffb612] px-4 py-3 text-xs font-black text-[#063f38] disabled:opacity-50"><Plus className="h-4 w-4" /> Create</button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Presentations</div>
          <div className="space-y-2">
            {galleries.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">Create your first private presentation.</div>}
            {galleries.map((gallery) => (
              <button key={gallery.id} type="button" onClick={() => setSelected(gallery)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === gallery.id ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900 dark:text-white">{gallery.title}</div>
                    <div className="mt-1 text-[10px] text-slate-500">{gallery.media.length} media item(s)</div>
                  </div>
                  <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${gallery.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        {selected ? (
          <section className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Presentation title</span>
                    <input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} onBlur={() => savePatch({ title: selected.title })} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Description</span>
                    <textarea value={selected.description} onChange={(e) => setSelected({ ...selected, description: e.target.value })} onBlur={() => savePatch({ description: selected.description })} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => savePatch({ isActive: !selected.isActive })} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black ${selected.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {selected.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {selected.isActive ? 'Link Active' : 'Link Disabled'}
                  </button>
                  <button type="button" onClick={deleteGallery} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-black text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"><Trash2 className="h-4 w-4" /> Delete</button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950/50">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500"><Link2 className="h-4 w-4" /> Private presentation link</div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" />
                  <button type="button" onClick={copyShareLink} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-900"><Copy className="h-4 w-4" /> Copy</button>
                  <a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><ExternalLink className="h-4 w-4" /> Open</a>
                  <button type="button" onClick={regenerate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"><RefreshCw className="h-4 w-4" /> New link</button>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">Only people you send this unlisted link to can open the presentation. Disable the link or generate a new one at any time.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white">Presentation Media</h2>
                  <p className="mt-1 text-xs text-slate-500">Private photos and videos only. Maximum 32MB per file.</p>
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
                  <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-sm disabled:opacity-50"><UploadCloud className="h-4 w-4" /> {busy ? 'Working...' : 'Upload photos / videos'}</button>
                </div>
              </div>

              {selected.media.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center dark:border-slate-700">
                  <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No private media yet</p>
                  <p className="mt-1 text-xs text-slate-400">Upload the photos and videos you want to use in presentations.</p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {selected.media.map((media) => (
                    <article key={media.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                      <div className="relative aspect-video bg-slate-950">
                        {media.type === 'VIDEO' ? (
                          <video src={resolvePresentationMediaUrl(media.url)} controls preload="metadata" className="h-full w-full object-contain" />
                        ) : (
                          <img src={resolvePresentationMediaUrl(media.url)} alt={media.title || media.originalName} loading="lazy" className="h-full w-full object-contain" />
                        )}
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-black text-white backdrop-blur">
                          {media.type === 'VIDEO' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                          {media.type}
                        </span>
                        <button type="button" onClick={async () => syncSelected(await PresentationGalleryService.removeMedia(selected.id, media.id))} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label="Delete media"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="p-3">
                        <div className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{media.title || media.originalName}</div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">Create or select a presentation.</div>
        )}
      </div>
    </div>
  );
};
