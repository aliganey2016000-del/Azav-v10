import api from './api';

export type PresentationMedia = {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  title: string;
  caption: string;
  originalName: string;
  mimeType: string;
  fileSize?: number;
  createdAt?: string;
  url: string;
};

export type PresentationGallery = {
  id: string;
  title: string;
  description: string;
  audienceNote: string;
  shareToken?: string;
  sharePath?: string;
  isActive?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  media: PresentationMedia[];
};

const apiOrigin = (import.meta.env.VITE_API_URL as string | undefined) || '';

export const resolvePresentationMediaUrl = (value: string) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiOrigin}${value}`;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const PresentationGalleryService = {
  async list(): Promise<PresentationGallery[]> {
    const response = await api.get('/presentation-galleries');
    return response.data?.data?.galleries || [];
  },

  async create(input: { title: string; description?: string }): Promise<PresentationGallery> {
    const response = await api.post('/presentation-galleries', input);
    return response.data?.data?.gallery;
  },

  async get(id: string): Promise<PresentationGallery> {
    const response = await api.get(`/presentation-galleries/${id}`);
    return response.data?.data?.gallery;
  },

  async update(id: string, patch: Partial<Pick<PresentationGallery, 'title' | 'description' | 'audienceNote' | 'isActive' | 'expiresAt'>>): Promise<PresentationGallery> {
    const response = await api.put(`/presentation-galleries/${id}`, patch);
    return response.data?.data?.gallery;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/presentation-galleries/${id}`);
  },

  async regenerateLink(id: string): Promise<PresentationGallery> {
    const response = await api.post(`/presentation-galleries/${id}/regenerate-link`);
    return response.data?.data?.gallery;
  },

  async upload(id: string, file: File): Promise<PresentationGallery> {
    const base64Data = await fileToDataUrl(file);
    const response = await api.post(`/presentation-galleries/${id}/media`, {
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64Data,
    }, { timeout: 120000 });
    return response.data?.data?.gallery;
  },

  async removeMedia(id: string, mediaId: string): Promise<PresentationGallery> {
    const response = await api.delete(`/presentation-galleries/${id}/media/${mediaId}`);
    return response.data?.data?.gallery;
  },

  async getShared(token: string): Promise<PresentationGallery> {
    const response = await api.get(`/presentation-galleries/share/${token}`);
    return response.data?.data?.gallery;
  },
};
