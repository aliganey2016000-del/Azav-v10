import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LandingPageSettings } from '../models/LandingPageSettings.js';

const DEFAULT_CONTENT = {
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
    { label: 'CORE PARTIES', value: '02' },
    { label: 'CLINICAL AREAS', value: '10+' },
    { label: 'TRAINING STAGES', value: '03' },
    { label: 'QUALITY FOCUS', value: '01' },
    { label: 'PATHWAY', value: 'END-TO-END' },
  ],
  about: {
    eyebrow: 'About AIMN',
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
  cta: {
    eyebrow: 'Explore more',
    title: 'A trusted bridge between universities and clinical practice.',
    primaryText: 'Join now',
    primaryUrl: '/register',
    secondaryText: 'Login',
    secondaryUrl: '/login',
  },
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

const normalizeContent = (content: unknown) => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  return content as Record<string, unknown>;
};

export class LandingPageController {
  static async getPublic(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await LandingPageSettings.findOne({ key: 'main' }).lean();
      res.status(200).json({
        success: true,
        data: {
          content: settings?.published || DEFAULT_CONTENT,
          publishedAt: settings?.publishedAt || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPreview(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await LandingPageSettings.findOne({ key: 'main' }).lean();
      res.status(200).json({
        success: true,
        data: {
          content: settings?.draft || settings?.published || DEFAULT_CONTENT,
          isPreview: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdmin(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await LandingPageSettings.findOne({ key: 'main' }).lean();
      res.status(200).json({
        success: true,
        data: {
          content: settings?.draft || settings?.published || DEFAULT_CONTENT,
          draftUpdatedAt: settings?.draftUpdatedAt || null,
          publishedAt: settings?.publishedAt || null,
          hasPublishedVersion: Boolean(settings?.published),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const content = normalizeContent(req.body?.content);
      if (!content) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A landing page content object is required.' },
        });
        return;
      }

      const now = new Date();
      const settings = await LandingPageSettings.findOneAndUpdate(
        { key: 'main' },
        {
          $set: {
            draft: content,
            draftUpdatedAt: now,
            updatedBy: req.user?.userId || null,
          },
          $setOnInsert: { key: 'main' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(200).json({
        success: true,
        data: {
          content: settings?.draft || content,
          draftUpdatedAt: settings?.draftUpdatedAt || now,
          publishedAt: settings?.publishedAt || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async publish(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await LandingPageSettings.findOne({ key: 'main' });
      const content = settings?.draft || settings?.published || DEFAULT_CONTENT;
      const now = new Date();

      const published = await LandingPageSettings.findOneAndUpdate(
        { key: 'main' },
        {
          $set: {
            draft: content,
            published: content,
            draftUpdatedAt: settings?.draftUpdatedAt || now,
            publishedAt: now,
            updatedBy: req.user?.userId || null,
          },
          $setOnInsert: { key: 'main' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(200).json({
        success: true,
        data: {
          content: published?.published || content,
          publishedAt: published?.publishedAt || now,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const settings = await LandingPageSettings.findOneAndUpdate(
        { key: 'main' },
        {
          $set: {
            draft: DEFAULT_CONTENT,
            draftUpdatedAt: now,
            updatedBy: req.user?.userId || null,
          },
          $setOnInsert: { key: 'main' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(200).json({
        success: true,
        data: {
          content: settings?.draft || DEFAULT_CONTENT,
          draftUpdatedAt: settings?.draftUpdatedAt || now,
          publishedAt: settings?.publishedAt || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
