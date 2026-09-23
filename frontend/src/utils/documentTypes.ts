export const NOMINATION_DOCUMENT_TYPES: { key: string; label: string }[] = [
  { key: 'NOMINATION_LETTER', label: 'Official Nomination / Placement Request Letter' },
  { key: 'ENROLLMENT_LETTER', label: 'Proof of Enrollment / Student Status Letter' },
  { key: 'ACADEMIC_TRANSCRIPT', label: 'Academic Transcript' },
  { key: 'STUDENT_ID', label: 'Student ID' },
  { key: 'PASSPORT_COPY', label: 'Passport Copy' },
  { key: 'PHOTO', label: 'Photo' },
];

export const documentTypeLabel = (key: string): string =>
  NOMINATION_DOCUMENT_TYPES.find((d) => d.key === key)?.label || key;
