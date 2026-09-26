import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Globe2,
  Image as ImageIcon,
  LayoutTemplate,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  UploadCloud,
  Users,
  Video,
} from 'lucide-react';
import {
  defaultLandingPageContent,
  GalleryItem,
  HospitalItem,
  LandingPageCmsService,
  LandingPageContent,
  MembershipItem,
  NewsItem,
  ProgramItem,
  RecognitionItem,
  TestimonialItem,
  VideoItem,
} from '../../services/landingPageCms.service';

type TabKey = 'hero' | 'strategy' | 'highlights' | 'programs' | 'testimonials' | 'media' | 'network' | 'recognitions' | 'sections' | 'branding' | 'seo';

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'hero', label: 'Hero', icon: LayoutTemplate },
  { key: 'strategy', label: 'Strategy & Values', icon: Globe2 },
  { key: 'highlights', label: 'AIMN Highlights', icon: LayoutTemplate },
  { key: 'programs', label: 'Training Programs', icon: LayoutTemplate },
  { key: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { key: 'media', label: 'Gallery & Videos', icon: ImageIcon },
  { key: 'network', label: 'Partners & Hospitals', icon: Users },
  { key: 'recognitions', label: 'Recognitions', icon: CheckCircle2 },
  { key: 'sections', label: 'Section Text', icon: LayoutTemplate },
  { key: 'branding', label: 'Header & Footer', icon: Globe2 },
  { key: 'seo', label: 'Contact & SEO', icon: Search },
];

const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }> = ({ label, value, onChange, placeholder, multiline }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
    ) : (
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
    )}
  </label>
);

const ImageField: React.FC<{ label: string; value: string; onChange: (value: string) => void; accept?: string; placeholder?: string; onError: (message: string) => void }> = ({ label, value, onChange, accept = 'image/*', placeholder, onError }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      const url = await LandingPageCmsService.uploadAsset(file);
      onChange(url);
    } catch (error: any) {
      onError(error?.response?.data?.error?.message || error.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'https://...'} className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ''; }} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60">
          <UploadCloud className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </label>
  );
};

const Card: React.FC<{ title: string; children: React.ReactNode; onDelete?: () => void }> = ({ title, children, onDelete }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="font-black text-slate-900">{title}</h3>
      {onDelete && <button onClick={onDelete} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100" title="Delete"><Trash2 className="h-4 w-4" /></button>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export const WebsiteManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [content, setContent] = useState<LandingPageContent>(defaultLandingPageContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    LandingPageCmsService.getAdmin()
      .then((result) => {
        setContent(result.content);
        setDraftUpdatedAt(result.draftUpdatedAt);
        setPublishedAt(result.publishedAt);
      })
      .catch((error) => setMessage(error?.response?.data?.error?.message || error.message || 'Unable to load website content.'))
      .finally(() => setLoading(false));
  }, []);

  const mark = (next: LandingPageContent) => {
    setContent(next);
    setDirty(true);
    setMessage('');
  };

  const showError = (text: string) => setMessage(text);

  const saveDraft = async () => {
    try {
      setSaving(true);
      const result = await LandingPageCmsService.saveDraft(content);
      setDraftUpdatedAt(result?.draftUpdatedAt || new Date().toISOString());
      setDirty(false);
      setMessage('Draft saved successfully.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not save draft.');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    try {
      setPublishing(true);
      if (dirty) await LandingPageCmsService.saveDraft(content);
      const result = await LandingPageCmsService.publish();
      setPublishedAt(result?.publishedAt || new Date().toISOString());
      setDirty(false);
      setMessage('Landing page published successfully.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not publish landing page.');
    } finally {
      setPublishing(false);
    }
  };

  const resetDraft = async () => {
    if (!window.confirm('Reset the draft to the AIMN default content? The currently published page will not change until you publish again.')) return;
    try {
      setSaving(true);
      const result = await LandingPageCmsService.resetDraft();
      setContent(result.content);
      setDraftUpdatedAt(result.draftUpdatedAt || new Date().toISOString());
      setDirty(false);
      setMessage('Draft reset to defaults. Publish when ready.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not reset draft.');
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (key: keyof LandingPageContent['hero'], value: string) => mark({ ...content, hero: { ...content.hero, [key]: value } });
  const updateContact = (key: keyof LandingPageContent['contact'], value: string) => mark({ ...content, contact: { ...content.contact, [key]: value } });
  const updateSeo = (key: keyof LandingPageContent['seo'], value: string) => mark({ ...content, seo: { ...content.seo, [key]: value } });

  const updateProgram = (index: number, key: keyof ProgramItem, value: string) => {
    const programs = content.programs.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, programs });
  };

  const updateNews = (index: number, key: keyof NewsItem, value: string) => {
    const news = content.news.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, news });
  };

  const updateGallery = (index: number, key: keyof GalleryItem, value: string) => {
    const gallery = content.gallery.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, gallery });
  };

  const updateVideo = (index: number, key: keyof VideoItem, value: string) => {
    const videos = content.videos.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, videos });
  };

  const updateMembership = (index: number, key: keyof MembershipItem, value: string) => {
    const memberships = content.memberships.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, memberships });
  };

  const updateHospital = (index: number, key: keyof HospitalItem, value: string) => {
    const hospitals = content.hospitals.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, hospitals });
  };

  const updateTestimonial = (index: number, key: keyof TestimonialItem, value: string) => {
    const testimonials = content.testimonials.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, testimonials });
  };

  const updateRecognition = (index: number, key: keyof RecognitionItem, value: string) => {
    const recognitions = content.recognitions.map((item, i) => i === index ? { ...item, [key]: value } : item);
    mark({ ...content, recognitions });
  };

  const updateSectionHeading = (key: keyof LandingPageContent['sectionHeadings'], value: string) =>
    mark({ ...content, sectionHeadings: { ...content.sectionHeadings, [key]: value } });

  const updateBranding = (key: keyof LandingPageContent['branding'], value: string) =>
    mark({ ...content, branding: { ...content.branding, [key]: value } });

  const updateFooter = (key: Exclude<keyof LandingPageContent['footer'], 'exploreLinks' | 'portalLinks'>, value: string) =>
    mark({ ...content, footer: { ...content.footer, [key]: value } });

  const updateNavigation = (index: number, key: 'label' | 'href', value: string) =>
    mark({ ...content, navigation: content.navigation.map((item, i) => i === index ? { ...item, [key]: value } : item) });

  const updateFooterLink = (group: 'exploreLinks' | 'portalLinks', index: number, key: 'label' | 'href', value: string) =>
    mark({
      ...content,
      footer: {
        ...content.footer,
        [group]: content.footer[group].map((item, i) => i === index ? { ...item, [key]: value } : item),
      },
    });

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-600">Loading website management...</div>;

  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-teal-950 p-5 text-white shadow-xl md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200"><Globe2 className="h-4 w-4" /> Website Management</div>
            <h1 className="mt-3 text-2xl font-black md:text-3xl">Landing Page CMS</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage the public landing page text, images, videos, programs, updates, contact details and SEO without editing code.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={resetDraft} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black hover:bg-white/15"><RefreshCw className="h-4 w-4" /> Reset Draft</button>
            <button onClick={() => window.open('/?preview=1', '_blank')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black hover:bg-white/15"><Eye className="h-4 w-4" /> Preview</button>
            <button onClick={saveDraft} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-slate-100"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Draft'}</button>
            <button onClick={publish} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-emerald-950 hover:bg-emerald-300"><Send className="h-4 w-4" /> {publishing ? 'Publishing...' : 'Publish'}</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3"><span className="text-slate-400">Draft</span><p className="mt-1 font-black">{dirty ? 'Unsaved changes' : draftUpdatedAt ? new Date(draftUpdatedAt).toLocaleString() : 'Default content'}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3"><span className="text-slate-400">Published</span><p className="mt-1 font-black">{publishedAt ? new Date(publishedAt).toLocaleString() : 'Default public version'}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3"><span className="text-slate-400">Media</span><p className="mt-1 font-black">{content.gallery.length} images • {content.videos.length} videos</p></div>
        </div>
      </section>

      {message && <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${message.toLowerCase().includes('success') || message.toLowerCase().includes('saved') || message.toLowerCase().includes('published') || message.toLowerCase().includes('reset') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><CheckCircle2 className="h-4 w-4" />{message}</div>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setActiveTab(key)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${activeTab === key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
      </div>

      {activeTab === 'hero' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card title="Hero content">
            <Field label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => updateHero('eyebrow', v)} />
            <div className="grid gap-3 sm:grid-cols-2">
              {content.hero.titleLines.map((line, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1"><Field label={`Title line ${index + 1}`} value={line} onChange={(value) => mark({ ...content, hero: { ...content.hero, titleLines: content.hero.titleLines.map((item, i) => i === index ? value : item) } })} /></div>
                  <button type="button" aria-label={`Remove title line ${index + 1}`} onClick={() => mark({ ...content, hero: { ...content.hero, titleLines: content.hero.titleLines.filter((_, i) => i !== index) } })} className="mb-1 rounded-lg bg-rose-50 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => mark({ ...content, hero: { ...content.hero, titleLines: [...content.hero.titleLines, 'New title line'] } })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add title line</button>
            <Field label="Subtitle" value={content.hero.subtitle} onChange={(v) => updateHero('subtitle', v)} multiline />
            <Field label="Trust text" value={content.hero.trustText} onChange={(v) => updateHero('trustText', v)} />
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Primary button text" value={content.hero.primaryButtonText} onChange={(v) => updateHero('primaryButtonText', v)} /><Field label="Primary button link" value={content.hero.primaryButtonUrl} onChange={(v) => updateHero('primaryButtonUrl', v)} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Secondary button text" value={content.hero.secondaryButtonText} onChange={(v) => updateHero('secondaryButtonText', v)} /><Field label="Secondary button link" value={content.hero.secondaryButtonUrl} onChange={(v) => updateHero('secondaryButtonUrl', v)} /></div>
          </Card>
          <Card title="Organization video">
            <Field label="YouTube or MP4 URL" value={content.hero.backgroundVideo} onChange={(v) => updateHero('backgroundVideo', v)} placeholder="https://www.youtube.com/watch?v=... or MP4 URL" />
            <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">This video appears inside the hero section and plays on the website without sending visitors away from the landing page.</p>
          </Card>
          <div className="lg:col-span-2"><Card title="Live hero counter labels">
            <p className="text-sm leading-6 text-slate-600">The numbers are counted automatically from Partners, Hospitals, Recognitions and Training Programs. Edit only the labels below.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Universities label" value={content.hero.statsLabels.universities} onChange={(value) => mark({ ...content, hero: { ...content.hero, statsLabels: { ...content.hero.statsLabels, universities: value } } })} />
              <Field label="Hospitals label" value={content.hero.statsLabels.hospitals} onChange={(value) => mark({ ...content, hero: { ...content.hero, statsLabels: { ...content.hero.statsLabels, hospitals: value } } })} />
              <Field label="Recognitions label" value={content.hero.statsLabels.recognitions} onChange={(value) => mark({ ...content, hero: { ...content.hero, statsLabels: { ...content.hero.statsLabels, recognitions: value } } })} />
              <Field label="Programs label" value={content.hero.statsLabels.programs} onChange={(value) => mark({ ...content, hero: { ...content.hero, statsLabels: { ...content.hero.statsLabels, programs: value } } })} />
            </div>
          </Card></div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Our Vision">
            <Field label="Vision" value={content.strategy.vision} onChange={(vision) => mark({ ...content, strategy: { ...content.strategy, vision } })} multiline />
          </Card>
          <Card title="Our Mission">
            {content.strategy.mission.map((item, index) => <div key={index} className="flex items-start gap-2"><div className="flex-1"><Field label={`Mission point ${index + 1}`} value={item} onChange={(value) => mark({ ...content, strategy: { ...content.strategy, mission: content.strategy.mission.map((point, i) => i === index ? value : point) } })} multiline /></div><button type="button" aria-label={`Remove mission point ${index + 1}`} onClick={() => mark({ ...content, strategy: { ...content.strategy, mission: content.strategy.mission.filter((_, i) => i !== index) } })} className="mt-7 rounded-lg bg-rose-50 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}
            <button type="button" onClick={() => mark({ ...content, strategy: { ...content.strategy, mission: [...content.strategy.mission, ''] } })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add mission point</button>
          </Card>
          <Card title="Core Values">
            {content.strategy.values.map((item, index) => <div key={index} className="flex items-end gap-2"><div className="flex-1"><Field label={`Value ${index + 1}`} value={item} onChange={(value) => mark({ ...content, strategy: { ...content.strategy, values: content.strategy.values.map((v, i) => i === index ? value : v) } })} /></div><button type="button" aria-label={`Remove value ${index + 1}`} onClick={() => mark({ ...content, strategy: { ...content.strategy, values: content.strategy.values.filter((_, i) => i !== index) } })} className="mb-1 rounded-lg bg-rose-50 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}
            <button type="button" onClick={() => mark({ ...content, strategy: { ...content.strategy, values: [...content.strategy.values, ''] } })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add value</button>
          </Card>
        </div>
      )}

      {activeTab === 'highlights' && (
        <Card title="AIMN Highlights · eight tiles around the AIMN logo">
          <p className="text-sm text-slate-600">Set the value and label for each tile. The logo stays in the centre.</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {content.aimnHighlights.slice(0, 8).map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><p className="mb-3 text-xs font-black text-slate-500">Tile {index + 1}</p><div className="space-y-3"><Field label="Value" value={item.value} onChange={(value) => mark({ ...content, aimnHighlights: content.aimnHighlights.map((current, i) => i === index ? { ...current, value } : current) })} /><Field label="Label" value={item.label} onChange={(label) => mark({ ...content, aimnHighlights: content.aimnHighlights.map((current, i) => i === index ? { ...current, label } : current) })} /></div></div>)}
          </div>
        </Card>
      )}

      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => mark({...content,programs:[...content.programs,{title:'New Program',image:'',link:'/register'}]})} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add program</button></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {content.programs.map((program,index) => <Card key={index} title={`Program ${index+1}`} onDelete={() => mark({...content,programs:content.programs.filter((_,i)=>i!==index)})}><Field label="Title" value={program.title} onChange={(v)=>updateProgram(index,'title',v)} /><ImageField label="Image" value={program.image} onChange={(v)=>updateProgram(index,'image',v)} onError={showError} /><Field label="Button link" value={program.link} onChange={(v)=>updateProgram(index,'link',v)} />{program.image && <img src={program.image} alt="" className="h-36 w-full rounded-xl object-cover" />}</Card>)}
          </div>
        </div>
      )}

      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-black text-slate-900">Testimonials</h2><p className="mt-1 text-sm text-slate-600">Manage every person, portrait, title, organization, rating and quote shown in the testimonial carousel.</p></div>
            <button type="button" onClick={() => mark({ ...content, testimonials: [...content.testimonials, { name: 'New testimonial', role: '', organization: '', image: '', rating: '5', quote: '' }] })} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add testimonial</button>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {content.testimonials.map((item, index) => (
              <Card key={index} title={`Testimonial ${index + 1}`} onDelete={() => mark({ ...content, testimonials: content.testimonials.filter((_, i) => i !== index) })}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" value={item.name} onChange={(v) => updateTestimonial(index, 'name', v)} />
                  <Field label="Title / Role" value={item.role} onChange={(v) => updateTestimonial(index, 'role', v)} />
                </div>
                <Field label="Organization / University" value={item.organization} onChange={(v) => updateTestimonial(index, 'organization', v)} />
                <ImageField label="Portrait image" value={item.image} onChange={(v) => updateTestimonial(index, 'image', v)} onError={showError} />
                <Field label="Rating (1–5)" value={item.rating} onChange={(v) => updateTestimonial(index, 'rating', v)} />
                <Field label="Testimonial quote" value={item.quote} onChange={(v) => updateTestimonial(index, 'quote', v)} multiline />
                {item.image && <img src={item.image} alt="" className="h-44 w-full rounded-xl object-cover object-top" />}
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-black text-slate-900">Gallery images</h2><button onClick={() => mark({...content,gallery:[...content.gallery,{title:'',image:'',caption:''}]})} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add image</button></div>
            {content.gallery.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No gallery images yet.</div>}
            {content.gallery.map((item,index)=><Card key={index} title={`Gallery image ${index+1}`} onDelete={()=>mark({...content,gallery:content.gallery.filter((_,i)=>i!==index)})}><Field label="Title" value={item.title} onChange={(v)=>updateGallery(index,'title',v)} /><ImageField label="Image" value={item.image} onChange={(v)=>updateGallery(index,'image',v)} onError={showError} /><Field label="Caption" value={item.caption} onChange={(v)=>updateGallery(index,'caption',v)} multiline />{item.image&&<img src={item.image} alt="" className="h-40 w-full rounded-xl object-cover" />}</Card>)}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-black text-slate-900">Videos</h2><button onClick={() => mark({...content,videos:[...content.videos,{title:'',url:'',thumbnail:'',description:''}]})} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add video</button></div>
            {content.videos.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500"><Video className="mx-auto mb-2 h-8 w-8" />No videos yet.</div>}
            {content.videos.map((item,index)=><Card key={index} title={`Video ${index+1}`} onDelete={()=>mark({...content,videos:content.videos.filter((_,i)=>i!==index)})}><Field label="Title" value={item.title} onChange={(v)=>updateVideo(index,'title',v)} /><ImageField label="Video (YouTube link or upload a file)" value={item.url} onChange={(v)=>updateVideo(index,'url',v)} accept="video/*" placeholder="YouTube or MP4 URL" onError={showError} /><ImageField label="Thumbnail" value={item.thumbnail} onChange={(v)=>updateVideo(index,'thumbnail',v)} onError={showError} /><Field label="Description" value={item.description} onChange={(v)=>updateVideo(index,'description',v)} multiline /></Card>)}
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="max-w-3xl space-y-5">
          <Card title="Our Partners">
            <p className="text-sm leading-6 text-slate-600">Add confirmed organizations with their logos. The logos scroll across the page; View more reveals the full list.</p>
            {content.memberships.map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><div className="space-y-3"><Field label="Organization name" value={item.name} onChange={(v) => updateMembership(index, 'name', v)} /><ImageField label="Organization logo" value={item.logo} onChange={(v) => updateMembership(index, 'logo', v)} onError={showError} /><Field label="Website URL (optional)" value={item.url} onChange={(v) => updateMembership(index, 'url', v)} /></div><div className="mt-3 flex items-center justify-between gap-3">{item.logo && <img src={item.logo} alt="" className="h-12 w-24 object-contain" />}<button type="button" onClick={() => mark({ ...content, memberships: content.memberships.filter((_, i) => i !== index) })} className="ml-auto text-xs font-bold text-rose-600">Remove</button></div></div>)}
            <button type="button" onClick={() => mark({ ...content, memberships: [...content.memberships, { name: '', logo: '', url: '' }] })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add organization</button>
          </Card>
          <Card title="Our Training Hospitals">
            <p className="text-sm leading-6 text-slate-600">Add hospitals where students undertake supervised clinical training. They appear below the university partners on the landing page.</p>
            {content.hospitals.map((hospital, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-3">
                <Field label="Hospital name" value={hospital.name} onChange={(value) => updateHospital(index, 'name', value)} />
                <ImageField label="Hospital image or emblem" value={hospital.image} onChange={(value) => updateHospital(index, 'image', value)} onError={showError} />
                <Field label="Location" value={hospital.location} onChange={(value) => updateHospital(index, 'location', value)} />
                <Field label="Description" value={hospital.description} onChange={(value) => updateHospital(index, 'description', value)} multiline />
                <Field label="Hospital website" value={hospital.url} onChange={(value) => updateHospital(index, 'url', value)} />
                <div className="flex items-center justify-between gap-3">
                  {hospital.image && <img src={hospital.image} alt="" className="h-12 w-16 object-contain" />}
                  <button type="button" onClick={() => mark({ ...content, hospitals: content.hospitals.filter((_, i) => i !== index) })} className="ml-auto text-xs font-bold text-rose-600">Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => mark({ ...content, hospitals: [...content.hospitals, { name: '', image: '', location: '', description: '', url: '' }] })} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Add hospital</button>
          </Card>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Contact information"><Field label="Email" value={content.contact.email} onChange={(v)=>updateContact('email',v)} /><Field label="Phone" value={content.contact.phone} onChange={(v)=>updateContact('phone',v)} /><Field label="Address" value={content.contact.address} onChange={(v)=>updateContact('address',v)} multiline /></Card>
          <Card title="SEO & social sharing"><Field label="Browser / SEO title" value={content.seo.title} onChange={(v)=>updateSeo('title',v)} /><Field label="Meta description" value={content.seo.description} onChange={(v)=>updateSeo('description',v)} multiline /><ImageField label="Social share image" value={content.seo.shareImage} onChange={(v)=>updateSeo('shareImage',v)} onError={showError} />{content.seo.shareImage&&<img src={content.seo.shareImage} alt="" className="h-36 w-full rounded-xl object-cover" />}</Card>
        </div>
      )}

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
        <p className="text-xs font-bold text-slate-500">{dirty ? 'You have unsaved changes.' : 'All draft changes are saved.'}</p>
        <div className="flex gap-2"><button onClick={saveDraft} disabled={saving||publishing} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white"><Save className="h-4 w-4" /> Save Draft</button><button onClick={publish} disabled={saving||publishing} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white"><Send className="h-4 w-4" /> Publish</button></div>
      </div>
    </div>
  );
};
