import api from './api';

export type HighlightItem = { label: string; value: string };
export type ProgramItem = { title: string; image: string; link: string };
export type NewsItem = { title: string; label: string; summary: string; image: string; link: string };
export type GalleryItem = { title: string; image: string; caption: string };
export type VideoItem = { title: string; url: string; thumbnail: string; description: string };
export type MembershipItem = { name: string; logo: string; url: string };
export type HospitalItem = { name: string; image: string; location: string; description: string; url: string };
export type TestimonialItem = { name: string; role: string; organization: string; image: string; rating: string; quote: string };
export type RecognitionItem = { name: string; logo: string; url: string };
export type NavItem = { label: string; href: string };
export type FooterLinkItem = { label: string; href: string };

export type SectionHeadings = {
  strategyTitle: string;
  highlightsTitle: string;
  programsEyebrow: string;
  programsTitle: string;
  programsDescription: string;
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  testimonialsDescription: string;
  galleryEyebrow: string;
  galleryTitle: string;
  videosEyebrow: string;
  videosTitle: string;
  partnersEyebrow: string;
  partnersTitle: string;
  hospitalsEyebrow: string;
  hospitalsTitle: string;
  hospitalsDescription: string;
  recognitionsEyebrow: string;
  recognitionsTitle: string;
  recognitionsDescription: string;
  heroVideoEyebrow: string;
  heroVideoTitle: string;
  heroVideoDescription: string;
  viewMoreLabel: string;
  viewLessLabel: string;
};

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
    titleLines: string[];
    trustText: string;
    statsLabels: {
      universities: string;
      hospitals: string;
      recognitions: string;
      programs: string;
    };
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
  testimonials: TestimonialItem[];
  recognitions: RecognitionItem[];
  sectionHeadings: SectionHeadings;
  navigation: NavItem[];
  branding: {
    logo: string;
    name: string;
    tagline: string;
  };
  footer: {
    description: string;
    exploreTitle: string;
    exploreLinks: FooterLinkItem[];
    portalsTitle: string;
    portalLinks: FooterLinkItem[];
    qualityTitle: string;
    qualityDescription: string;
    copyrightText: string;
    motto: string;
  };
  gallery: GalleryItem[];
  videos: VideoItem[];
  networkRoles: string[];
  memberships: MembershipItem[];
  membershipSeedVersion: number;
  hospitals: HospitalItem[];
  hospitalSeedVersion: number;
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
    secondaryButtonText: 'Watch Video',
    secondaryButtonUrl: '#organization-video',
    titleLines: ['Complete', 'Clinical Training &', 'Medical Placement', 'Platform'],
    trustText: 'Trusted by universities, hospitals and trainees',
    statsLabels: {
      universities: 'Partner Universities',
      hospitals: 'Training Hospitals',
      recognitions: 'Official Recognitions',
      programs: 'Clinical Training Programs',
    },
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
  testimonials: [
    { name: 'Dr. [Name 01]', role: 'Dean of Medicine', organization: 'Jamhuriya University', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'AIMN provides a dependable placement process and clear institutional coordination from nomination through clinical training.' },
    { name: 'Dr. [Name 02]', role: 'Clinical Coordinator', organization: 'Benadir University', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'The structured workflow makes student placements easier to manage and gives institutions better visibility throughout training.' },
    { name: 'Prof. [Name 03]', role: 'Faculty Representative', organization: 'Islamic University in Uganda', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'AIMN strengthens collaboration between universities and hospitals while keeping clinical training practical and well organized.' },
    { name: 'Dr. [Name 04]', role: 'Academic Director', organization: 'Kampala International University', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'Placement reliability and responsive coordination are major strengths of the AIMN model.' },
    { name: 'Dr. [Name 05]', role: 'Dean of Health Sciences', organization: 'Busitema University', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'The platform supports consistent communication, supervised rotations and a smoother experience for students and institutions.' },
    { name: 'Prof. [Name 06]', role: 'Medical Education Lead', organization: 'Makerere University', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'AIMN brings structure to clinical attachments and helps partners coordinate placements efficiently.' },
    { name: 'Dr. [Name 07]', role: 'University Liaison', organization: 'Mogadishu University', image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'The nomination and placement journey is clear, traceable and easier for academic teams to follow.' },
    { name: 'Dr. [Name 08]', role: 'Clinical Training Lead', organization: 'Zamzam University', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'Students benefit from organized clinical exposure while institutions benefit from reliable coordination and documentation.' },
    { name: 'Prof. [Name 09]', role: 'Dean of Medicine', organization: 'Partner University', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'AIMN creates a practical bridge between academic preparation and supervised hospital-based learning.' },
    { name: 'Dr. [Name 10]', role: 'Hospital Training Coordinator', organization: 'Regional Referral Hospital', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'Hospital coordination is more efficient when student lists, rotations and communication are managed through one workflow.' },
    { name: 'Dr. [Name 11]', role: 'Clinical Supervisor', organization: 'Teaching Hospital', image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'The structured approach supports supervision, accountability and a better clinical training experience.' },
    { name: 'Prof. [Name 12]', role: 'Institutional Partnership Lead', organization: 'Partner Institution', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'AIMN makes cross-institutional collaboration easier through clear processes and consistent follow-up.' },
    { name: 'Dr. [Name 13]', role: 'Student Affairs Director', organization: 'Medical University', image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c6?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'The platform improves visibility of placement progress and gives our team confidence in the coordination process.' },
    { name: 'Dr. [Name 14]', role: 'Training Programme Lead', organization: 'Clinical Partner', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'AIMN combines dependable placement support with a strong focus on quality clinical learning.' },
    { name: 'Prof. [Name 15]', role: 'Academic Partnership Director', organization: 'International Partner', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=700&q=85', rating: '5', quote: 'The partnership workflow is organized, responsive and designed around the needs of universities, hospitals and trainees.' },
  ],
  recognitions: [
    { name: 'Ministry of Foreign Affairs — Uganda', logo: '/memberships/uganda-hospital-emblem.png', url: 'https://mofa.go.ug/' },
    { name: 'Ministry of Internal Affairs — Uganda', logo: '/memberships/uganda-hospital-emblem.png', url: 'https://www.mia.go.ug/' },
    { name: 'Ministry of Health — Uganda', logo: '/memberships/uganda-hospital-emblem.png', url: 'https://health.go.ug/about-moh/' },
    { name: 'Ministry of Education and Sports — Uganda', logo: 'https://www.education.go.ug/wp-content/uploads/2019/07/NewLogo2.png', url: 'https://www.education.go.ug/' },
    { name: 'Ministry of Health & Human Services — Somalia', logo: 'https://moh.gov.so/so/favicon.ico', url: 'https://moh.gov.so/so/' },
    { name: 'Ministry of Foreign Affairs & International Cooperation — Somalia', logo: 'https://web.mfa.gov.so/favicon.ico', url: 'https://web.mfa.gov.so/' },
    { name: 'Association of Somali Universities (ASU)', logo: 'https://asu.org.so/favicon.ico', url: 'https://asu.org.so/' },
    { name: 'Somali Medical Association', logo: 'https://www.facebook.com/favicon.ico', url: 'https://www.facebook.com/SomaliMedicalAssoc/about/' },
  ],
  sectionHeadings: {
    strategyTitle: 'Our Strategy & Values',
    highlightsTitle: 'AIMN Highlights',
    programsEyebrow: 'Clinical Training',
    programsTitle: 'Build experience across essential departments',
    programsDescription: 'Structured rotations designed for practical learning, institutional coordination and supervised clinical exposure.',
    testimonialsEyebrow: 'Partner Experience',
    testimonialsTitle: 'What Our Partners Say',
    testimonialsDescription: 'Sample testimonial placeholders for verified institutional feedback about placements, clinical training and partnership coordination.',
    galleryEyebrow: 'Gallery',
    galleryTitle: 'AIMN in action',
    videosEyebrow: 'Videos',
    videosTitle: 'Stories, training and partnerships',
    partnersEyebrow: 'Institutional Network',
    partnersTitle: 'Our Partners',
    hospitalsEyebrow: 'Clinical Training Network',
    hospitalsTitle: 'Our Training Hospitals',
    hospitalsDescription: 'Hospitals where students gain practical experience through supervised clinical training.',
    recognitionsEyebrow: 'Institutional Recognition',
    recognitionsTitle: 'Our Official Recognitions & Approvals',
    recognitionsDescription: 'Official institutional recognitions and approvals supporting our international medical education and clinical training activities.',
    heroVideoEyebrow: 'AIMN in Action',
    heroVideoTitle: 'Organization Impact & Clinical Training',
    heroVideoDescription: 'Watch AIMN’s institutional partnerships, placement coordination and supervised clinical training activities without leaving the website.',
    viewMoreLabel: 'View more',
    viewLessLabel: 'View less',
  },
  navigation: [
    { label: 'About', href: '#about' },
    { label: 'Training', href: '#programs' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Partners', href: '#network' },
    { label: 'Certificates', href: '/verify-certificate' },
  ],
  branding: {
    logo: '',
    name: 'AZAAM Medics',
    tagline: 'International Medics Network',
  },
  footer: {
    description: 'A connected platform for student nominations, clinical placements, hospital coordination, supervision and certification.',
    exploreTitle: 'Explore',
    exploreLinks: [
      { label: 'About AIMN', href: '#about' },
      { label: 'Clinical Training', href: '#programs' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'Partner Network', href: '#network' },
    ],
    portalsTitle: 'Portals',
    portalLinks: [
      { label: 'University Portal', href: '/login' },
      { label: 'Hospital Portal', href: '/login' },
      { label: 'Student Portal', href: '/login' },
      { label: 'Verify Certificate', href: '/verify-certificate' },
    ],
    qualityTitle: 'Trusted workflow',
    qualityDescription: 'Structured, traceable and institution-connected clinical education management.',
    copyrightText: '© 2026 AZAAM International Medics Network. All rights reserved.',
    motto: 'Train • Place • Empower',
  },
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
    { name: 'Busitema University', logo: '/memberships/busitema.png', url: 'https://busitema.ac.ug/' },
    { name: 'Islamic University in Uganda', logo: '/memberships/iuiu.webp', url: 'https://www.iuiu.ac.ug/' },
    { name: 'Kampala International University', logo: '/memberships/kiu.png', url: 'https://kiu.ac.ug/' },
    { name: 'Team University', logo: '/memberships/team.jpg', url: 'https://teamuniversity.ac.ug/' },
    { name: 'Kampala University', logo: '/memberships/kampala.png', url: 'https://ku.ac.ug/' },
    { name: 'Makerere University', logo: '/memberships/makerere.png', url: 'https://www.mak.ac.ug/' },
    { name: 'Mbarara University of Science and Technology', logo: '/memberships/must.png', url: 'https://www.must.ac.ug/' },
  ],
  membershipSeedVersion: 3,
  hospitals: [
    { name: 'Mbale Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: 'https://www.mbalehospital.go.ug/' },
    { name: 'Jinja Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: 'https://jinjahospital.go.ug/about-us/' },
    { name: 'Fort Portal Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: 'https://kiu.ac.ug/clinical-training-sites/fort-portal-regional-referral-hospital' },
    { name: 'Masaka Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Mubende Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Kiboga General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Kabale Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Iganga General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Tororo General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Mityana General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Bwera General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Arua Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Nebbi General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Yumbe General Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' },
    { name: 'Mbarara Regional Referral Hospital', image: '/memberships/uganda-hospital-emblem.png', location: '', description: '', url: '' }
  ],
  hospitalSeedVersion: 2,
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
  const seedVersion = value?.membershipSeedVersion || 0;
  if (seedVersion >= 3) return existing;
  if (existing.length === 0) return defaultLandingPageContent.memberships;
  const newlyAdded = defaultLandingPageContent.memberships.slice(seedVersion >= 2 ? 12 : 8).filter((item) =>
    !existing.some((member) => member.name?.toLowerCase() === item.name.toLowerCase()),
  );
  return [...existing, ...newlyAdded];
};

const mergeHospitals = (value: Partial<LandingPageContent> | undefined): HospitalItem[] => {
  const existing = value?.hospitals;
  if (!Array.isArray(existing)) return defaultLandingPageContent.hospitals;
  if ((value?.hospitalSeedVersion || 0) >= 2) return existing;
  const defaults = defaultLandingPageContent.hospitals;
  const names = new Set(defaults.map((hospital) => hospital.name.toLowerCase()));
  return [
    ...defaults.map((hospital) => {
      const previous = existing.find((item) => item.name?.toLowerCase() === hospital.name.toLowerCase());
      return previous ? { ...previous, image: hospital.image } : hospital;
    }),
    ...existing.filter((hospital) => !names.has(hospital.name?.toLowerCase())),
  ];
};

const mergeWithDefaults = (value: Partial<LandingPageContent> | undefined): LandingPageContent => ({
  ...defaultLandingPageContent,
  ...(value || {}),
  hero: {
    ...defaultLandingPageContent.hero,
    ...(value?.hero || {}),
    titleLines: Array.isArray(value?.hero?.titleLines) ? value!.hero!.titleLines : defaultLandingPageContent.hero.titleLines,
    statsLabels: { ...defaultLandingPageContent.hero.statsLabels, ...(value?.hero?.statsLabels || {}) },
  },
  about: { ...defaultLandingPageContent.about, ...(value?.about || {}) },
  strategy: { ...defaultLandingPageContent.strategy, ...(value?.strategy || {}) },
  sectionHeadings: { ...defaultLandingPageContent.sectionHeadings, ...(value?.sectionHeadings || {}) },
  branding: { ...defaultLandingPageContent.branding, ...(value?.branding || {}) },
  footer: {
    ...defaultLandingPageContent.footer,
    ...(value?.footer || {}),
    exploreLinks: Array.isArray(value?.footer?.exploreLinks) ? value!.footer!.exploreLinks : defaultLandingPageContent.footer.exploreLinks,
    portalLinks: Array.isArray(value?.footer?.portalLinks) ? value!.footer!.portalLinks : defaultLandingPageContent.footer.portalLinks,
  },
  contact: { ...defaultLandingPageContent.contact, ...(value?.contact || {}) },
  seo: { ...defaultLandingPageContent.seo, ...(value?.seo || {}) },
  highlights: Array.isArray(value?.highlights) ? value!.highlights : defaultLandingPageContent.highlights,
  aimnHighlights: Array.isArray(value?.aimnHighlights) ? value!.aimnHighlights : defaultLandingPageContent.aimnHighlights,
  programs: Array.isArray(value?.programs) ? value!.programs : defaultLandingPageContent.programs,
  news: Array.isArray(value?.news) ? value!.news : defaultLandingPageContent.news,
  testimonials: Array.isArray(value?.testimonials) ? value!.testimonials : defaultLandingPageContent.testimonials,
  recognitions: Array.isArray(value?.recognitions) ? value!.recognitions : defaultLandingPageContent.recognitions,
  navigation: Array.isArray(value?.navigation) ? value!.navigation : defaultLandingPageContent.navigation,
  gallery: Array.isArray(value?.gallery) ? value!.gallery : defaultLandingPageContent.gallery,
  videos: Array.isArray(value?.videos) ? value!.videos : defaultLandingPageContent.videos,
  networkRoles: Array.isArray(value?.networkRoles) ? value!.networkRoles : defaultLandingPageContent.networkRoles,
  memberships: mergeMemberships(value),
  membershipSeedVersion: 3,
  hospitals: mergeHospitals(value),
  hospitalSeedVersion: 2,
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
