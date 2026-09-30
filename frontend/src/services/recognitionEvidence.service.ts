import api from './api';

export type RecognitionEvidenceDocument = {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  fileSize?: number;
  createdAt?: string;
  url?: string;
};

export type RecognitionEvidenceRecord = {
  id: string;
  recognitionName: string;
  updatedAt?: string;
  documents: RecognitionEvidenceDocument[];
};

export type RecognitionAccessCodeRecord = {
  id: string;
  recognitionName: string;
  expiresAt: string;
  usedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
};

export type RecognitionAccessOverview = {
  evidence: RecognitionEvidenceRecord[];
  codes: RecognitionAccessCodeRecord[];
};

export type RecognitionVerifiedAccess = {
  recognitionName: string;
  viewExpiresAt: string;
  documents: RecognitionEvidenceDocument[];
};

const apiOrigin = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/$/, '');

export const resolveRecognitionEvidenceUrl = (value?: string) => {
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

export const RecognitionEvidenceService = {
  async getAdminOverview(): Promise<RecognitionAccessOverview> {
    const response = await api.get('/recognition-evidence/admin');
    return {
      evidence: response.data?.data?.evidence || [],
      codes: response.data?.data?.codes || [],
    };
  },

  async uploadDocument(recognitionName: string, file: File): Promise<RecognitionEvidenceRecord> {
    const base64Data = await fileToDataUrl(file);
    const response = await api.post('/recognition-evidence/admin/documents', {
      recognitionName,
      originalName: file.name,
      title: file.name.replace(/\.[^.]+$/, ''),
      mimeType: file.type || 'application/octet-stream',
      base64Data,
    }, { timeout: 120000 });
    return response.data?.data?.evidence;
  },

  async deleteDocument(recognitionName: string, documentId: string): Promise<RecognitionEvidenceRecord> {
    const response = await api.delete(`/recognition-evidence/admin/documents/${documentId}`, {
      data: { recognitionName },
    });
    return response.data?.data?.evidence;
  },

  async generateCode(recognitionName: string, expiresInMinutes: number): Promise<{ code: string; accessCode: RecognitionAccessCodeRecord }> {
    const response = await api.post('/recognition-evidence/admin/codes', { recognitionName, expiresInMinutes });
    return response.data?.data;
  },

  async revokeCode(id: string): Promise<RecognitionAccessCodeRecord> {
    const response = await api.post(`/recognition-evidence/admin/codes/${id}/revoke`);
    return response.data?.data?.accessCode;
  },

  async verify(recognitionName: string, code: string): Promise<RecognitionVerifiedAccess> {
    const response = await api.post('/recognition-evidence/verify', { recognitionName, code });
    return response.data?.data;
  },
};
