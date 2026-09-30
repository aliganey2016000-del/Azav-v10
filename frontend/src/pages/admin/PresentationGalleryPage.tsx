import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  PresentationGallery,
  PresentationGalleryService,
  resolvePresentationMediaUrl,
} from '../../services/presentationGallery.service';

type ModalMode = 'create' | 'edit' | null;

type PresentationForm = {
  title: string;
  description: string;
};

const emptyForm: PresentationForm = { title: '', description: '' };

export const PresentationGalleryPage: React.FC = () => {
  const [galleries, setGalleries] = useState<PresentationGallery[]>([]);
  const [selected, setSelected] = useState<PresentationGallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<PresentationForm>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (preferredId?: string) => {
    try {
      setLoading(true);
      const items = await PresentationGalleryService.list();
      setGalleries(items);
      const preferred = preferredId || selected?.id;
      setSelected(items.find((item) => item.id === preferred) || items[0] || null);
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

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEditModal = (gallery: PresentationGallery) => {
    setSelected(gallery);
    setForm({
      title: gallery.title || '',
      description: gallery.description || '',
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    if (busy) return;
    setModalMode(null);
    setForm(emptyForm);
  };

  const saveModal = async () => {
    const title = form.title.trim();
    if (!title) {
      setMessage('Presentation title is required.');
      return;
    }

    try {
      setBusy(true);
      if (modalMode === 'create') {
        const gallery = await PresentationGalleryService.create({
          title,
          description: form.description.trim(),
        });
        setGalleries((items) => [gallery, ...items]);
        setSelected(gallery);
        setMessage('Presentation created successfully.');
      } else if (modalMode === 'edit' && selected) {
        const gallery = await PresentationGalleryService.update(selected.id, {
          title,
          description: form.description.trim(),
        });
        syncSelected(gallery);
        setMessage('Presentation updated successfully.');
      }
      setModalMode(null);
      setForm(emptyForm);
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not save presentation.');
    } finally {
      setBusy(false);
    }
  };

  const deleteGallery = async (gallery: PresentationGallery) => {
    if (!window.confirm(`Delete "${gallery.title}" and all of its private media?`)) return;
    try {
      setBusy(true);
      await PresentationGalleryService.remove(gallery.id);
      const remaining = galleries.filter((item) => item.id !== gallery.id);
      setGalleries(remaining);
      if (selected?.id === gallery.id) setSelected(remaining[0] || null);
      setMessage('Presentation deleted.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not delete presentation.');
    } finally {
      setBusy(false);
    }
  };

  const updateLinkStatus = async () => {
    if (!selected) return;
    try {
      setBusy(true);
      const gallery = await PresentationGalleryService.update(selected.id, { isActive: !selected.isActive });
      syncSelected(gallery);
      setMessage(gallery.isActive ? 'Private link activated.' : 'Private link disabled.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not update link status.');
    } finally {
      setBusy(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    try {
      setBusy(true);
      let current = selected;
      for (const mediaFile of Array.from(files)) {
        current = await PresentationGalleryService.upload(selected.id, mediaFile);
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
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not generate a new link.');
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Loading private presentation gallery...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 rounded-3xl bg-gradient-to-r from-[#063f38] to-[#0b6d60] p-5 text-white shadow-lg sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
            <ShieldCheck className="h-4 w-4" /> Super Admin Only
          </div>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Private Presentation Gallery</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            Create private presentations with photos and videos. This area is completely separate from the public website gallery.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffb612] px-5 py-3 text-sm font-black text-[#063f38] shadow-sm transition hover:bg-[#ffc337] sm:w-auto"
        >
          <Plus className="h-5 w-5" /> Create Presentation
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Presentations</h2>
            <p className="mt-1 text-xs text-slate-500">Select a presentation to view its private link, photos and videos.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {galleries.length} total
          </span>
        </div>

        {galleries.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">No presentations yet</p>
            <p className="mt-1 text-xs text-slate-500">Use Create Presentation to add your first private presentation.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {galleries.map((gallery) => {
              const active = selected?.id === gallery.id;
              return (
                <div
                  key={gallery.id}
                  className={`group flex flex-col gap-3 px-4 py-4 transition sm:px-5 md:flex-row md:items-center ${active ? 'bg-teal-50/80 dark:bg-teal-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(gallery)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${gallery.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{gallery.title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-1 pl-[18px] text-xs text-slate-500">
                      {gallery.description || 'No description'}
                    </p>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 sm:flex sm:items-center sm:gap-5">
                    <div><span className="font-black text-slate-700 dark:text-slate-300">{gallery.media.length}</span> media</div>
                    <div>Updated {formatDate(gallery.updatedAt)}</div>
                  </div>

                  <div className="flex gap-2 md:ml-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(gallery)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-300 hover:text-teal-700 md:flex-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGallery(gallery)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 md:flex-none dark:bg-rose-950/30 dark:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selected ? (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">Selected Presentation</div>
                <h2 className="mt-1 break-words text-xl font-black text-slate-950 sm:text-2xl dark:text-white">{selected.title}</h2>
                <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selected.description || 'No description has been added.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selected)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={updateLinkStatus}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black ${selected.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {selected.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {selected.isActive ? 'Link Active' : 'Link Disabled'}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <Link2 className="h-4 w-4" /> Private presentation link
              </div>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row">
                <input
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-900"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
                <button
                  type="button"
                  onClick={regenerate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  <RefreshCw className="h-4 w-4" /> New Link
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Share this private link only with the people you want to view this presentation. New Link immediately replaces the old link.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-900 dark:text-white">Presentation Media</h2>
                <p className="mt-1 text-xs text-slate-500">Private photos and videos only. Maximum 32MB per file.</p>
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadFiles(e.target.files)}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-sm disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" /> {busy ? 'Working...' : 'Upload photos / videos'}
                </button>
              </div>
            </div>

            {selected.media.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center dark:border-slate-700">
                <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No private media yet</p>
                <p className="mt-1 text-xs text-slate-400">Upload the photos and videos you want to use in this presentation.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {selected.media.map((media) => (
                  <article
                    key={media.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <div className="relative aspect-video bg-slate-950">
                      {media.type === 'VIDEO' ? (
                        <video
                          src={resolvePresentationMediaUrl(media.url)}
                          controls
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img
                          src={resolvePresentationMediaUrl(media.url)}
                          alt={media.title || media.originalName}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      )}
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[9px] font-black text-white backdrop-blur">
                        {media.type === 'VIDEO' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        {media.type}
                      </span>
                      <button
                        type="button"
                        onClick={async () => syncSelected(await PresentationGalleryService.removeMedia(selected.id, media.id))}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete media"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                        {media.title || media.originalName}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          Select a presentation from the list to view its content.
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="presentation-modal-title"
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1b2c]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-slate-700">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
                  {modalMode === 'create' ? 'New Presentation' : 'Edit Presentation'}
                </div>
                <h2 id="presentation-modal-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                  {modalMode === 'create' ? 'Create Presentation' : 'Update Presentation'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">Presentation title</span>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  placeholder="Enter presentation title"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  placeholder="Briefly describe this presentation"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-700 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={closeModal}
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModal}
                disabled={busy || !form.title.trim()}
                className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Saving...' : 'Save Presentation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
