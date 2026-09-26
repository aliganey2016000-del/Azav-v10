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
  visionTitle: string;
  missionTitle: string;
  valuesTitle: string;
  highlightsTitle: string;
  highlightsCenterTitle: string;
  highlightsCenterSubtitle: string;
  programsEyebrow: string;
  programsTitle: string;
  programsDescription: string;
  programButtonLabel: string;
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
  contactEmailLabel: string;
  contactPhoneLabel: string;
  contactAddressLabel: string;
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
    signInLabel: string;
    getStartedLabel: string;
    dashboardLabel: string;
  };
  footer: {
    description: string;
    exploreTitle: string;
    exploreLinks: FooterLinkItem[];
    portalsTitle: string;
    portalLinks: FooterLinkItem[];
    qualityColumnTitle: string;
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
    eyebrow: 'Global training • Institutional network • Capacity building',
    title: 'AZAAM International Medics Network (AIMN)',
    subtitle: 'AIMN is an international institutional network connecting universities, healthcare institutions and professionals to advance high-quality clinical training, strengthen health workforce capacity, and build sustainable partnerships that improve healthcare education and service delivery.',
    backgroundImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85',
    backgroundVideo: '',
    primaryButtonText: 'Apply Now',
    primaryButtonUrl: '/register',
    secondaryButtonText: 'Watch Video',
    secondaryButtonUrl: '#organization-video',
    titleLines: ['Advancing Global', 'Clinical Training &', 'Health Workforce', 'Capacity'],
    trustText: 'Connecting universities, hospitals and health professionals worldwide',
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
    { name: 'Ministry of Health & Human Services — Somalia', logo: 'data:image/webp;base64,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', url: 'https://moh.gov.so/so/' },
    { name: 'Ministry of Foreign Affairs & International Cooperation — Somalia', logo: 'https://web.mfa.gov.so/favicon.ico', url: 'https://web.mfa.gov.so/' },
    { name: 'Association of Somali Universities (ASU)', logo: 'https://asu.org.so/favicon.ico', url: 'https://asu.org.so/' },
    { name: 'Somali Medical Association', logo: 'data:image/webp;base64,UklGRtxDAABXRUJQVlA4INBDAACwtgCdASoAAQABPl0kjkUjoiEZnE4IOAXEtgQ4AMmmJv6b03Vxuwfkf/UfdAqP9l/rv+N/039w/bb5BdaPPf7B+nV5f+zf9P/B/mB8yv7v/z/8d7h/z9/tPz/+gD9V/+n/f/877+f91+yvuE/u/+w9QX9S/xn7Ze7R/mv2T9yX9u/037Rf7P5Av7R/kv//2CP7g///3B/61/qP+p7O//Q/dX/s/Jt/X/+F+4//V+Rv9mv/7/wP+v8AH/q9rX+Af+jiWv8R6T+/v7p/bP3F/vHp7+JfNf3z+1f4b/Yewrmr7GP8j0M/jf28/R/3X9zv7z7of7vwX/MP2r/if4D8lPkF/FP5Z/jv7N+4X+K+Jj5js29x/yn/U9QX2V+qf73/Af5P9pfTB/wfRT69/8n+/fAD/Rf7B/v/LJ8FP0T2Af6f/h//b/pPdf/s//h/qvzZ9un6N/mf/d/q/gK/mv9z/6v+K/Knwe+kK5TDMr5meY/S6lf/D1NPBWFVXtQzsJID+u716SO/dT53Uq4qzC95M8Q882Mu7b3PSyf8l8HaKNV9hifIpgoIL5sbDzMsRmkc9wz2iUj+nsjWYX1y6K87B7GpWtmLO0h4GQ6as89rBgQYNWkmbn4zed/i/mWJEHarkJf4Nw0fpL+z3Lel/RRouVZuSs6qtZrq6KyPDiUgByqJ1+iGVdseaj11lR3HMULxCTDe9xyUF/R9xlFq2DCX7LwbdiBnEpuhGlLLc29I2je/lm/n7DVkp/JJcmU/idn/XiyOgyJirVHhEh0KfjAv0I+t2fS/v1P505LaqHVndBIdOThZTrdtlJkq/scT4Vbxx9ZIUx1Q+SpQNyL1BS6TZ/aXqSz4YUsEbfYAoUxMfM8Tz1LbXPnZa5sNjfLZStNf65vzdkRjwFiHF/MtoNXQjCs2pGW81AIuv6E+KhlwN5jtzm0PpzgTcL9L8+vK9gWl4bnBX36XPPqIRWTkUAU8/Twnqiwx3GvxkFGFh6+p3ukm+s0arfj8l3YK53iVWbPV92hOdhSKgSfQ6LevT/F1J/9tS8lSeDJk9f9Y8nFv+Su0zG6qCO4tv5RQVQkkR6J2D29H4npFjMk/JpVxXnSyPLCmha9McbrYOsRrMhKlS9HSvQxJEjs+jTScHEHT7YHvhgTz55IAw/dMmR3kZsby53Wguoj6DTMgJvEPcVp4vva78D+6M9DYVtyRgw/VJ2q1Uv/v5wu+Ob9p+K8OnRA3Pi0r6OLm3Yw9j4hqKh9p7dngTwWlg5Y96nCN0eP5D21WGaVID7M1KiD5LYRH5bM23JCfaHTSlMPbtK91KEbS821g+aij3zAGiljUi2Jn0YhqrySXl3vljtjYbH06pkBg3oRYDLpVwzQts3jXXS+Pxzel4arAmef+tZwIoz6MuncDLe2yJ25UKzcaFWHAKKu4spSXZa+EuWb6dman43SeFKg/tQiI6vt4p9Jwmf8w29Yz71mfLHfdvi5DhfKm7EpFiAgtwj5u7AsMeMhjmrx1ghv4T+wKsyuFchPIU2d4ijBsCmy0P/ymij3XwQkrOFI0hJNkh8VMtoZaIRXyOz+9gZBReJMn8M+54gBBfh6XEVL5arXNKpzy54zqujDYCUrOx/kFMOpviEz1EXq4Fzux3UGIY+CjfTzbGnRjP5diUmrE3OlWYoeXaUIVjeOJkijUJAvZmZp+no4+k3MQJ1VU1AjX7cR2DSPHggoGaSajDBuJ02DEMbPk0qK3PU1xzLHvzCheoNW4e+Jx/aW0AbU1DZdMvTcR8DZKxV4xwOiR/WQwcgPKoUCzMa/84HA0N6bLfBJyvDg7izPScTJ8gRZNAPiojyNeoGg0qDd9AcsnfiEJowzsA8LZVCAS3BYgfFWsOpct31X1hHdk+tHpwoPTtHpeVXQtopIs55t7I9cnp7MBkah987FFbFRXvjG2pF8WefgcKzAx8j/sQQ+LZyKz9AAA/u0GDRogIHibA5+qZBA2yxsq4e/R4ox9zWQTO+0eKOi3OWWJZ1GNQLiQSeWooEHQHsDuORlw7kithTX2IWs+/8pFv/q82oDIAyLfL+AqESPnme3/bEuF1J4+k9yONBLt0LQtiEg6lo13Kog8slNH0ygHatdnUgkWizSg9hychpFX8QHiVyZ73QZCd4b4btDvJTrU+dnpaFGhGPTXZLJpOUZ27RHyNACLl0HPQ0Nzx4CNM2/P04aC4Lkbs0NGhjcaHm4LAvRpP+N8zT3oGfBzo138LStrI7fttYvqP8kQiSuCWYhsmZXamqOsXyd2EU0iwpRj/t24Gr4mTU0SIoNoyWX//5XIVYjB5rS6pT5SfF6bRfJwpz9MutU7mxC3I/+1jLqoXxuba4jv8nS0pdnZnApsNMaj3wKg68txUJNLpSen9tKb5iQkE5ZnlExRLD1D8fIHK+uqpijuR2NCJqlRksMzGqjTTFo11h4NGhWaQ0kE3tX7iTd4s+hRGKMjJgTPqNrxxv8rPlRyulqIzKg45W2wcqNaJ8+E7azu9D+Sgu/nGBdr3Tdy+nE9Q6/RBylvlxRTGWZoFJEeeU/73racFQaBzYWyEoHhFyFNMC+AAA+Bcv6vxHyHjBnQ/1lJz9aaTjQCqato/zIxl9oFzvzXMoF/z4dIEO5aJw0YGWuGj/VzQjRdmOcJGB4OBxCakdv+MVHDiakjeXnSWusDNbtURYOqE04UVtqs1YOobtF13LicGtojJdzO4O5CBpxps0mDLMJ9VCBVBP0xCz0tFnM02ezKkoxWoXAL5Rka2arrMk41rQZsjpNoXb3QgjXCJBfQGSoLNDY4vLAomzp/+42QHhqqxh3TLYzB3Y68VpLg2J0YgZZLxQ8KgTAvhDKUOBrpCLlLHM0e8pbpRgUTTWXpGMPwORwyb2jkZlJDPkSLBakj/aviIo8mGt0QTWTPO3D6z772PdNneLMNRE9Hu0SvKar/MEvhCkkrbMu0XzbUjTpED9nEVD+AHmFRUSMFHnRvfSuLtoxnBJpBttjoEpAHTsO/Hh2E943HkZrzdfaplDEp+ymiYgvekdODXs9j5ozR2TpIeXSq9ueFhAp1pFsFEyiWj12N2PwUAgSOf3FO59mwdQ4ik/LwkFi4Tnez0q7UIj6P8GxLRJ7cIF8vmEinCbmwCsnE74lmAlJhpGqzJhpIdzCKagecTNByQUO1Z8W2/N5x+EdZ92s1AdxsB2w1FKBNdM5aAnb2CqPnF63GR6XRFc2IFRZY0Iwwg/vgsihrAqEnma4LW6cfg5/ZEeIDzjX89PB5U3P+UAcsC18DQAfPdx14yapShJ28PTtVKOU9rFkr/zstXNbCmvw0X09vnxRzwtvKownx4Nd65N8JdFkYV/igX+sITw5X2cOcjTz7q9eHdi3l+DvyQeg8w39P/wZ57IL9Wtv9Xt8mmtH/eD45m9f1rCv4hc3zSCZf4XF5orOS0rgiMAT5TtyUs+v9B3UOwsnNRc6la03lmwvIVgnIRcpJArK+nEVRfcasE4qRvbCNUshOOkD8pKzSra3B1go3APikkC+i4w4T1437vJdSalJPZQagJ5XN9ZvyjNP8OuYWe7nihcdXUk9wQCppnQInAbZu3OujJvc1U/jzco8mn87VYkhYjZK7j3VOWE+cPhJq+GcyTmFFWJnu1qmFjBnZ5ZakR77joe8YMLwkrI6xG8rHIWp3IMg0RBjhL+TxAtc0T/Iz920tnMW1euJ26+QBtkBGhYxDkLwUlkw7oI/zf6ZglLpIvR/+ihHI8m7NKpEHl4o7rOZXWenX1RnMni6IOXDN1xhJTJ3cWR0E3kEWOR+3Ig5Gc/rCzVE2WbLhfvfDcboL+72BWqN0hmbbbhfhhj/quXG8jPRiP+22qpGLNaGh/lY22GURqj2RxE6QBb2eOxldLP3PS74YMddixjoQIa92h1RCUA2kuORH+gkIiP+nO6vLGsLcfUfUzfWp3Yeuo6Hft2Jt+OemXXW2+dfAo6WUQy1keUOlGxDw8+y4xyuQmOYTUyf//mCrHaLmwr/KcVWuNsrLImj1wZEkcoipyAJ8OVXprVWN++VlYqZ+lnTHXcTOUav7PaxL792qERinyWudMFJHqebGR+tJQ+anlAhlEHUfUpqXsUQiOqO5TUEXRnVLY6vGBa3vST/QJ9a7tGB5h0NLEA2au+tRl1x3ZRybvJ23nFOm5d50Z6r8isiGrZqUYcYv+auF27fwUk39ymRdYBx2qe814frDWzDZVvZZX4fKVFnKg0nVqFn9HzGWSbVHFncnpTl1W0Z2pe1Bv1e/wLrLPcp5DqGKIGO6kQZAIWWWe8j+xev8x52mOMJUgN6x3GI/v7RRe7/WiVepTqFnBc5nPilJ3zGdzSQaQZfhylSIObSQ2JqE+4VF/xId/2i6AB/rZ6+qTVDyQ47H7C+WLulTdnqczdWAK12HvLMB/3H+uX/EYP5OTjGQKRVlpoyVibyMRnvi8kbiC60VRpnIeNXkITP0w+F3MC5TdLyTmsbQlT211pg7iX+iGqjqR+6j7f9L/oTZJtqNz2aNo1L1WvR8+bSGpxBzOP0wIFRfJ/VIN2Ya1cKNazbnhZIe99CeauVj+Vlj3tBwQ9MUsH4qeL2ZiXIFD3yhAo2pfojPnMOc6X5RqWupTQAU6sSLERAABaHNkq0ILqpHyueKj1IYyzPcSKbl+kzry9FmGRB4e5i+DWzdslQvEj03E01cl77RhFxbezV3g9XDH8utYd3taVwdGfSBM1R9KZEkA3AQr1oMiJY1Xdf+A0ANJUgFQyuDEnqCPdOnI+C1qTA7U9JmHOrYty5zAlZmRvEEZS2h1LGNuK1YbaHh++6ARXDGF6RjLPVfzLhk4bwem8Ez6nDQ3w5sirscgiVLKCJFl1J/P4wqs8w2Z6Yx0R/McXUYcFYrpPxlb8zsAn45/lL7t5CJafzIGSmuJyrdVzheKMneWptAL3YIqGkvvhn3TSDuPil/lUSw4ZPUZOJu+tAM02AKIHBSWYDK3GcYYcpm1cgMDdfZ1wKFN9giomCJ4p+zrf0I17scWiiowYTltE28sX34cEz1gHuDZWUdtPxszwRhsvcx89bM51GNAqSudVwKBNJ5S2vvy0cxsmWoMvJEI+7unHcFbUqQKAGp2YDNnOeslF58kOShojWTxIqEznKzaOI7oFSm7BBgITfU8KS6eccvUQ+qdc2PM97RmtuC+YqaCAdhW/KKESt11DJm9VEQBNIrAIrmbSe3wDiDamRWHB6oXgDKnHgAFA6WyOHY52BfDtU8KiZ85EYE+wvytLfMaNh4wIExM6XD2JelTzjVHRGk8neNN8uKAP1Rs2dVZnfGKHGD8V4S5bhkxGiB0Uengd69gjOq9jI0H1zvP38Cz53T+sbgDQRGemTA9prIJ3RvgPEG9rEKODRXxwNdRxdvioMZhO3cQZ4r68zRIYBJpGVWlDNpeyp7yqmlyW+PSDJ26RdJIRR52spRAlIaQXP9HoxpTO3X5DvAXDbylj/2TMfMqAJvraWLNH48hNUOIU9hwtU7nLvnI3bqFSvrsvAmz1IbwmuNt3q2VxD1qvDQfi9GD4POzICg0LP+Lzt9MELzbjUDFeRvRoiBSiRjDmoLAXZszNPqrH042a0OcEOdxW9yo0KEEbFlvjk/HfJGiO5o0A5hWTSUmR6s0EpIHCjh64cB21/tMGgyGuUT4oZ/nHzV9PN0OoFsiIyOrj84vud6Sd+iQKsF10x5nfbfsbVqKCZDtMT9ZMiCc2NxAsLt/GFzO5lxrbyhFujtE5Xa9HO/Iib/8CwzFDFTwND/WZ90Xt209S7+QZoJQgVseYtueWWNwhl/D/wB23V8bbRXoc40xtPQbwzinqNih1YVJpNDXw3bJuO5LH2eKwUZDAt9HCyT0wNYYKKvP6oSLkVVv0U0uokjK0HcvNIR7Dg/xWbRZogSgyxAieJ4zHCn1C879DOZVugL+fcuCuHv9DoKLo70D0MSFC6G9DYt6FpRiwVInDGDcNuvxZJOeH94pYuH4Rbtc64TjTBbNffq8OJLPdEbMFw5ACHU0M2u2yqdXDyxC8ctqgvCjG7gHTUOXq6F4D6InZs+0+K4Gu7scl73RjXSdlVqgHZlYI+i6THk6CZS+wjaLha4+Dfg1GtxRKsnksxxAoiCuPsTFYZ2dsJs40L1M/LyJUu3sAD4mnsHJ4HCqO4Ly192i47621bq42MLak3HSgwPj1aXrTeO1ZC9zGaopkukKDF1tr3Ki/FD41Z4H/G1r4btYLbw+CydUEmg163Fo+ExFfWsNfaFpNB/jYLVcsvMkaIhevvaNQs8PG8sIveSE8cJXxbWvk2+kKNSs9kDLeoYrQJh6HkBbgdys57xpDrumjHsz++aMSKPMU2+VRp3lTC+JU/oWCFkAy/Y1mzzwx+Rmumi91+qyZC6r7Az7OMAt2ppp9tnzfWRopBP63/bz+202GNcCfOUWfnCMEag+DjRvBQgNagsWoS/7KlT8DoqemIU3RSVFVJrD9UND3ivNorc4rq8vLUtSl0ARWenN7Frx5H9ssa7bFP593NVc6UxRTFm9QqbKFoSN9VucmzStWWCCeTYLdSvCvlI9epDz+Bg0UjqdPIoHFXWckT5MUejJZ1LWXGGegJEuYp3sGNfx2XevtkV4ODGEWwGDXThE4QtODtcWMH8gH8XWcWD/saiKOKwNNu8IuhgXebKSrc78fnGX3YNNDPhLa7/ODRKOEffQKqpmRLPhf8uDVcXQoqkupfhB+fbv7bgj7TElExa1rvpc5fTkni7P5iH4fNwFZNpOtvOo7RlZSXQffAqZezO1gT/qx4ZZIjptfn0lksKKMj+E3wpWJlF5QuLtnVFDXEfIxX1ZIt4yKgEHetsymcyC+IytNVjfJVWNmpxfFlH01ku6aQsCue3SCt9NjG3T4qMyI7j2UV8JIh9m///iVrtnduZZdOfYlu98HUuWsDiG6YnYGIE0AH5NofHz9P+KaLPZCRmjkt3FMqCvJeviM9t93EM4cJzberZh5fOj9ven9G5o2U9oeK/0AiQmtjFHSMwBM1zlTmsS0xJ7UN3ewltbPA8aib4t0V6+wdAlrmDo/RuK/5jicAlzebhQjSkG3Q/42qbKEFlYAbC+Ter9ur0vgblDN6VahyU2JbhgM4iiUsm4A+mY66Cz8qSMGE1+Rh0Ho+z2Vh7Hwyr69EbZwoCEBMRwgFK2l+umw4jrGN5ku3fJhuepS8i45lQGSCvkg1QlKGXX7Dv59lZbGHpw1Z9AqZejM59s0leKOGXgb34ffH4PMNCENUg4Ew4eVRMhpFVDD880fM9ACLP+gYFWqH1DPLtb3e7+5bReZ2BzYinUyYnMMyngF3BxGKRMwcHacz7YknbaTPH/F+s3gCBAHYj3WF1bOez4sZsnCXB/UTYzRQ/O7obqMaUYsP9DVqnet8UIYUL1fq0wdq85dpDgqs6hW8Xrvy9KQ/10Jwl8NxyENLR9FFgK4XfpMwmAhkowhuDnrcbkZp/cXRdt758vjJDmI4tjT8rbAwE6+4gnbCgD+RzbHhzG9xGFdmY0KZmZ1IFW+2uF4M7K+EI+CLvksTqGclt0ocy+6/Vp6d43YZJhtXM0mrWLo5grcMGbFOn2CZQkHIDQnvsJWRkPoAl0Ocirx6Dn6ZLXOlY7WrRyrNztXlGYUB4whO2naxB+aJXBQQLwg8GM3hMYMst+f9PyKD4CoeQAu30O1QmGCuZL+CkwEJX0l9Mhax6+NK36PRsriO45nQ9+UCdoqZ74Xz8OTAWPbsW7xGHTRr8JcMiV9VYU3teGk4gzhG3gYmlsAJJ4eFDHwVgptIbav7eXmIPANmXntfGGCE4YfSPP/ofck1tOjEj3zQPGRHgQGJD7hJCnbxonsO7lrWWvvFLdVF4Il5Gt9ik0BmprQto7kjKavM7mO44NU12VDLk1e/bZ1DSS9IlgyByLhJuKk4bfLE6mm43DEcjO+ycV9iQvmeWFp20TyNRcYVoIHYZGq6fjRMVzJIs7SENx/ESzgHRdpfNgESnRkP/l7ykhewSvvnIhRR8FUSYmp0SwcGzKXsm+I1XFPTKZWzJnDRXo9SD3w9+XuQsRRoCd5nIDAa7hu2J4Zk7xDf50kpXsQ1XB0n6sB9ipU/cp9isqi92b48C1NfTcqh5k9SDxPPmMJLyjpOQ806scirCmDT75yGnleJOVFQDzIN40lQa5AtOsePXnRrg4sw26f8wuTiU+DRBDzBaCGzP5ikqTXVWUcHlS0vlHuVU44Fq7xVgQjOGUlPQwdrQL6wy9CmLtVtdzFKtG5RvNri0wBT0FHnSRRID6Ck3bbyMYwf6TXi9gZW6655hNsL4hYDxX109iuLwslehQbMqoF5L9I0PY2r0qZ063C3570mL+fBTbO3IAkHdV/85GXm0MuECz9nDNK8wJgWnGM2DrKFfVWXg7068elDaqifybY4oXp6s1DvREhO7WZbjhdC+a9EKISM3v0Gg2twVwH9ox1lX0aU2Yxsqw/rei8996sERapmTuGY9gOJRVNCPp7IIuOayVw27fzI16Uy9Em1a7pBZS3t0ikzMoNc0BTfFfNK91mB2V7yFJUHpSuLw9iLi1UiHz8IGBfEtJqUhdK9orgz8hZv0isjb2i/4DXyGe/m9jf6m80dw61ZXqrxFh5Kpe7M+Hwwj7zmz/hI1nzdAKdyzPJGZULnikXenED2wFvhnSSdT0a5FB7iUIfj4147FnnO5XBO3C2KNfsriv6XgNklCgz4wHZIzkcgACJM+8dFnfMbHwR7AjCDgg1076ea7KIo8EiRMUoM9sIfMOmCihILpiifAohCmYEVjbxMAOIGJmh2YAZmTFpZCX0ogQ5FU6uiGsnNTQcz/gSsYfkocGtDloGTc9u2X+LxSVqUSy5oPVuIZPBvtcp2xHRBXwQzIukFZHH2nC+FvsfqtYxEjADGm+axiKxsuYhn9dH6cIoSGcfh+UKVocF1r7RcIwhuiW5fENvdDnqauS9wqCjUEyr11Ojz4glX7rCVeobLK02IfL5gc5Bxi8EgkDD9NTu+Ueo5q4tnKMnO7WOXilOFvmSsFEgX64JB4HfeGY14vIAIUbFhBfRCToGb2rsf+nlX+phmkPfbM3QKv1nyvPoINC7r7YPVWEQ09rTUHTmCjnZF7KzuCDS6aJvGpXDLS6W5WujJv21+qmSr65jEmXM8xsshXBcWlp5y3rhGDrgm07gDPmpOrtEleXSvBQnBKeB7Kf5W765sabWp5wyZAddJcy+jt1UzsJru+PJDYjO3GKDfc7Le8GXUdQEGXs5YiIRuZC8Xw6iDiMjRx4Sa2nYTHot8yTTFlvM26PQ7aDpgqLwy79SiZA2w3WdraIb8vHgJzmDOdas0qrup1QRMdZ2kkAKuExwVpNRThQ9f1WGni29Qi8cuB/RPYBSVUr/y8XfByrGuXdQmbyQ5yqTcayg1nT2mP0s7OEkuujrROQdD8Qqpv+EwQIuxMdZRvzr0vZjVc2h/ZB0lPltOtv+pxYMyuYbtqtVpEd16N3KqQo6pMuQ6ooayM60q1lZN14/r61a3/xnSmvWXGZAgOSEY3g7QhKBndyPGejN699mdtTwsfAXIJGqM60ZpfNqjVLgYiZXHuM+huDNBrZxrGwdiPol8r1tao+f0j85S27r8qIPyHEg9B4hEVvJG3jXjSxdnjwzQBVCLlzzDqRxWfbZ4iVMfZxgMSGciOd1MtR0vjthxXD/oWxDJNoiT6KXJr7ulXpGfjx1G+JBzIn4W+uvHv0JeeZ/+iQHER/fxXS2ycK+ZtJBcVgy8zO//Jng/o9rY2aVucSvDsNWSDC8wJ2EjTjWYii8/yHq8wRe+dXzNRlUA1+Vt5QUl2n5NK/6SD3YeiGvehSYNKc+QwWsulZhR37QNb5mx32RktLMLpzeAOzYZ6+u7W/O/Yef3jBLKcO8Xw7BIZDlcKEB6yBOgMkluJ1CsQFWysu8fNgP1Aq60Ze+yHH6yUL4Ts[... truncated ...]', url: 'https://www.facebook.com/SomaliMedicalAssoc/about/' },
  ],
  sectionHeadings: {
    strategyTitle: 'Our Strategy & Values',
    visionTitle: 'Our Vision',
    missionTitle: 'Our Mission',
    valuesTitle: 'Core Values',
    highlightsTitle: 'AIMN Highlights',
    highlightsCenterTitle: 'AIMN',
    highlightsCenterSubtitle: 'AZAAM Medics Network',
    programsEyebrow: 'Clinical Training',
    programsTitle: 'Build experience across essential departments',
    programsDescription: 'Structured rotations designed for practical learning, institutional coordination and supervised clinical exposure.',
    programButtonLabel: 'Explore more',
    testimonialsEyebrow: 'Partner Experience',
    testimonialsTitle: 'What Our Partners Say',
    testimonialsDescription: 'Sample testimonial placeholders for verified institutional feedback about placements, clinical training and partnership coordination.',
    galleryEyebrow: 'Gallery',
    galleryTitle: 'AIMN in action',
    videosEyebrow: 'Videos',
    videosTitle: 'News, Events & Training Highlights',
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
    contactEmailLabel: 'Email',
    contactPhoneLabel: 'Phone',
    contactAddressLabel: 'Address',
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
    signInLabel: 'Sign in',
    getStartedLabel: 'Get Started',
    dashboardLabel: 'Dashboard',
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
    qualityColumnTitle: 'Quality',
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

const mergeRecognitions = (value: Partial<LandingPageContent> | undefined): RecognitionItem[] => {
  const existing = Array.isArray(value?.recognitions) ? value!.recognitions : defaultLandingPageContent.recognitions;
  return existing.map((item) => {
    if (item.name?.trim().toLowerCase() !== 'somali medical association') return item;
    const logo = item.logo?.trim() || '';
    return !logo || logo.includes('facebook.com/favicon')
      ? { ...item, logo: defaultLandingPageContent.recognitions.find((entry) => entry.name === 'Somali Medical Association')?.logo || logo }
      : item;
  });
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

const normalizeHero = (hero: Partial<LandingPageContent['hero']> | undefined): LandingPageContent['hero'] => {
  const legacyLines = ['Complete', 'Clinical Training &', 'Medical Placement', 'Platform'];
  const legacySubtitle = 'AIMN is an international medical education and clinical attachment network committed to quality training, trusted partnerships, and stronger healthcare practice.';
  const legacyEyebrow = 'Clinical excellence without borders';
  const legacyTrust = 'Trusted by universities, hospitals and trainees';

  const savedLines = Array.isArray(hero?.titleLines) ? hero!.titleLines : defaultLandingPageContent.hero.titleLines;
  const isLegacyLines = savedLines.length === legacyLines.length && savedLines.every((line, index) => line === legacyLines[index]);

  return {
    ...defaultLandingPageContent.hero,
    ...(hero || {}),
    titleLines: isLegacyLines ? defaultLandingPageContent.hero.titleLines : savedLines,
    eyebrow: !hero?.eyebrow || hero.eyebrow === legacyEyebrow ? defaultLandingPageContent.hero.eyebrow : hero.eyebrow,
    subtitle: !hero?.subtitle || hero.subtitle === legacySubtitle ? defaultLandingPageContent.hero.subtitle : hero.subtitle,
    trustText: !hero?.trustText || hero.trustText === legacyTrust ? defaultLandingPageContent.hero.trustText : hero.trustText,
    statsLabels: { ...defaultLandingPageContent.hero.statsLabels, ...(hero?.statsLabels || {}) },
  };
};

const normalizeSectionHeadings = (headings: Partial<SectionHeadings> | undefined): SectionHeadings => {
  const merged = { ...defaultLandingPageContent.sectionHeadings, ...(headings || {}) };
  if (!headings?.videosTitle || headings.videosTitle === 'Stories, training and partnerships') {
    merged.videosTitle = defaultLandingPageContent.sectionHeadings.videosTitle;
  }
  return merged;
};

const mergeWithDefaults = (value: Partial<LandingPageContent> | undefined): LandingPageContent => ({
  ...defaultLandingPageContent,
  ...(value || {}),
  hero: normalizeHero(value?.hero),
  about: { ...defaultLandingPageContent.about, ...(value?.about || {}) },
  strategy: { ...defaultLandingPageContent.strategy, ...(value?.strategy || {}) },
  sectionHeadings: normalizeSectionHeadings(value?.sectionHeadings),
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
  recognitions: mergeRecognitions(value),
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
