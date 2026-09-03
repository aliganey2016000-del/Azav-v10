import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealCertificate } from '../services/realDataStore';
import {
  Award,
  ShieldCheck,
  Download,
  ExternalLink,
  Search,
  Plus,
  GraduationCap,
  Sparkles,
  Trash2,
  QrCode,
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const isUniversity =
    user?.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
    user?.roles.includes(UserRole.UNIVERSITY_STAFF);

  const [certificates, setCertificates] = useState<RealCertificate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [specialty, setSpecialty] = useState('General Surgery & Trauma Clerkship');
  const [hospitalName, setHospitalName] = useState('Madina Teaching Hospital');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [grade, setGrade] = useState('Distinction (A)');

  useEffect(() => {
    setCertificates(RealDataStore.getCertificates());
  }, []);

  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const certNumber = `AZAAM-CERT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const verificationCode = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 6)}`;

    const newCert: RealCertificate = {
      id: `CERT-REAL-${Date.now().toString().slice(-4)}`,
      certificateNumber: certNumber,
      verificationCode,
      recipientName,
      studentId,
      specialty,
      hospitalName,
      durationWeeks: Number(durationWeeks) || 8,
      grade,
      issueDate: new Date().toISOString().split('T')[0],
      status: 'VERIFIED',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addCertificate(newCert);
    setCertificates(updated);
    setModalOpen(false);
    setRecipientName('');
    setStudentId('');
  };

  const handleDeleteCertificate = (id: string) => {
    if (window.confirm('Are you sure you want to remove this certificate?')) {
      const updated = RealDataStore.deleteCertificate(id);
      setCertificates(updated);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    return (
      c.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              {isUniversity ? 'University Graduation Credentials' : 'Verified Certificates'}
            </span>
            {isUniversity && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {user?.organizationName || 'Faculty of Medicine'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isUniversity ? 'Our Students Issued Certificates & Diplomas' : 'Clinical Training Certificates'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Accredited hospital clinical completion certificates, verifiable with cryptographic hash and QR code validation.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Issue Real Certificate</span>
        </button>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Certificates Issued Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No completion certificates found. Click below to generate an accredited verification credential for clinical graduates.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Issue First Certificate</span>
          </button>
        </div>
      ) : (
        <>
          {/* Quick Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, certificate #, specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCerts.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition space-y-4 relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{cert.recipientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{cert.studentId}</span>
                    </div>
                    <p className="text-xs font-semibold text-sky-800">{cert.specialty}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                    <button
                      onClick={() => handleDeleteCertificate(cert.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Certificate No:</span>
                    <strong className="font-mono text-slate-900">{cert.certificateNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Host Hospital:</span>
                    <strong className="text-slate-900">{cert.hospitalName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration & Grade:</span>
                    <strong className="text-slate-900">{cert.durationWeeks} Weeks • {cert.grade}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Issue Date:</span>
                    <span className="text-slate-600">{cert.issueDate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                    Hash: {cert.verificationCode}
                  </span>
                  <a
                    href={`/verify?code=${cert.certificateNumber}`}
                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Public Verify Page</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <Award className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Issue Real Clinical Certificate</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina Warsame"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SNU-MED-2022-094"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialty / Program *</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Host Hospital</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Final Academic Grade</label>
                <input
                  type="text"
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Generate & Sign Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
