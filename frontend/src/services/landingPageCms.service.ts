import api from './api';

export type HighlightItem = { label: string; value: string };
export type ProgramItem = { title: string; image: string; link: string };
export type NewsItem = { title: string; label: string; summary: string; image: string; link: string };
export type GalleryItem = { title: string; image: string; caption: string };
export type VideoItem = { title: string; url: string; thumbnail: string; description: string };
export type MembershipItem = { name: string; logo: string; url: string };

export type LandingPageContent = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    backgroundImage: string;
    backgroundVideo: string;
    primaryButtonText: string;
    primaryButtonUrl: string;
    secondaryButtonText: string;
    secondaryButtonUrl: string;
  };
  highlights: HighlightItem[];
  aimnHighlights: HighlightItem[];
  about: {
    eyebrow: string;
    bannerTitle: string;
    title: string;
    paragraphs: string[];
    images: string[];
    establishedIn: string;
    location: string;
    experienceYears: string;
  };
  strategy: {
    vision: string;
    mission: string[];
    values: string[];
  };
  programs: ProgramItem[];
  news: NewsItem[];
  gallery: GalleryItem[];
  videos: VideoItem[];
  networkRoles: string[];
  memberships: MembershipItem[];
  membershipSeedVersion: number;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  seo: {
    title: string;
    description: string;
    shareImage: string;
  };
};

export const defaultLandingPageContent: LandingPageContent = {
  hero: {
    eyebrow: 'Clinical excellence without borders',
    title: 'AZAAM International Medics Network (AIMN)',
    subtitle: 'AIMN is an international medical education and clinical attachment network committed to quality training, trusted partnerships, and stronger healthcare practice.',
    backgroundImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85',
    backgroundVideo: '',
    primaryButtonText: 'Apply Now',
    primaryButtonUrl: '/register',
    secondaryButtonText: 'Verify Certificate',
    secondaryButtonUrl: '/verify-certificate',
  },
  highlights: [
    { label: 'YEARS OF EXPERIENCE', value: '15+' },
    { label: 'ESTABLISHED', value: '2011' },
    { label: 'CLINICAL SPECIALTY AREAS', value: '10+' },
    { label: 'PLACEMENT SUCCESS RATE', value: '92%' },
  ],
  aimnHighlights: [
    { label: 'YEARS OF EXPERIENCE', value: '15+' },
    { label: 'ESTABLISHED', value: '2011' },
    { label: 'CLINICAL SPECIALTY AREAS', value: '10+' },
    { label: 'PLACEMENT SUCCESS RATE', value: '92%' },
    { label: 'MEDICAL NETWORK', value: 'International' },
    { label: 'CLINICAL ROTATIONS', value: 'Supervised' },
    { label: 'HOST INSTITUTIONS', value: 'Approved' },
    { label: 'CERTIFICATES', value: 'Verified' },
  ],
  about: {
    eyebrow: 'About AIMN',
    bannerTitle: 'About Us',
    title: 'International medical training with purpose.',
    paragraphs: [
      'AZAAM International Medics Network (AIMN) delivers quality clinical attachment and medical training experiences that blend academic strength with supervised practical learning.',
      'Our network connects students, universities, hospitals, and clinical supervisors to produce experienced, engaged, and confident healthcare professionals.',
    ],
    images: [
      'https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    ],
    establishedIn: '2011',
    location: 'Mogadishu, Somalia',
    experienceYears: '15+',
  },
  strategy: {
    vision: 'To become a trusted international network for clinical education, connecting aspiring healthcare professionals with high-quality supervised training.',
    mission: [
      'To connect students and universities with approved hospitals and clinical supervisors.',
      'To deliver practical training that strengthens clinical skills and patient care.',
      'To support ethical, accountable partnerships across healthcare institutions.',
    ],
    values: ['Integrity', 'Clinical Excellence', 'Innovation', 'Accountability', 'Social Responsibility'],
  },
  programs: [
    { title: 'Internal Medicine', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=85', link: '/register' },
    { title: 'Surgery & Emergency Medicine', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=85', link: '/register' },
    { title: 'Pediatrics', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=85', link: '/register' },
    { title: 'Obstetrics & Gynecology', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=85', link: '/register' },
  ],
  news: [
    { title: 'Clinical attachment applications are now open for university-nominated students', label: 'Placement update', summary: 'Universities can nominate eligible students through the AIMN university portal.', image: '', link: '/login' },
    { title: 'AIMN coordinates international clinical training with approved host institutions', label: 'Network update', summary: 'Structured coordination connects universities, trainees and approved host institutions.', image: '', link: '/login' },
    { title: 'Supporting safe, ethical, and supervised practical learning', label: 'Quality update', summary: 'Clinical learning is coordinated around supervision, documentation and quality monitoring.', image: '', link: '/login' },
  ],
  gallery: [],
  videos: [],
  networkRoles: [
    'Sending universities',
    'Approved host institutions',
    'Qualified clinical supervisors',
    'Hospitals and health facilities',
    'Academic coordinators',
    'Professional networks',
    'Uganda and East Africa',
    'Asia and other agreed destinations',
    'Research collaborators',
    'Quality and compliance stakeholders',
  ],
  memberships: [
    { name: 'Zamzam University of Science & Technology', logo: '/memberships/zamzam.png', url: '' },
    { name: 'Mogadishu University', logo: '/memberships/mogadishu.jpg', url: '' },
    { name: 'Jazeera University', logo: '/memberships/jazeera.jpg', url: '' },
    { name: 'Kismayo University', logo: '/memberships/kismayo.png', url: '' },
    { name: 'Red Sea University', logo: '/memberships/red-sea.jpg', url: '' },
    { name: 'East Africa University', logo: '/memberships/east-africa.png', url: '' },
    { name: 'University of Bosaso', logo: '/memberships/bosaso.png', url: '' },
    { name: 'Salaam University', logo: '/memberships/salaam.png', url: '' },
    { name: 'Aden Adde International University', logo: '/memberships/aden-adde.png', url: 'https://aaiu.edu.so/' },
    { name: 'Jamhuriya University of Science and Technology', logo: '/memberships/jamhuriya.png', url: 'https://www.just.edu.so/' },
    { name: 'Benadir University', logo: '/memberships/benadir.png', url: 'https://bu.edu.so/' },
    { name: 'Jobkey University', logo: '/memberships/jobkey.png', url: 'https://jobkey.edu.so/v2/' },
  ],
  membershipSeedVersion: 2,
  contact: {
    email: 'info@azaammedics.org',
    phone: '',
    address: '',
  },
  seo: {
    title: 'AZAAM International Medics Network',
    description: 'International medical education, clinical attachments and supervised healthcare training.',
    shareImage: '',
  },
};

const mergeMemberships = (value: Partial<LandingPageContent> | undefined): MembershipItem[] => {
  const existing = value?.memberships;
  if (!Array.isArray(existing)) return defaultLandingPageContent.memberships;
  if ((value?.membershipSeedVersion || 0) >= 2) return existing;
  if (existing.length === 0) return defaultLandingPageContent.memberships;
  const newlyAdded = defaultLandingPageContent.memberships.slice(8).filter((item) =>
    !existing.some((member) => member.name?.toLowerCase() === item.name.toLowerCase()),
  );
  return [...existing, ...newlyAdded];
};

const mergeWithDefaults = (value: Partial<LandingPageContent> | undefined): LandingPageContent => ({
  ...defaultLandingPageContent,
  ...(value || {}),
  hero: { ...defaultLandingPageContent.hero, ...(value?.hero || {}) },
  about: { ...defaultLandingPageContent.about, ...(value?.about || {}) },
  strategy: { ...defaultLandingPageContent.strategy, ...(value?.strategy || {}) },
  contact: { ...defaultLandingPageContent.contact, ...(value?.contact || {}) },
  seo: { ...defaultLandingPageContent.seo, ...(value?.seo || {}) },
  highlights: Array.isArray(value?.highlights) ? value!.highlights : defaultLandingPageContent.highlights,
  aimnHighlights: Array.isArray(value?.aimnHighlights) ? value!.aimnHighlights : defaultLandingPageContent.aimnHighlights,
  programs: Array.isArray(value?.programs) ? value!.programs : defaultLandingPageContent.programs,
  news: Array.isArray(value?.news) ? value!.news : defaultLandingPageContent.news,
  gallery: Array.isArray(value?.gallery) ? value!.gallery : defaultLandingPageContent.gallery,
  videos: Array.isArray(value?.videos) ? value!.videos : defaultLandingPageContent.videos,
  networkRoles: Array.isArray(value?.networkRoles) ? value!.networkRoles : defaultLandingPageContent.networkRoles,
  memberships: mergeMemberships(value),
  membershipSeedVersion: 2,
});

export const LandingPageCmsService = {
  async getPublic(): Promise<LandingPageContent> {
    const response = await api.get('/landing-page');
    return mergeWithDefaults(response.data?.data?.content);
  },

  async getPreview(): Promise<LandingPageContent> {
    const response = await api.get('/landing-page/preview');
    return mergeWithDefaults(response.data?.data?.content);
  },

  async getAdmin(): Promise<{ content: LandingPageContent; draftUpdatedAt: string | null; publishedAt: string | null; hasPublishedVersion: boolean }> {
    const response = await api.get('/landing-page/admin');
    const data = response.data?.data || {};
    return {
      content: mergeWithDefaults(data.content),
      draftUpdatedAt: data.draftUpdatedAt || null,
      publishedAt: data.publishedAt || null,
      hasPublishedVersion: Boolean(data.hasPublishedVersion),
    };
  },

  async saveDraft(content: LandingPageContent) {
    const response = await api.put('/landing-page/admin/draft', { content });
    return response.data?.data;
  },

  async publish() {
    const response = await api.post('/landing-page/admin/publish');
    return response.data?.data;
  },

  async resetDraft() {
    const response = await api.post('/landing-page/admin/reset');
    return {
      ...response.data?.data,
      content: mergeWithDefaults(response.data?.data?.content),
    };
  },

  async uploadAsset(file: File): Promise<string> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await api.post('/site-assets/upload', {
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64Data,
    });

    const path = response.data?.data?.url as string;
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '';
    return `${apiBase}${path}`;
  },
};
