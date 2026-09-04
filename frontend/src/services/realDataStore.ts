/**
 * Real Data Store Service for AZAAM Medics Network
 * Provides clean local persistence for real user-entered data (trainees, applications,
 * hospital rotations, attendance, logbooks, evaluations, certificates, and invoices).
 */

export interface RealTrainee {
  id: string;
  studentName: string;
  studentId: string;
  email: string;
  phone: string;
  studyYear: string;
  specialty: string;
  targetHospital: string;
  cityCountry: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  applicationStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  visaStatus: 'NOT_REQUIRED' | 'APPLIED' | 'EMBASSY_PROCESSING' | 'GRANTED' | 'REJECTED';
  visaReference?: string;
  hospitalPlacementStatus: 'PENDING' | 'CONFIRMED';
  assignedSupervisor: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  rotationSchedule: string;
  attendancePercent: number;
  attendanceDays: { attended: number; total: number };
  logbookProceduresSigned: number;
  logbookRequired: number;
  evaluationScore: number | null;
  evaluationGrade: string | null;
  evaluationStatus: 'PENDING' | 'MID_TERM_COMPLETED' | 'FINAL_COMPLETED';
  certificateIssued: boolean;
  certificateNumber?: string;
  certificateHash?: string;
  createdAt: string;
}

export interface RealApplication {
  id: string;
  studentName: string;
  studentId: string;
  universityName: string;
  specialty: string;
  targetHospital: string;
  dates: string;
  visaRequired: boolean;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  notes?: string;
}

export interface RealPlacement {
  id: string;
  studentName: string;
  studentId: string;
  universityName: string;
  hospitalName: string;
  cityCountry: string;
  department: string;
  supervisor: string;
  supervisorTitle: string;
  dates: string;
  status: 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface RealAttendance {
  id: string;
  date: string;
  studentName: string;
  studentId: string;
  hospitalName: string;
  wardDepartment: string;
  supervisorName: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  checkIn: string;
  checkOut: string;
  notes: string;
  createdAt: string;
}

export interface RealLogbook {
  id: string;
  date: string;
  studentName: string;
  studentId: string;
  hospitalName: string;
  activity: string;
  procedure: string;
  roleInProcedure: 'PERFORMED' | 'ASSISTED' | 'OBSERVED';
  supervisor: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  comment: string;
  createdAt: string;
}

export interface RealEvaluation {
  id: string;
  type: 'MID_TERM' | 'FINAL';
  studentName: string;
  studentId: string;
  hospitalName: string;
  supervisor: string;
  clinicalCompetency: number;
  professionalism: number;
  patientCommunication: number;
  medicalKnowledge: number;
  overallScore: number;
  letterGrade: string;
  submittedAt: string;
  comments: string;
  createdAt: string;
}

export interface RealCertificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  recipientName: string;
  studentId: string;
  specialty: string;
  hospitalName: string;
  durationWeeks: number;
  grade: string;
  issueDate: string;
  status: 'ISSUED' | 'VERIFIED';
  createdAt: string;
}

export interface RealInvoice {
  id: string;
  invoiceNumber: string;
  description: string;
  cohort: string;
  studentCount: number;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  createdAt: string;
}

export interface RealMouConfig {
  mouNumber: string;
  partnerUniversity: string;
  representative: string;
  representativeTitle: string;
  signedAt?: string;
  isSigned: boolean;
  azaamDirector: string;
  validityStart: string;
  validityEnd: string;
  status: 'ACTIVE_AND_VERIFIED' | 'PENDING_SIGNATURE';
  annualQuota: number;
  utilizedQuota: number;
  partnerHospitalsCount: number;
  destinationCountries: string[];
  specialtiesCovered: string[];
}

const STORAGE_KEYS = {
  TRAINEES: 'azaam_real_trainees_v2',
  APPLICATIONS: 'azaam_real_applications_v2',
  PLACEMENTS: 'azaam_real_placements_v2',
  ATTENDANCE: 'azaam_real_attendance_v2',
  LOGBOOKS: 'azaam_real_logbooks_v2',
  EVALUATIONS: 'azaam_real_evaluations_v2',
  CERTIFICATES: 'azaam_real_certificates_v2',
  INVOICES: 'azaam_real_invoices_v2',
  MOU: 'azaam_real_mou_v2',
};

// Helper for safe JSON reading
function readFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
  }
  return defaultValue;
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const RealDataStore = {
  // Clear all mock/previous data completely
  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    // Also clear admin tables if needed
    localStorage.removeItem('azaam_universities');
    localStorage.removeItem('azaam_organizations');
    localStorage.removeItem('azaam_supervisors');
    localStorage.removeItem('azaam_users');
    localStorage.removeItem('azaam_audit_logs');
  },

  // Trainees
  getTrainees: (): RealTrainee[] => readFromStorage<RealTrainee[]>(STORAGE_KEYS.TRAINEES, []),
  saveTrainees: (items: RealTrainee[]) => writeToStorage(STORAGE_KEYS.TRAINEES, items),
  addTrainee: (item: RealTrainee) => {
    const list = RealDataStore.getTrainees();
    const updated = [item, ...list];
    RealDataStore.saveTrainees(updated);
    return updated;
  },
  updateTrainee: (id: string, updates: Partial<RealTrainee>) => {
    const list = RealDataStore.getTrainees();
    const updated = list.map((t) => (t.id === id ? { ...t, ...updates } : t));
    RealDataStore.saveTrainees(updated);
    return updated;
  },
  deleteTrainee: (id: string) => {
    const list = RealDataStore.getTrainees();
    const updated = list.filter((t) => t.id !== id);
    RealDataStore.saveTrainees(updated);
    return updated;
  },

  // Applications
  getApplications: (): RealApplication[] => readFromStorage<RealApplication[]>(STORAGE_KEYS.APPLICATIONS, []),
  saveApplications: (items: RealApplication[]) => writeToStorage(STORAGE_KEYS.APPLICATIONS, items),
  addApplication: (item: RealApplication) => {
    const list = RealDataStore.getApplications();
    const updated = [item, ...list];
    RealDataStore.saveApplications(updated);
    return updated;
  },
  deleteApplication: (id: string) => {
    const list = RealDataStore.getApplications();
    const updated = list.filter((a) => a.id !== id);
    RealDataStore.saveApplications(updated);
    return updated;
  },

  // Placements
  getPlacements: (): RealPlacement[] => readFromStorage<RealPlacement[]>(STORAGE_KEYS.PLACEMENTS, []),
  savePlacements: (items: RealPlacement[]) => writeToStorage(STORAGE_KEYS.PLACEMENTS, items),
  addPlacement: (item: RealPlacement) => {
    const list = RealDataStore.getPlacements();
    const updated = [item, ...list];
    RealDataStore.savePlacements(updated);
    return updated;
  },
  deletePlacement: (id: string) => {
    const list = RealDataStore.getPlacements();
    const updated = list.filter((p) => p.id !== id);
    RealDataStore.savePlacements(updated);
    return updated;
  },

  // Attendance
  getAttendance: (): RealAttendance[] => readFromStorage<RealAttendance[]>(STORAGE_KEYS.ATTENDANCE, []),
  saveAttendance: (items: RealAttendance[]) => writeToStorage(STORAGE_KEYS.ATTENDANCE, items),
  addAttendance: (item: RealAttendance) => {
    const list = RealDataStore.getAttendance();
    const updated = [item, ...list];
    RealDataStore.saveAttendance(updated);
    return updated;
  },
  deleteAttendance: (id: string) => {
    const list = RealDataStore.getAttendance();
    const updated = list.filter((a) => a.id !== id);
    RealDataStore.saveAttendance(updated);
    return updated;
  },

  // Logbooks
  getLogbooks: (): RealLogbook[] => readFromStorage<RealLogbook[]>(STORAGE_KEYS.LOGBOOKS, []),
  saveLogbooks: (items: RealLogbook[]) => writeToStorage(STORAGE_KEYS.LOGBOOKS, items),
  addLogbook: (item: RealLogbook) => {
    const list = RealDataStore.getLogbooks();
    const updated = [item, ...list];
    RealDataStore.saveLogbooks(updated);
    return updated;
  },
  deleteLogbook: (id: string) => {
    const list = RealDataStore.getLogbooks();
    const updated = list.filter((l) => l.id !== id);
    RealDataStore.saveLogbooks(updated);
    return updated;
  },

  // Evaluations
  getEvaluations: (): RealEvaluation[] => readFromStorage<RealEvaluation[]>(STORAGE_KEYS.EVALUATIONS, []),
  saveEvaluations: (items: RealEvaluation[]) => writeToStorage(STORAGE_KEYS.EVALUATIONS, items),
  addEvaluation: (item: RealEvaluation) => {
    const list = RealDataStore.getEvaluations();
    const updated = [item, ...list];
    RealDataStore.saveEvaluations(updated);
    return updated;
  },
  deleteEvaluation: (id: string) => {
    const list = RealDataStore.getEvaluations();
    const updated = list.filter((e) => e.id !== id);
    RealDataStore.saveEvaluations(updated);
    return updated;
  },

  // Certificates
  getCertificates: (): RealCertificate[] => readFromStorage<RealCertificate[]>(STORAGE_KEYS.CERTIFICATES, []),
  saveCertificates: (items: RealCertificate[]) => writeToStorage(STORAGE_KEYS.CERTIFICATES, items),
  addCertificate: (item: RealCertificate) => {
    const list = RealDataStore.getCertificates();
    const updated = [item, ...list];
    RealDataStore.saveCertificates(updated);
    return updated;
  },
  deleteCertificate: (id: string) => {
    const list = RealDataStore.getCertificates();
    const updated = list.filter((c) => c.id !== id);
    RealDataStore.saveCertificates(updated);
    return updated;
  },

  // Invoices
  getInvoices: (): RealInvoice[] => readFromStorage<RealInvoice[]>(STORAGE_KEYS.INVOICES, []),
  saveInvoices: (items: RealInvoice[]) => writeToStorage(STORAGE_KEYS.INVOICES, items),
  addInvoice: (item: RealInvoice) => {
    const list = RealDataStore.getInvoices();
    const updated = [item, ...list];
    RealDataStore.saveInvoices(updated);
    return updated;
  },
  deleteInvoice: (id: string) => {
    const list = RealDataStore.getInvoices();
    const updated = list.filter((i) => i.id !== id);
    RealDataStore.saveInvoices(updated);
    return updated;
  },

  // MoU
  getMouConfig: (defaultOrgName?: string): RealMouConfig => {
    return readFromStorage<RealMouConfig>(STORAGE_KEYS.MOU, {
      mouNumber: 'AZAAM-MOU-REAL-2025',
      partnerUniversity: defaultOrgName || 'Faculty of Medicine & Health Sciences',
      representative: 'Prof. Dr. Mohamed Ahmed',
      representativeTitle: 'Dean of Medicine & Health Sciences',
      signedAt: undefined,
      isSigned: false, // Starts as unsigned so university signs first
      azaamDirector: 'Dr. Abdullahi Hassan (Global Medical Director, AZAAM)',
      validityStart: new Date().toISOString().split('T')[0],
      validityEnd: '2028-12-31',
      status: 'PENDING_SIGNATURE',
      annualQuota: 60,
      utilizedQuota: 0,
      partnerHospitalsCount: 8,
      destinationCountries: ['Somalia', 'Kenya', 'Turkey', 'Uganda', 'Egypt', 'Rwanda'],
      specialtiesCovered: [
        'General Surgery',
        'Internal Medicine',
        'Pediatrics & Child Health',
        'Obstetrics & Gynecology',
        'Cardiology & Critical Care',
        'Emergency & Trauma Medicine',
        'Orthopedic Surgery',
      ],
    });
  },
  saveMouConfig: (config: RealMouConfig) => writeToStorage(STORAGE_KEYS.MOU, config),
  signMou: (signerName: string, signerTitle: string, orgName?: string): RealMouConfig => {
    const current = RealDataStore.getMouConfig(orgName);
    const updated: RealMouConfig = {
      ...current,
      partnerUniversity: orgName || current.partnerUniversity,
      representative: signerName,
      representativeTitle: signerTitle,
      signedAt: new Date().toISOString().split('T')[0],
      isSigned: true,
      status: 'ACTIVE_AND_VERIFIED',
    };
    RealDataStore.saveMouConfig(updated);
    return updated;
  },
  revokeMou: (): RealMouConfig => {
    const current = RealDataStore.getMouConfig();
    const updated: RealMouConfig = {
      ...current,
      isSigned: false,
      signedAt: undefined,
      status: 'PENDING_SIGNATURE',
    };
    RealDataStore.saveMouConfig(updated);
    return updated;
  },
};
