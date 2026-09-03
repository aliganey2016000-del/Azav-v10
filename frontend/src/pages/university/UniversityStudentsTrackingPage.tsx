import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Plane,
  Building2,
  UserCheck,
  BookOpen,
  Award,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronRight,
  ExternalLink,
  Download,
  Calendar,
  X,
  Stethoscope,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  Check,
  Trash2,
  RotateCcw,
  FileSignature,
  ArrowRight,
} from 'lucide-react';
import { RealDataStore, RealTrainee, RealMouConfig } from '../../services/realDataStore';
import { useAuth } from '../../context/AuthContext';

export const UniversityStudentsTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const partnerName = user?.organizationName || 'Faculty of Medicine';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<RealTrainee | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INTERNATIONAL' | 'CERTIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [hospitalFilter, setHospitalFilter] = useState('ALL');
  const [mouConfig, setMouConfig] = useState<RealMouConfig>(() => RealDataStore.getMouConfig(partnerName));

  // Modal State for Nominating a New Trainee
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [showMouRequiredModal, setShowMouRequiredModal] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    email: '',
    phone: '',
    studyYear: '5th Year Clinical Clerkship',
    specialty: 'General Surgery & Trauma',
    targetHospital: 'Madina Teaching Hospital',
    cityCountry: 'Mogadishu, Somalia',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2025-12-31',
    durationWeeks: 8,
    visaRequired: false,
    supervisorName: 'Dr. Sarah Jenkins',
    supervisorTitle: 'Consultant General & Trauma Surgeon',
    supervisorPhone: '+252 61 700 0110',
    supervisorEmail: 'sjenkins@madina.org',
    rotationSchedule: 'Sun - Thu (08:00 - 15:00) • OR & Surgical Wards',
    logbookRequired: 40,
  });

  // Load real trainees and MoU on mount
  useEffect(() => {
    const loaded = RealDataStore.getTrainees();
    setTrainees(loaded);
    if (loaded.length > 0) {
      setSelectedTrainee(loaded[0]);
    }
    setMouConfig(RealDataStore.getMouConfig(partnerName));
  }, [partnerName]);

  const handleOpenNominateModal = () => {
    if (!mouConfig.isSigned) {
      setShowMouRequiredModal(true);
      return;
    }
    setIsNominateModalOpen(true);
  };

  const handleCreateTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrainee: RealTrainee = {
      id: `TRN-${Date.now().toString().slice(-4)}`,
      studentName: formData.studentName,
      studentId: formData.studentId,
      email: formData.email,
      phone: formData.phone,
      studyYear: formData.studyYear,
      specialty: formData.specialty,
      targetHospital: formData.targetHospital,
      cityCountry: formData.cityCountry,
      startDate: formData.startDate,
      endDate: formData.endDate,
      durationWeeks: Number(formData.durationWeeks) || 8,
      applicationStatus: 'ACCEPTED',
      visaStatus: formData.visaRequired ? 'APPLIED' : 'NOT_REQUIRED',
      hospitalPlacementStatus: 'CONFIRMED',
      assignedSupervisor: {
        name: formData.supervisorName,
        title: formData.supervisorTitle,
        phone: formData.supervisorPhone,
        email: formData.supervisorEmail,
      },
      rotationSchedule: formData.rotationSchedule,
      attendancePercent: 100,
      attendanceDays: { attended: 0, total: (Number(formData.durationWeeks) || 8) * 5 },
      logbookProceduresSigned: 0,
      logbookRequired: Number(formData.logbookRequired) || 40,
      evaluationScore: null,
      evaluationGrade: null,
      evaluationStatus: 'PENDING',
      certificateIssued: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addTrainee(newTrainee);
    setTrainees(updated);
    setSelectedTrainee(newTrainee);
    setIsNominateModalOpen(false);

    // Reset Form
    setFormData({
      studentName: '',
      studentId: '',
      email: '',
      phone: '',
      studyYear: '5th Year Clinical Clerkship',
      specialty: 'General Surgery & Trauma',
      targetHospital: 'Madina Teaching Hospital',
      cityCountry: 'Mogadishu, Somalia',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2025-12-31',
      durationWeeks: 8,
      visaRequired: false,
      supervisorName: 'Dr. Sarah Jenkins',
      supervisorTitle: 'Consultant General & Trauma Surgeon',
      supervisorPhone: '+252 61 700 0110',
      supervisorEmail: 'sjenkins@madina.org',
      rotationSchedule: 'Sun - Thu (08:00 - 15:00) • OR & Surgical Wards',
      logbookRequired: 40,
    });
  };

  const handleDeleteTrainee = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove trainee ${name}?`)) {
      const updated = RealDataStore.deleteTrainee(id);
      setTrainees(updated);
      if (selectedTrainee?.id === id) {
        setSelectedTrainee(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to reset and clear all trainee records?')) {
      RealDataStore.saveTrainees([]);
      setTrainees([]);
      setSelectedTrainee(null);
    }
  };

  // Filter logic
  const filteredTrainees = trainees.filter((t) => {
    const matchesSearch =
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.targetHospital.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty = specialtyFilter === 'ALL' || t.specialty.includes(specialtyFilter);
    const matchesHospital = hospitalFilter === 'ALL' || t.targetHospital.includes(hospitalFilter);

    if (!matchesSearch || !matchesSpecialty || !matchesHospital) return false;

    if (activeTab === 'ACTIVE') return t.hospitalPlacementStatus === 'CONFIRMED' && !t.certificateIssued;
    if (activeTab === 'PENDING') return t.applicationStatus === 'SUBMITTED' || t.visaStatus === 'EMBASSY_PROCESSING';
    if (activeTab === 'INTERNATIONAL') return t.visaStatus !== 'NOT_REQUIRED';
    if (activeTab === 'CERTIFIED') return t.certificateIssued;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              Real Data Trainee Hub
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              {partnerName}
            </span>
            {mouConfig.isSigned ? (
              <span className="bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-indigo-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                MoU Active ({trainees.length} / {mouConfig.annualQuota} Quota)
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                MoU Unsigned
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Our Medical Trainees Tracking (A to Z)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Live tracker for our enrolled medical students: track application vetting, embassy visa issuance,
            hospital ward placement, daily attendance, logbook procedure sign-offs, evaluations, and accredited certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {trainees.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/30 transition"
              title="Reset & clear all trainee records"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset/Clear</span>
            </button>
          )}
          <button
            onClick={handleOpenNominateModal}
            className={`inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition ${
              mouConfig.isSigned
                ? 'bg-sky-600 hover:bg-sky-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nominate Real Student</span>
          </button>
        </div>
      </div>

      {/* MoU Required Warning Banner if not signed */}
      {!mouConfig.isSigned && (
        <div className="bg-amber-50 border-2 border-amber-400/50 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Action Required: Sign Bilateral MoU Agreement (Dean's Endorsement)
              </h3>
              <p className="text-xs text-amber-800 mt-1 max-w-3xl leading-relaxed">
                To unlock your university's annual quota ({mouConfig.annualQuota} Trainee slots) and begin nominating medical students for hospital placements, your faculty must bilaterally sign the MoU first.
              </p>
            </div>
          </div>
          <Link
            to="/university/mou"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            <span>✍️ Go to MoU Signing Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Container */}
      {trainees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Trainees Enrolled Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {mouConfig.isSigned
                ? 'Your bilateral MoU is signed and active! Click the button below to nominate and dispatch your medical students.'
                : 'Please endorse the Bilateral MoU agreement first to unlock student nomination and placement quotas.'}
            </p>
          </div>
          {mouConfig.isSigned ? (
            <button
              onClick={() => setIsNominateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nominate First Medical Trainee</span>
            </button>
          ) : (
            <Link
              to="/university/mou"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <FileSignature className="w-4 h-4" />
              <span>Sign MoU First</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student List & Filters */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, ID, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Status Tab Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {(['ALL', 'ACTIVE', 'PENDING', 'INTERNATIONAL', 'CERTIFIED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                      activeTab === tab
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'ALL' && `All (${trainees.length})`}
                    {tab === 'ACTIVE' && 'Active in Wards'}
                    {tab === 'PENDING' && 'Pending'}
                    {tab === 'INTERNATIONAL' && 'International'}
                    {tab === 'CERTIFIED' && 'Certified'}
                  </button>
                ))}
              </div>
            </div>

            {/* Trainee Cards */}
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredTrainees.map((t) => {
                const isSelected = selectedTrainee?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrainee(t)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-400 shadow-sm ring-1 ring-sky-400'
                        : 'bg-white border-slate-200 hover:border-sky-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{t.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.studentId}</span>
                        </div>
                        <p className="text-xs text-sky-800 font-medium">{t.specialty}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {t.targetHospital}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-1.5 shrink-0">
                        {t.certificateIssued ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Certified
                          </span>
                        ) : t.hospitalPlacementStatus === 'CONFIRMED' ? (
                          <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            In Rotation
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Vetting
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Log: {t.logbookProceduresSigned}/{t.logbookRequired}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{t.durationWeeks} Weeks Attachment</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrainee(t.id, t.studentName);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete trainee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed A-to-Z Trainee Dossier */}
          <div className="lg:col-span-7">
            {selectedTrainee ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedTrainee.studentName}</h2>
                      <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono rounded-md font-semibold">
                        {selectedTrainee.studentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {selectedTrainee.studyYear} • Enrolled via {partnerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedTrainee.certificateIssued && (
                      <Link
                        to="/dashboard/certificates"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 6-Step Clinical Lifecycle Journey */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Full Attachment Lifecycle (A to Z Tracking)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Step 1: Nomination & Vetting */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                            1
                          </span>
                          Application & Vetting
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {selectedTrainee.applicationStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Academic credentials verified by Faculty Dean & AZAAM International Committee.
                      </p>
                    </div>

                    {/* Step 2: Visa & Destination Clearances */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                            2
                          </span>
                          Embassy Visa & Clearance
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          {selectedTrainee.visaStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {selectedTrainee.visaStatus === 'NOT_REQUIRED'
                          ? 'Domestic rotation (Local clinical clearance endorsed).'
                          : 'Official sponsorship letter issued to destination embassy.'}
                      </p>
                    </div>

                    {/* Step 3: Hospital Placement & Preceptor */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                            3
                          </span>
                          Hospital Placement
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {selectedTrainee.hospitalPlacementStatus}
                        </span>
                      </div>
                      <div className="text-[11px] space-y-0.5 text-slate-600">
                        <p className="font-semibold text-slate-900">{selectedTrainee.targetHospital}</p>
                        <p className="text-slate-500">{selectedTrainee.cityCountry}</p>
                        <p className="text-sky-700 font-medium pt-1">
                          Preceptor: {selectedTrainee.assignedSupervisor.name} ({selectedTrainee.assignedSupervisor.title})
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Daily QR Attendance */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                            4
                          </span>
                          QR Attendance Rate
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                          {selectedTrainee.attendancePercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${selectedTrainee.attendancePercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Verified biometric/QR check-ins logged by hospital ward coordinator.
                      </p>
                    </div>

                    {/* Step 5: Clinical Logbook Signed */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                            5
                          </span>
                          E-Logbook Procedures
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                          {selectedTrainee.logbookProceduresSigned} / {selectedTrainee.logbookRequired} Signed
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (selectedTrainee.logbookProceduresSigned / selectedTrainee.logbookRequired) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Surgical, diagnostic, and clinical cases verified & endorsed by attending supervisor.
                      </p>
                    </div>

                    {/* Step 6: Consultant Evaluation & Certification */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                            6
                          </span>
                          Evaluation & Certificate
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          {selectedTrainee.evaluationGrade || 'In Progress'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {selectedTrainee.certificateIssued
                          ? `Certificate Issued & Verified (${selectedTrainee.certificateNumber || 'AZAAM-CERT'})`
                          : 'Pending final supervisor rubrics sign-off upon rotation completion.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Contact & Details */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {selectedTrainee.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {selectedTrainee.phone}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">Enrolled: {selectedTrainee.createdAt}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Select a trainee from the left list to view their comprehensive A-to-Z clinical dossier
              </div>
            )}
          </div>
        </div>
      )}

      {/* MoU Required Guidance Modal */}
      {showMouRequiredModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <FileSignature className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Bilateral MoU Signature Required</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To begin nominating and dispatching your medical students, your university must first bilaterally endorse the{' '}
                <strong>Memorandum of Understanding (Bilateral MoU)</strong> to unlock your annual placement quota (
                {mouConfig.annualQuota} Trainee slots).
              </p>
            </div>

            <div className="p-3 bg-sky-50 text-sky-900 rounded-xl text-xs space-y-1">
              <p className="font-semibold">What is covered in the Bilateral MoU?</p>
              <ul className="list-disc list-inside text-[11px] text-sky-800 space-y-0.5">
                <li>Annual guaranteed student quota ({mouConfig.annualQuota} slots)</li>
                <li>Accredited teaching hospital placements & clinical specialties</li>
                <li>Visa sponsorship letters & clinical observer indemnity</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMouRequiredModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Go Back
              </button>
              <Link
                to="/university/mou"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                <span>Sign MoU Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Nominate Student Modal */}
      {isNominateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Nominate & Dispatch Real Medical Trainee</h3>
              </div>
              <button
                onClick={() => setIsNominateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ahmed Hassan Ali"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">University Student ID / Matric No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-2021-0492"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ahmed.ali@university.edu.so"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+252 61 500 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Year / Clerkship Stage *</label>
                  <select
                    value={formData.studyYear}
                    onChange={(e) => setFormData({ ...formData, studyYear: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="4th Year Medical Clerkship">4th Year Medical Clerkship</option>
                    <option value="5th Year Senior Clerkship">5th Year Senior Clerkship</option>
                    <option value="6th Year Final Year Medical Internship">6th Year Final Year Medical Internship</option>
                    <option value="Postgraduate Clinical Fellow">Postgraduate Clinical Fellow</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Specialty *</label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="General Surgery & Trauma">General Surgery & Trauma</option>
                    <option value="Internal Medicine & Cardiology">Internal Medicine & Cardiology</option>
                    <option value="Pediatrics & Neonatal Intensive Care">Pediatrics & Neonatal Intensive Care</option>
                    <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                    <option value="Orthopedics & Fracture Care">Orthopedics & Fracture Care</option>
                    <option value="Emergency & Critical Care Medicine">Emergency & Critical Care Medicine</option>
                    <option value="Cardiothoracic Surgery (Elective)">Cardiothoracic Surgery (Elective)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Accredited Teaching Hospital *</label>
                  <select
                    value={formData.targetHospital}
                    onChange={(e) => {
                      const hosp = e.target.value;
                      let loc = 'Mogadishu, Somalia';
                      let sup = 'Dr. Sarah Jenkins';
                      let supTitle = 'Consultant General Surgeon';
                      if (hosp.includes('Kenyatta')) {
                        loc = 'Nairobi, Kenya';
                        sup = 'Prof. Peter Mwangi';
                        supTitle = 'Head of Pediatric Surgery';
                      } else if (hosp.includes('Ankara')) {
                        loc = 'Ankara, Turkey';
                        sup = 'Dr. Mehmet Ozkan';
                        supTitle = 'Consultant Cardiothoracic Surgeon';
                      } else if (hosp.includes('Digfeer')) {
                        loc = 'Mogadishu, Somalia';
                        sup = 'Dr. Farhan Ismail';
                        supTitle = 'Head of Internal Medicine';
                      }
                      setFormData({
                        ...formData,
                        targetHospital: hosp,
                        cityCountry: loc,
                        supervisorName: sup,
                        supervisorTitle: supTitle,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Madina Teaching Hospital">Madina Teaching Hospital (Mogadishu)</option>
                    <option value="Digfeer Specialized Hospital">Digfeer Specialized Hospital (Mogadishu)</option>
                    <option value="Kenyatta National Hospital (Affiliated)">Kenyatta National Hospital (Nairobi, Kenya)</option>
                    <option value="Ankara City Hospital (Elective)">Ankara City Hospital (Ankara, Turkey)</option>
                    <option value="Mulago Teaching Hospital">Mulago Teaching Hospital (Kampala, Uganda)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attachment Duration (Weeks) *</label>
                  <input
                    type="number"
                    min="2"
                    max="52"
                    required
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Logbook Cases *</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    required
                    value={formData.logbookRequired}
                    onChange={(e) => setFormData({ ...formData, logbookRequired: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Does this student require International Visa Sponsorship?</p>
                  <p className="text-[11px] text-slate-500">For cross-border rotations to Kenya, Turkey, Uganda, or Egypt</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visaRequired}
                    onChange={(e) => setFormData({ ...formData, visaRequired: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNominateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md"
                >
                  Confirm & Dispatch Trainee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
