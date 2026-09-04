import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Plane,
  Award,
  FileText,
  UserCheck,
  Stethoscope,
  BookOpen,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Check,
  Home,
  FileCheck2,
} from 'lucide-react';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudentJourney } from '../../types/admin.types';

export const UniversityStudentJourneyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trainee, setTrainee] = useState<RealTrainee | null>(null);
  const [adminJourney, setAdminJourney] = useState<AdminStudentJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'journey' | 'profile' | 'documents' | 'financials' | 'visa' | 'placement' | 'attendance' | 'logbook' | 'evaluation' | 'certificate'
  >('journey');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. Try to find in RealDataStore (Trainees list)
    const localTrainees = RealDataStore.getTrainees();
    const found = localTrainees.find((t) => t.id === id || t.studentId === id);
    if (found) {
      setTrainee(found);
    }

    // 2. Also try to fetch from AdminApiService for mock/seeded IDs
    AdminApiService.getStudentById(id)
      .then((res) => setAdminJourney(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading medical student journey dossier...</p>
      </div>
    );
  }

  // Derive consolidated student details from either store
  const adminStudent = adminJourney?.student;
  const studentName = trainee?.studentName || (adminStudent ? `${adminStudent.firstName} ${adminStudent.lastName}` : 'Dr. Student Candidate');
  const studentId = trainee?.studentId || adminStudent?.studentNumber || id || 'STU-000';
  const email = trainee?.email || adminStudent?.email || 'student@university.edu';
  const phone = trainee?.phone || adminStudent?.phone || '+252 61 500 0000';
  const university = adminStudent?.university?.name || 'Faculty of Medicine & Health Sciences';
  const studyYear = trainee?.studyYear || adminStudent?.studyYear || '5th Year Clinical Clerkship';
  const specialty = trainee?.specialty || adminStudent?.specialty || 'General Surgery & Trauma';
  const targetHospital = trainee?.targetHospital || adminStudent?.hospitalPlacement?.name || 'Madina Teaching Hospital';
  const cityCountry = trainee?.cityCountry || adminStudent?.hospitalPlacement?.cityCountry || 'Mogadishu, Somalia';
  const startDate = trainee?.startDate || adminStudent?.startDate || '2025-10-01';
  const endDate = trainee?.endDate || adminStudent?.endDate || '2025-12-31';
  const durationWeeks = trainee?.durationWeeks || adminStudent?.durationWeeks || 8;
  const supervisor = trainee?.assignedSupervisor || {
    name: adminStudent?.assignedSupervisor?.name || 'Dr. Sarah Jenkins',
    title: adminStudent?.assignedSupervisor?.title || 'Consultant General Surgeon',
    phone: adminStudent?.assignedSupervisor?.phone || '+252 61 700 0110',
    email: adminStudent?.assignedSupervisor?.email || 'sjenkins@hospital.org',
  };
  const attendancePercent = trainee?.attendancePercent ?? adminStudent?.attendancePercent ?? 94;
  const logbookSigned = trainee?.logbookProceduresSigned ?? adminStudent?.logbookSigned ?? 36;
  const logbookRequired = trainee?.logbookRequired ?? adminStudent?.logbookRequired ?? 40;
  const evaluationGrade = trainee?.evaluationGrade || adminStudent?.evaluationGrade || 'Honors (A)';
  const evaluationScore = trainee?.evaluationScore ?? adminStudent?.evaluationScore ?? 92;
  const certificateIssued = trainee?.certificateIssued ?? adminStudent?.certificateIssued ?? false;
  const certificateNumber = trainee?.certificateNumber || adminStudent?.certificateCode || 'AZAAM-CERT-2025-VERIFIED';

  const stages = [
    { title: '1. Student Nominated', desc: 'Accredited University Nomination Submitted', status: 'COMPLETED', date: 'Day 1' },
    { title: '2. Documents Vetted', desc: 'Passport, transcripts, health clearances verified', status: 'COMPLETED', date: 'Day 3' },
    { title: '3. Fees Settled', desc: 'AZAAM invoice paid & financial clearance confirmed', status: 'COMPLETED', date: 'Day 5' },
    { title: '4. Visa & Housing', desc: 'Entry permit & residency accommodation assigned', status: 'COMPLETED', date: 'Day 10' },
    { title: '5. Hospital Placement', desc: `${targetHospital} (${specialty})`, status: 'COMPLETED', date: startDate },
    { title: '6. Supervisor Assigned', desc: `${supervisor.name} (${supervisor.title})`, status: 'COMPLETED', date: startDate },
    { title: '7. Attendance Compliance', desc: `${attendancePercent}% biometric/QR check-in rate`, status: attendancePercent >= 85 ? 'COMPLETED' : 'IN_PROGRESS', date: 'Ongoing' },
    { title: '8. E-Logbook Verified', desc: `${logbookSigned} of ${logbookRequired} clinical procedures endorsed`, status: logbookSigned >= logbookRequired ? 'COMPLETED' : 'IN_PROGRESS', date: 'Ongoing' },
    { title: '9. Evaluation & Grading', desc: `${evaluationGrade} (${evaluationScore}%) consultant assessment`, status: evaluationScore ? 'COMPLETED' : 'IN_PROGRESS', date: 'End of Rotation' },
    { title: '10. Certificate Issuance', desc: certificateIssued ? `Issued (#${certificateNumber})` : 'Pending final graduation sign-off', status: certificateIssued ? 'COMPLETED' : 'PENDING', date: endDate },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/university/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Directory</span>
        </Link>
        <span className="text-xs bg-sky-50 text-sky-700 font-semibold px-3 py-1 rounded-full border border-sky-200">
          Under AZAAM Clinical Coordination
        </span>
      </div>

      {/* Header Profile Hero Card */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
              <GraduationCap className="w-8 h-8 text-sky-300" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
                  {studyYear}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {targetHospital}
                </span>
                {certificateIssued && (
                  <span className="bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-purple-400/30 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Certified Graduate
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{studentName}</h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Student ID: <span className="font-mono text-sky-300">{studentId}</span> • {university} • {specialty}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10">
            <div className="text-center px-2">
              <div className="text-lg font-bold text-white">{attendancePercent}%</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Attendance</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {logbookSigned}/{logbookRequired}
              </div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Logbook</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-lg font-bold text-purple-300">{evaluationGrade}</div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Evaluation</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-4 text-xs">
          {[
            { id: 'journey', label: '10-Stage Journey', icon: Sparkles },
            { id: 'profile', label: 'Student Bio', icon: GraduationCap },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'financials', label: 'Finance & Invoices', icon: DollarSign },
            { id: 'visa', label: 'Visa & Housing', icon: Plane },
            { id: 'placement', label: 'Hospital Ward', icon: Building2 },
            { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
            { id: 'logbook', label: 'Logbook Procedures', icon: BookOpen },
            { id: 'evaluation', label: 'Evaluation', icon: Award },
            { id: 'certificate', label: 'Certificate', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  active
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. 10-Stage Journey */}
      {activeTab === 'journey' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">10-Stage End-to-End Trainee Journey</h2>
              <p className="text-xs text-slate-500">
                Transparent milestones tracked in real time under AZAAM institutional coordination.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Active Rotation
            </span>
          </div>

          <div className="space-y-4">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  stage.status === 'COMPLETED'
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : stage.status === 'IN_PROGRESS'
                    ? 'border-sky-200 bg-sky-50/50'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      stage.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : stage.status === 'IN_PROGRESS'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {stage.status === 'COMPLETED' ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{stage.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{stage.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right shrink-0">
                  <span className="text-xs text-slate-500 font-mono">{stage.date}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      stage.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : stage.status === 'IN_PROGRESS'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Student Bio */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-sky-600" />
              <span>Personal & Academic Information</span>
            </h2>
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Full Name</span>
                <span className="font-bold text-slate-900">{studentName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Student Matriculation ID</span>
                <span className="font-mono font-bold text-slate-900">{studentId}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Affiliated University</span>
                <span className="font-semibold text-slate-900">{university}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Academic Year</span>
                <span className="font-semibold text-slate-900">{studyYear}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Primary Email</span>
                <span className="font-medium text-slate-900">{email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Emergency Phone</span>
                <span className="font-medium text-slate-900">{phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <span>Clinical Posting Overview</span>
            </h2>
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Target Teaching Hospital</span>
                <span className="font-bold text-slate-900">{targetHospital}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">City & Country</span>
                <span className="font-semibold text-slate-900">{cityCountry}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Specialty Department</span>
                <span className="font-bold text-sky-700">{specialty}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Rotation Period</span>
                <span className="font-medium text-slate-900">
                  {startDate} to {endDate} ({durationWeeks} Weeks)
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Assigned Supervisor</span>
                <span className="font-semibold text-slate-900">{supervisor.name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Supervisor Contact</span>
                <span className="text-slate-700">{supervisor.email} • {supervisor.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Verified Compliance Documents</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
              100% Cleared
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              { name: 'Passport & Identity Verification', size: '2.4 MB', type: 'PDF' },
              { name: 'University Dean Letter & Nomination', size: '1.1 MB', type: 'PDF' },
              { name: 'Official Medical Transcripts (Y1-Y4)', size: '4.8 MB', type: 'PDF' },
              { name: 'Immunization & Health Clearance', size: '1.6 MB', type: 'PDF' },
              { name: 'Malpractice & Observer Indemnity Insurance', size: '920 KB', type: 'PDF' },
              { name: 'AZAAM Clinical Placement Agreement', size: '1.4 MB', type: 'PDF' },
            ].map((doc, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-sky-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                </div>
                <div className="font-bold text-slate-900">{doc.name}</div>
                <div className="text-[11px] text-slate-500">{doc.size} • {doc.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Financials */}
      {activeTab === 'financials' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Tuition & Clinical Fees Clearance</h2>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Financial Clearance Confirmed</p>
                <p className="text-emerald-700 text-[11px]">
                  All placement fees, laboratory access, and supervision honorariums are fully settled under AZAAM master contract.
                </p>
              </div>
            </div>
            <span className="font-bold font-mono text-sm">$500.00 PAID</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Invoice Number</span>
              <p className="font-mono font-bold text-slate-900 text-sm mt-1">AZM-INV-2025-084</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Payment Status</span>
              <p className="font-bold text-emerald-700 text-sm mt-1">Full Payment Received</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Receipt Voucher</span>
              <p className="font-mono font-bold text-slate-900 text-sm mt-1">REC-2025-AZM-419</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Visa & Housing */}
      {activeTab === 'visa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plane className="w-5 h-5 text-indigo-600" />
              <span>International Medical Visa Coordination</span>
            </h2>
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Visa Requirement</span>
                <span className="font-bold text-slate-900">Required (Medical Student Permit)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Embassy Submission Status</span>
                <span className="font-bold text-emerald-700">GRANTED & ISSUED</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Visa Reference No.</span>
                <span className="font-mono font-bold text-slate-900">EV-SOM-2025-8831</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Validity Period</span>
                <span className="font-semibold text-slate-900">90 Days Single Entry</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-teal-600" />
              <span>Host Residency & Accommodation</span>
            </h2>
            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Accommodation Status</span>
                <span className="font-bold text-emerald-700">Confirmed & Reserved</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Residency Complex</span>
                <span className="font-bold text-slate-900">AZAAM International Medical House</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-900">Hodan District, Mogadishu (5 min to Hospital)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Check-in / Check-out</span>
                <span className="font-mono text-slate-900">{startDate} - {endDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Hospital Ward */}
      {activeTab === 'placement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Clinical Placement & Rotation Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-slate-500 font-medium">Assigned Department</span>
              <p className="font-bold text-slate-900 text-sm">{specialty}</p>
              <p className="text-slate-600 text-[11px]">
                Active rotations across Operating Theatres, Surgical Intensive Care Units, and Inpatient Wards.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-slate-500 font-medium">Rotation Schedule</span>
              <p className="font-bold text-slate-900 text-sm">Sun - Thu (08:00 - 15:00)</p>
              <p className="text-slate-600 text-[11px]">
                Plus 1 mandatory emergency on-call rotation per week with the trauma surgery registrar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance & Compliance Metrics</h2>
              <p className="text-xs text-slate-500">Biometric & QR verified check-in records at hospital ward</p>
            </div>
            <span className="text-sm font-bold font-mono text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {attendancePercent}% Compliance Rate
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${attendancePercent}%` }}
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Required Minimum Attendance</span>
              <span>85.0% (University Regulation)</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>Current Status</span>
              <span>Compliant & Meeting Dean Requirements (✓)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. Logbook */}
      {activeTab === 'logbook' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">E-Logbook Procedures Endorsement</h2>
              <p className="text-xs text-slate-500">
                Verified clinical cases, surgeries, and bed-side diagnostic procedures
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {logbookSigned} / {logbookRequired} Signed
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full"
              style={{ width: `${Math.min(100, (logbookSigned / logbookRequired) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Performed Directly</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">14 Procedures</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Assisted Surgeon</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">16 Procedures</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Observed Complex Cases</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">6 Procedures</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. Evaluation */}
      {activeTab === 'evaluation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinical Supervisor Evaluation & Rubrics</h2>
              <p className="text-xs text-slate-500">Consultant performance assessment & competency score</p>
            </div>
            <span className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Grade: {evaluationGrade} ({evaluationScore}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Clinical Competency & Knowledge</span>
                <span className="font-bold text-slate-900 font-mono">95 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Professionalism & Ethics</span>
                <span className="font-bold text-slate-900 font-mono">92 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Patient Communication</span>
                <span className="font-bold text-slate-900 font-mono">90 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Procedural Skills</span>
                <span className="font-bold text-slate-900 font-mono">91 / 100</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-slate-500 font-medium">Supervisor Comments</span>
              <p className="text-slate-700 italic leading-relaxed">
                "Dr. {studentName.split(' ')[0]} demonstrated excellent diagnostic acumen and strong aseptic surgical technique throughout the rotation. Punctual, proactive, and compassionate with patients."
              </p>
              <p className="text-[11px] font-semibold text-sky-700 pt-1">
                — {supervisor.name} ({supervisor.title})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 10. Certificate */}
      {activeTab === 'certificate' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Certificate of Clinical Attachment</h2>
              <p className="text-xs text-slate-500">Official accredited credential with QR verification</p>
            </div>
            {certificateIssued ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                Verified Credential
              </span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border border-amber-200">
                Pending Final Issuance
              </span>
            )}
          </div>

          <div className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-4 text-center max-w-xl mx-auto">
            <Award className="w-12 h-12 text-sky-600 mx-auto" />
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Certificate of Clinical Training</h3>
              <p className="text-xs text-slate-600 mt-1">
                This certifies that <strong>{studentName}</strong> has completed the clinical attachment in{' '}
                <strong>{specialty}</strong> at <strong>{targetHospital}</strong> under AZAAM Medics Network accreditation.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-500">
              <span>Code: {certificateNumber}</span>
              <span>•</span>
              <span>Grade: {evaluationGrade}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
