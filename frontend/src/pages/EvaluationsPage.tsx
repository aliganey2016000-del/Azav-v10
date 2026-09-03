import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealEvaluation } from '../services/realDataStore';
import {
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  Search,
  Star,
  GraduationCap,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const EvaluationsPage: React.FC = () => {
  const { user } = useAuth();
  const isUniversity =
    user?.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
    user?.roles.includes(UserRole.UNIVERSITY_STAFF);

  const [evaluations, setEvaluations] = useState<RealEvaluation[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Form State
  const [type, setType] = useState<'MID_TERM' | 'FINAL'>('FINAL');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [hospitalName, setHospitalName] = useState('Madina Teaching Hospital');
  const [supervisor, setSupervisor] = useState('Dr. Sarah Jenkins');
  const [clinicalCompetency, setClinicalCompetency] = useState(95);
  const [professionalism, setProfessionalism] = useState(96);
  const [patientCommunication, setPatientCommunication] = useState(92);
  const [medicalKnowledge, setMedicalKnowledge] = useState(94);
  const [comments, setComments] = useState(
    'Demonstrated superior surgical skills, rapid clinical decision-making, and ethical bedside manners.'
  );

  useEffect(() => {
    setEvaluations(RealDataStore.getEvaluations());
  }, []);

  const handleAddEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const overallScore = Math.round(
      (clinicalCompetency + professionalism + patientCommunication + medicalKnowledge) / 4
    );
    let letterGrade = 'A';
    if (overallScore >= 90) letterGrade = 'A (Distinction)';
    else if (overallScore >= 80) letterGrade = 'B+ (Very Good)';
    else if (overallScore >= 70) letterGrade = 'B (Good)';
    else letterGrade = 'C (Pass)';

    const newEval: RealEvaluation = {
      id: `EVAL-REAL-${Date.now().toString().slice(-4)}`,
      type,
      studentName,
      studentId,
      hospitalName,
      supervisor,
      clinicalCompetency,
      professionalism,
      patientCommunication,
      medicalKnowledge,
      overallScore,
      letterGrade,
      submittedAt: new Date().toISOString().split('T')[0],
      comments,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addEvaluation(newEval);
    setEvaluations(updated);
    setModalOpen(false);
    setStudentName('');
    setStudentId('');
  };

  const handleDeleteEvaluation = (id: string) => {
    if (window.confirm('Are you sure you want to remove this evaluation?')) {
      const updated = RealDataStore.deleteEvaluation(id);
      setEvaluations(updated);
    }
  };

  const filteredEvals = evaluations.filter((ev) => {
    const matchesSearch =
      ev.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || ev.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              {isUniversity ? 'University Academic Grading' : 'Clinical Evaluations'}
            </span>
            {isUniversity && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {user?.organizationName || 'Faculty of Medicine'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isUniversity ? 'Our Students Clinical Preceptor Evaluations' : 'Preceptor Grading & Evaluations'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Mid-term and final performance evaluations, clinical competency assessments, and preceptor grading rubric.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Submit Real Evaluation</span>
        </button>
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Evaluations Submitted Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No evaluation records found. Click below to submit clinical preceptor grades and competency reviews for your medical students.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit First Evaluation</span>
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
                placeholder="Search student, supervisor, hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="ALL">All Evaluation Types</option>
                <option value="MID_TERM">Mid-Term Evaluation</option>
                <option value="FINAL">Final Evaluation</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvals.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition space-y-4 relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {ev.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{ev.studentName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{ev.studentId}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-extrabold px-2.5 py-1 rounded-xl">
                      {ev.overallScore}%
                    </div>
                    <button
                      onClick={() => handleDeleteEvaluation(ev.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span>Clinical Competency:</span>
                    <strong className="text-slate-900">{ev.clinicalCompetency}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Professionalism:</span>
                    <strong className="text-slate-900">{ev.professionalism}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Communication:</span>
                    <strong className="text-slate-900">{ev.patientCommunication}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical Knowledge:</span>
                    <strong className="text-slate-900">{ev.medicalKnowledge}%</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  "{ev.comments}"
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Evaluator: <strong>{ev.supervisor}</strong></span>
                  <span>{ev.submittedAt}</span>
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
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Submit Real Preceptor Evaluation</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvaluation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Evaluation Period *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="FINAL">FINAL EVALUATION</option>
                    <option value="MID_TERM">MID-TERM EVALUATION</option>
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina Warsame"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Competency (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={clinicalCompetency}
                    onChange={(e) => setClinicalCompetency(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Professionalism (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={professionalism}
                    onChange={(e) => setProfessionalism(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Communication (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={patientCommunication}
                    onChange={(e) => setPatientCommunication(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical Knowledge (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={medicalKnowledge}
                    onChange={(e) => setMedicalKnowledge(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preceptor / Supervising Physician</label>
                <input
                  type="text"
                  required
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preceptor Qualitative Assessment</label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
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
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
