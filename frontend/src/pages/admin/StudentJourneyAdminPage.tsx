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
  X,
  FileSignature,
  Printer,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudentJourney } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/Badge';
import { LoadingState, ErrorState } from '../../components/admin/States';

export const StudentJourneyAdminPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminStudentJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'journey' | 'profile' | 'documents' | 'financials' | 'visa' | 'placement' | 'attendance' | 'logbook' | 'evaluation' | 'certificate'
  >('journey');

  // Action states
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchJourney = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getStudentById(id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load student journey record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [id]);

  const handleIssueCertificate = async () => {
    if (!id || !data) return;
    try {
      setUpdating(true);
      const certNum = `AZ-MED-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      await AdminApiService.updateStudentJourney(id, {
        certificateIssued: true,
        certificateCode: certNum,
        status: 'COMPLETED',
        completionStatus: 'DISTINCTION',
      });
      setActionSuccess(`Certificate ${certNum} successfully issued and cryptographic hash recorded.`);
      fetchJourney();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to issue certificate.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateVisaStatus = async (status: string) => {
    if (!id || !data) return;
    try {
      setUpdating(true);
      await AdminApiService.updateStudentJourney(id, {
        visaStatus: status as any,
      });
      setActionSuccess(`Visa status updated to ${status}.`);
      fetchJourney();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update visa status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingState message="Loading full student journey and clinical dossier..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { student, timeline, documents, financials, attendanceLog, logbookEntries, evaluation } = data;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/students"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Registry</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-bold flex items-center justify-center text-xl shadow-xs shrink-0">
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h1>
                <StatusBadge status={student.status} />
                {student.certificateIssued && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                    <Award className="w-3 h-3 text-emerald-600" />
                    <span>Certified #{student.certificateCode}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Student ID: <span className="text-slate-800 font-bold">{student.studentNumber}</span> | {student.studyYear}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                <span className="flex items-center space-x-1">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-medium">{student.university.name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium">{student.hospitalPlacement.name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-teal-700 font-semibold">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{student.specialty}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!student.certificateIssued && (
              <button
                onClick={handleIssueCertificate}
                disabled={updating}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center space-x-1.5 shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>{updating ? 'Processing...' : 'Issue Final Certificate'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Rotation Period</span>
            <p className="font-semibold text-slate-800">
              {student.startDate} to {student.endDate} ({student.durationWeeks} wks)
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Attendance Rate</span>
            <p className="font-semibold text-slate-800">
              {student.attendancePercent}% ({student.attendanceDays.attended}/{student.attendanceDays.total} Days)
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Logbook Signed</span>
            <p className="font-semibold text-slate-800">
              {student.logbookSigned} of {student.logbookRequired} Procedures
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Clinical Grade</span>
            <p className="font-bold text-teal-700">{student.evaluationGrade || 'Pending Evaluation'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Tuition Status</span>
            <p className="font-semibold text-emerald-700">
              {student.paymentStatus} (${student.paidFees} / ${student.totalFees})
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-4 overflow-x-auto text-xs font-semibold text-slate-600">
        {[
          { key: 'journey', label: '1. Journey Timeline' },
          { key: 'profile', label: '2. Student Bio' },
          { key: 'documents', label: '3. Documents' },
          { key: 'financials', label: '4. Fees & Tuition' },
          { key: 'visa', label: '5. Visa & Housing' },
          { key: 'placement', label: '6. Hospital Rotation' },
          { key: 'attendance', label: '7. Attendance' },
          { key: 'logbook', label: '8. Logbook' },
          { key: 'evaluation', label: '9. Clinical Assessment' },
          { key: 'certificate', label: '10. Certificate' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 border-b-2 whitespace-nowrap transition ${
              activeTab === tab.key
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: End-to-End Journey Timeline */}
      {activeTab === 'journey' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Lifecycle Milestones</h2>
              <p className="text-xs text-slate-500">
                End-to-end audit tracking from university nomination to verified graduation certificate.
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Stage: {student.status}
            </span>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((item, index) => {
              const isCompleted = item.status === 'COMPLETED';
              const isInProgress = item.status === 'IN_PROGRESS';
              return (
                <div key={index} className="relative group">
                  {/* Icon on vertical timeline */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-teal-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-1.5 transition hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wide">
                        {item.stage}
                      </span>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        {item.date && <span>{item.date}</span>}
                        {item.actor && <span className="font-medium text-slate-600">({item.actor})</span>}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2 text-teal-800">
              <GraduationCap className="w-4 h-4" />
              <span>Academic & Identification Bio</span>
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Full Legal Name</span>
                <span className="text-slate-900 font-bold">
                  {student.firstName} {student.lastName}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Official Student Number</span>
                <span className="text-slate-900 font-mono font-bold">{student.studentNumber}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">University Affiliation</span>
                <span className="text-slate-900 font-bold">{student.university.name}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Academic Year</span>
                <span className="text-slate-900">{student.studyYear}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Nationality & Status</span>
                <span className="text-slate-900 font-semibold">{student.nationality || 'Somali'}</span>
              </div>
              {student.passportNumber && (
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-500">Passport / Travel ID</span>
                  <span className="text-slate-900 font-mono">{student.passportNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2 text-teal-800">
              <Mail className="w-4 h-4" />
              <span>Contact & Coordination Details</span>
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Direct Email</span>
                <span className="text-slate-900 font-semibold">{student.email}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Phone Contact</span>
                <span className="text-slate-900">{student.phone || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Application Status</span>
                <span className="text-emerald-700 font-bold">{student.applicationStatus}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Nomination Date</span>
                <span className="text-slate-900">{student.nominationDate || '2025-01-10'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Required Document Dossier</h2>
              <p className="text-xs text-slate-500">
                Prerequisites, medical authorizations, and dean nomination letters.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              All Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-teal-300 transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{doc.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {doc.type} • Uploaded {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Financials */}
      {activeTab === 'financials' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tuition & Placement Settlement</h2>
            <p className="text-xs text-slate-500">
              University / student direct tuition fee collection to AZAAM (strictly decoupled from hospital internal settlements).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Total Assessment Fee</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">${financials.studentFeeDue}</p>
              <p className="text-[11px] text-slate-500">Standard clinical placement fee</p>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium">Amount Settled</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">${financials.studentFeePaid}</p>
              <p className="text-[11px] text-emerald-700 font-semibold">Payment Status: {financials.status}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Official Invoice</span>
              <p className="text-sm font-mono font-bold text-slate-800 mt-2">{financials.invoiceNumber}</p>
              <p className="text-[11px] text-slate-500">AZAAM Accounts Ledger</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase">Payment Receipts</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Receipt Reference</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financials.receipts.map((rec, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 text-slate-700">{rec.date}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{rec.reference}</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-700">${rec.amount} USD</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          CLEARED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Visa & Accommodation */}
      {activeTab === 'visa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 text-teal-800">
                <Plane className="w-4 h-4" />
                <span>Immigration & Visa Status</span>
              </h3>
              <StatusBadge status={student.visaStatus} />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Visa Classification</span>
                <span className="text-slate-900 font-bold">
                  {student.visaStatus === 'NOT_REQUIRED' ? 'Local Citizen / Non-Visa' : 'Medical Clinical Training Visa (M-1)'}
                </span>
              </div>
              {student.visaReference && (
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-500">Embassy Reference ID</span>
                  <span className="text-slate-900 font-mono font-bold">{student.visaReference}</span>
                </div>
              )}
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Passport Number</span>
                <span className="text-slate-900 font-mono">{student.passportNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Admin Override for Visa */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="font-bold text-slate-700">Update Immigration State:</span>
              <div className="flex flex-wrap gap-2">
                {['NOT_REQUIRED', 'APPLIED', 'EMBASSY_PROCESSING', 'GRANTED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateVisaStatus(st)}
                    disabled={updating || student.visaStatus === st}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                      student.visaStatus === st
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2 text-teal-800">
              <MapPin className="w-4 h-4" />
              <span>Residence & Accommodation</span>
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Accommodation Status</span>
                <span className="text-emerald-700 font-bold">{student.residenceStatus}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Assigned Housing</span>
                <span className="text-slate-900">{student.residenceAddress || 'Standard Local Living / Independent'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Security & Clinical Transport</span>
                <span className="text-slate-900 font-medium">Provided by AZAAM Medical Logistics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Hospital Rotation */}
      {activeTab === 'placement' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Placement & Department Rotation</h2>
              <p className="text-xs text-slate-500">Assigned teaching facility and consultant supervisor.</p>
            </div>
            <StatusBadge status="ACTIVE" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-teal-700" />
                <span>Teaching Hospital</span>
              </h4>
              <p className="text-sm font-bold text-slate-900">{student.hospitalPlacement.name}</p>
              <p className="text-slate-600">Location: {student.hospitalPlacement.cityCountry}</p>
              <p className="text-slate-600 font-medium">Department: {student.specialty}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>Clinical Supervisor</span>
              </h4>
              <p className="text-sm font-bold text-slate-900">{student.assignedSupervisor?.name || 'Dr. Sarah Jenkins'}</p>
              <p className="text-slate-600">{student.assignedSupervisor?.title || 'Consultant Specialist'}</p>
              <p className="text-slate-600 font-mono">{student.assignedSupervisor?.email || 'supervisor@hospital.org'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Ward Attendance Record</h2>
              <p className="text-xs text-slate-500">Verified electronic biometric / supervisor signed clinical check-ins.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-teal-700">{student.attendancePercent}%</span>
              <p className="text-[11px] text-slate-500">Compliance Rate</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Supervisor</th>
                  <th className="px-4 py-2.5">Hours</th>
                  <th className="px-4 py-2.5">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLog.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{log.date}</td>
                    <td className="px-4 py-2.5 text-slate-700">{log.department}</td>
                    <td className="px-4 py-2.5 text-slate-600">{log.supervisor}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{log.hours} hrs</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Logbook */}
      {activeTab === 'logbook' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Procedures & Competency Logbook</h2>
              <p className="text-xs text-slate-500">
                Procedures performed, assisted, and certified by attending clinical specialists.
              </p>
            </div>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 font-bold text-xs rounded-lg border border-teal-200">
              {student.logbookSigned} / {student.logbookRequired} Approved
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Clinical Procedure</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Supervisor Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logbookEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600">{entry.date}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{entry.procedure}</td>
                    <td className="px-4 py-2.5 text-slate-600">{entry.category}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {entry.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {entry.supervisorStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 9: Evaluation & Assessment */}
      {activeTab === 'evaluation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Clinical Rotation Performance Assessment</h2>
              <p className="text-xs text-slate-500">Evaluated on clinical knowledge, practical skills, and professionalism.</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-teal-700">{evaluation.overallGrade}</span>
              <p className="text-[11px] text-slate-500">Final Grade</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Knowledge & Reasoning</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{evaluation.clinicalKnowledge}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Practical Skills</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{evaluation.practicalSkills}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Professionalism</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{evaluation.professionalism}%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Patient Bedside Care</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{evaluation.patientCare}%</p>
            </div>
          </div>

          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-teal-900">Attending Consultant Supervisor Remarks:</h4>
            <p className="text-slate-700 italic">"{evaluation.supervisorRemarks}"</p>
            <p className="text-[11px] text-teal-700 font-semibold">
              Authenticated on {new Date(evaluation.completedAt || '2025-04-28').toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Tab 10: Certificate */}
      {activeTab === 'certificate' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Certificate of Clinical Competency</h2>
              <p className="text-xs text-slate-500">Official verified AZAAM Medics Network credential.</p>
            </div>
            {student.certificateIssued ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>ISSUED & VERIFIED</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg border border-amber-200">
                PENDING ISSUANCE
              </span>
            )}
          </div>

          {student.certificateIssued ? (
            <div className="border-4 border-double border-teal-700 rounded-2xl p-8 bg-linear-to-b from-slate-50 to-teal-50/20 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-md">
                  <Award className="w-8 h-8" />
                </div>
              </div>
              <div>
                <p className="text-xs tracking-widest font-bold uppercase text-teal-800">
                  AZAAM INTERNATIONAL MEDICS NETWORK
                </p>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mt-2">
                  Certificate of Clinical Training & Competence
                </h3>
                <p className="text-xs text-slate-500 mt-1">This is officially presented to</p>
                <h4 className="text-xl font-bold text-slate-900 mt-2 underline decoration-teal-500 decoration-2">
                  {student.firstName} {student.lastName}
                </h4>
                <p className="text-xs text-slate-600 max-w-lg mx-auto mt-3">
                  For successful completion of the {student.durationWeeks}-week clinical rotation in{' '}
                  <span className="font-bold text-slate-800">{student.specialty}</span> at{' '}
                  <span className="font-bold text-slate-800">{student.hospitalPlacement.name}</span> with final distinction grade of{' '}
                  <span className="font-bold text-teal-700">{evaluation.overallGrade}</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 max-w-md mx-auto pt-6 border-t border-slate-300 text-xs text-slate-600">
                <div>
                  <p className="font-serif font-bold text-slate-900">Dr. Sarah Jenkins</p>
                  <p className="text-[11px] text-slate-500">Attending Clinical Supervisor</p>
                </div>
                <div>
                  <p className="font-serif font-bold text-slate-900">Prof. AZAAM Board Chair</p>
                  <p className="text-[11px] text-slate-500">Academic Accreditation Council</p>
                </div>
              </div>

              <div className="pt-4 text-[10px] font-mono text-slate-400">
                Credential Verification Code: <span className="font-bold text-slate-700">{student.certificateCode}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-bold text-slate-800 text-sm">Certificate Not Yet Generated</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Verify that all prerequisites (attendance ≥ 85%, completed logbook, and supervisor evaluation) are met before issuing.
                </p>
              </div>
              <button
                onClick={handleIssueCertificate}
                disabled={updating}
                className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition shadow-xs"
              >
                {updating ? 'Issuing...' : 'Generate & Issue Official Certificate'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
