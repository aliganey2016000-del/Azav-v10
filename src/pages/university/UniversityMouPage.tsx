import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Building2,
  Calendar,
  Award,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Users,
  Stamp,
  Globe2,
  AlertCircle,
  FileSignature,
  UserPlus,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealMouConfig } from '../../services/realDataStore';

export const UniversityMouPage: React.FC = () => {
  const { user } = useAuth();
  const trainees = RealDataStore.getTrainees();
  const partnerName = user?.organizationName || 'Faculty of Medicine & Health Sciences';

  const [mouConfig, setMouConfig] = useState<RealMouConfig>(() =>
    RealDataStore.getMouConfig(partnerName)
  );
  const [activeTab, setActiveTab] = useState<'agreement' | 'quota' | 'appendix'>('agreement');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signName, setSignName] = useState(
    mouConfig.representative || (user ? `${user.firstName} ${user.lastName}` : 'Prof. Dr. Mohamed Ahmed')
  );
  const [signTitle, setSignTitle] = useState(
    mouConfig.representativeTitle || 'Dean of Medicine & Academic Vice Chancellor'
  );
  const [justSigned, setJustSigned] = useState(false);

  useEffect(() => {
    const config = RealDataStore.getMouConfig(partnerName);
    setMouConfig(config);
    if (config.representative) setSignName(config.representative);
    if (config.representativeTitle) setSignTitle(config.representativeTitle);
  }, [partnerName]);

  const handleConfirmSignature = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = RealDataStore.signMou(signName, signTitle, partnerName);
    setMouConfig(updated);
    setShowSignModal(false);
    setJustSigned(true);
  };

  const handleResetMou = () => {
    if (window.confirm('Are you sure you want to reset the MoU signature?')) {
      const updated = RealDataStore.revokeMou();
      setMouConfig(updated);
      setJustSigned(false);
    }
  };

  const isSigned = mouConfig.isSigned;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              Institutional Partnership Framework
            </span>
            {isSigned ? (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified Bilateral MoU (Signed & Active)
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Action Required: Pending Dean's Signature
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Memorandum of Understanding (Bilateral MoU)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Official Clinical Attachment & Medical Student Placement Agreement between{' '}
            <strong className="text-white">AZAAM International Medics Network</strong> and{' '}
            <strong className="text-sky-300">{partnerName}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur border border-white/10 transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Official PDF</span>
          </button>
          {!isSigned ? (
            <button
              onClick={() => setShowSignModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg animate-pulse"
            >
              <FileSignature className="w-4 h-4" />
              <span>✍️ Sign & Endorse MoU Now</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Stamp className="w-4 h-4 text-emerald-400" />
              <span>Update Endorsement Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Just Signed Notification Alert */}
      {justSigned && (
        <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">
                MoU Endorsed & Activated Successfully!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your annual medical student quota ({mouConfig.annualQuota} Trainees) is now fully active. You can proceed with nominating and enrolling your students.
              </p>
            </div>
          </div>
          <Link
            to="/university/students"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nominate First Students Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Unsigned Warning Banner */}
      {!isSigned && (
        <div className="bg-amber-50 border-2 border-amber-400/40 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Step 1: Sign Bilateral MoU Agreement (Dean's Endorsement Required)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Per international clinical education standards, the partner university must bilaterally endorse the agreement before student quota allocation and hospital rotation placement can be activated.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSignModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            <FileSignature className="w-4 h-4" />
            <span>Sign & Endorse Agreement Now</span>
          </button>
        </div>
      )}

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>MoU Protocol No.</span>
            <FileCheck2 className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-sm font-bold font-mono text-slate-900">{mouConfig.mouNumber}</p>
          {isSigned ? (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active & Legally Endorsed
            </span>
          ) : (
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Signature
            </span>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Annual Student Quota</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {trainees.length} / {mouConfig.annualQuota}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (trainees.length / mouConfig.annualQuota) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block">
            {Math.max(0, mouConfig.annualQuota - trainees.length)} Slots available for nomination
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Accredited Teaching Hospitals</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{mouConfig.partnerHospitalsCount} Hospitals</p>
          <span className="text-[11px] text-teal-700 font-medium">Across 6 Partner Countries</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Agreement Validity</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-slate-900">3 Years (2025 – 2028)</p>
          <span className="text-[11px] text-emerald-600 font-medium">Auto-Renewal Framework</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('agreement')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'agreement'
              ? 'border-sky-600 text-sky-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>MoU Articles & Clauses</span>
        </button>
        <button
          onClick={() => setActiveTab('quota')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'quota'
              ? 'border-sky-600 text-sky-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Hospital Quotas & Rotations</span>
        </button>
        <button
          onClick={() => setActiveTab('appendix')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'appendix'
              ? 'border-sky-600 text-sky-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Destination Protocols & Visa Aid</span>
        </button>
      </div>

      {/* Tab Content 1: Agreement Clauses */}
      {activeTab === 'agreement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                Official Bilateral Document
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Institutional Clinical Training & Rotation Protocol
              </h2>
            </div>
            {isSigned ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Status: Bilaterally Signed & Active ({mouConfig.signedAt || 'Verified'})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Status: Awaiting University Dean's Endorsement</span>
              </div>
            )}
          </div>

          {/* Clauses list */}
          <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono text-xs">
                  1
                </span>
                Purpose & Scope of Academic Collaboration
              </h3>
              <p className="text-slate-600 pl-8">
                This Memorandum of Understanding establishes the bilateral operational protocol between AZAAM
                International Medics Network and <strong>{partnerName}</strong>. AZAAM facilitates accredited clinical
                rotations, elective clerkships, hospital placements, visa facilitation, logbook management, and
                verified credentialing for medical, dental, and nursing students.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono text-xs">
                  2
                </span>
                Obligations of AZAAM International Medics
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-8">
                <li>
                  Secure certified placements in teaching hospitals with accredited consultant preceptors &
                  clinical supervisors.
                </li>
                <li>
                  Facilitate official clinical attachment letters, embassy visa sponsor documentation, and local
                  hospital clearances.
                </li>
                <li>
                  Provide access to the unified AZAAM Digital Platform for daily QR attendance, electronic logbooks,
                  and supervisor evaluation tracking.
                </li>
                <li>
                  Issue tamper-proof, QR-code verifiable Clinical Attachment Certificates upon successful rotation
                  completion.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono text-xs">
                  3
                </span>
                Obligations of the Partner University
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-8">
                <li>
                  Nominate eligible medical students in good academic standing (minimum 3rd-year medical clerkship).
                </li>
                <li>
                  Endorse and verify the student's academic credentials and medical faculty standing.
                </li>
                <li>
                  Ensure nominated students adhere to host hospital bylaws, ethical codes of conduct, and patient
                  confidentiality (HIPAA/GDPR compliant).
                </li>
                <li>
                  Coordinate tuition/rotation placement fee schedules as per the institutional bilateral agreement.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-mono text-xs">
                  4
                </span>
                Clinical Specialties & Department Scope
              </h3>
              <div className="pl-8 flex flex-wrap gap-1.5 pt-1">
                {mouConfig.specialtiesCovered.map((spec) => (
                  <span
                    key={spec}
                    className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Endorsement & Signature Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-4">Official Endorsements & Signatures</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* University Signer Box */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">For Partner University</span>
                  <Stamp className="w-5 h-5 text-sky-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-base">{mouConfig.representative}</p>
                  <p className="text-xs text-slate-500">{mouConfig.representativeTitle}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    Signed Date: {mouConfig.signedAt || 'Pending Signature'}
                  </p>
                </div>
                {isSigned ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Digital Signature Verified
                    </span>
                    <button
                      onClick={handleResetMou}
                      className="text-[10px] text-slate-400 hover:text-rose-600 underline"
                      title="Reset signature"
                    >
                      Reset Signature
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setShowSignModal(true)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      ✍️ Endorse & Sign on Behalf of University
                    </button>
                  </div>
                )}
              </div>

              {/* AZAAM Director Box */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">For AZAAM Medics Network</span>
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-base">{mouConfig.azaamDirector}</p>
                  <p className="text-xs text-slate-500">Director of International Clinical Affairs</p>
                  <p className="text-xs text-slate-400 font-mono">Endorsed: {mouConfig.validityStart}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold pt-2 border-t border-slate-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Institutional Seal Affixed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Quota Allocations */}
      {activeTab === 'quota' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Hospital Capacity & Rotation Quota Allocation</h2>
            <p className="text-xs text-slate-500">
              Allocated medical trainee rotation slots reserved for your university students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                hospital: 'Madina Teaching Hospital',
                city: 'Mogadishu',
                allocated: 20,
                used: Math.min(20, trainees.length),
                specialties: ['General Surgery', 'Emergency Medicine', 'Orthopedics'],
              },
              {
                hospital: 'Digfeer Specialized Hospital',
                city: 'Mogadishu',
                allocated: 15,
                used: 0,
                specialties: ['Internal Medicine', 'Cardiology', 'ICU Care'],
              },
              {
                hospital: 'Kenyatta National Hospital (Affiliated)',
                city: 'Nairobi',
                allocated: 10,
                used: 0,
                specialties: ['Pediatric Surgery', 'Neurosurgery'],
              },
              {
                hospital: 'Ankara City Hospital (Elective)',
                city: 'Ankara, Turkey',
                allocated: 10,
                used: 0,
                specialties: ['Cardiothoracic', 'Oncology'],
              },
              {
                hospital: 'Mulago Hospital (Elective)',
                city: 'Kampala, Uganda',
                allocated: 5,
                used: 0,
                specialties: ['Infectious Diseases', 'Obstetrics'],
              },
            ].map((h, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{h.hospital}</h4>
                    <span className="text-xs text-slate-500">{h.city}</span>
                  </div>
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {h.used} / {h.allocated} Slots
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 rounded-full"
                    style={{ width: `${(h.used / h.allocated) * 100}%` }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Available Rotations:</span>
                  <div className="flex flex-wrap gap-1">
                    {h.specialties.map((s) => (
                      <span
                        key={s}
                        className="bg-white border border-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Destination Protocols */}
      {activeTab === 'appendix' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Destination Logistics & Visa Protocols</h2>
          <p className="text-xs text-slate-500">
            Official guidelines for student visas, medical council clearances, and travel support
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-sky-600" />
                <span>Visa Facilitation & Official Sponsorship</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                AZAAM issues the official host invitation letter, clinical attachment endorsement, and
                sponsorship guarantee for student visa applications submitted to embassies in Somalia, Kenya,
                Turkey, and other destinations.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Medical Malpractice & Clinical Indemnity</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                All trainees are insured under institutional medical student clinical observer indemnity while
                under the direct supervision of assigned host hospital consultants.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <FileSignature className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Digital Endorsement of Bilateral MoU</h3>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              By confirming, you officially endorse the bilateral Clinical Attachment Agreement on behalf of{' '}
              <strong className="text-slate-900">{partnerName}</strong>. This unlocks the annual student quota ({mouConfig.annualQuota} trainees).
            </p>

            <form onSubmit={handleConfirmSignature} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dean / Authorized Representative Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. Mohamed Ahmed"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Academic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dean of Medicine & Health Sciences"
                  value={signTitle}
                  onChange={(e) => setSignTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] flex items-start gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Legally binding digital seal will be stamped with timestamp {new Date().toISOString().split('T')[0]}.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Endorse & Activate MoU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
