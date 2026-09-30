import { Router } from 'express';
import { PresentationGalleryController } from '../controllers/presentationGallery.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const presentationGalleryRouter = Router();

// Unlisted presentation links. Only holders of the random share token can open them.
presentationGalleryRouter.get('/share/:token', PresentationGalleryController.getShared);
presentationGalleryRouter.get('/share/:token/media/:mediaId', PresentationGalleryController.sharedStream);

presentationGalleryRouter.use(authenticate, requireRole(UserRole.SUPER_ADMIN));

presentationGalleryRouter.get('/', PresentationGalleryController.list);
presentationGalleryRouter.post('/', PresentationGalleryController.create);
presentationGalleryRouter.get('/:id', PresentationGalleryController.getOne);
presentationGalleryRouter.put('/:id', PresentationGalleryController.update);
presentationGalleryRouter.delete('/:id', PresentationGalleryController.remove);
presentationGalleryRouter.post('/:id/regenerate-link', PresentationGalleryController.regenerateLink);
presentationGalleryRouter.post('/:id/media', PresentationGalleryController.uploadMedia);
presentationGalleryRouter.delete('/:id/media/:mediaId', PresentationGalleryController.removeMedia);
presentationGalleryRouter.get('/:id/media/:mediaId/stream', PresentationGalleryController.adminStream);
