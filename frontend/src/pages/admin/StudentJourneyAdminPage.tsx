import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, FileText, Plane, Home, Car, Building2, Stethoscope, Award, ShieldCheck, AlertTriangle, DollarSign } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudentJourney } from '../../types/admin.types';
import { LoadingState, ErrorState } from '../../components/admin/States';
import { StatusBadge } from '../../components/admin/Badge';

type JourneyState = 'COMPLETED' | 'CURRENT' | 'PENDING';

type Stage = {
  title: string;
  description: string;
  state: JourneyState;
  fee?: number;
  feeLabel?: string;
  document?: string;
};

export const StudentJourneyAdminPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminStudentJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    AdminApiService.getStudentById(id)
      .then(setData)
      .catch((e: any) => setError(e.message || 'Failed to load student journey.'))
      .finally(() => setLoading(false));
  }, [id]);

  const stages = useMemo<Stage[]>(() => {
    if (!data) return [];
    const s: any = data.student;
    const docs: any[] = (data as any).documents || [];
    const financials: any = (data as any).financials || {};
    const timeline: any[] = (data as any).timeline || [];
    const done = (terms: string[]) => timeline.some((x: any) => {
      const text = `${x.stage || ''} ${x.title || ''}`.toLowerCase();
      return x.status === 'COMPLETED' && terms.some(t => text.includes(t));
    });
    const docsSubmitted = docs.length > 0;
    const approved = ['APPROVED','ACTIVE','PLACED','IN_ROTATION','COMPLETED'].includes(String(s.applicationStatus || s.status || '').toUpperCase());
    const acceptance = done(['acceptance','permit','host']);
    const entryVisa = ['GRANTED','APPROVED'].includes(String(s.visaStatus || '').toUpperCase()) || done(['entry visa','visa']);
    const residence = ['APPROVED','ACTIVE','GRANTED'].includes(String(s.residenceStatus || '').toUpperCase()) || done(['residence']);
    const transport = done(['transport','arrival','travel']);
    const placement = Boolean(s.hospitalPlacement?.name) && !/pending|not assigned|n\/a/i.test(s.hospitalPlacement.name);
    const training = Number(s.attendancePercent || 0) > 0 || Number(s.logbookSigned || 0) > 0;
    const completed = Boolean(s.certificateIssued) || String(s.status || '').toUpperCase() === 'COMPLETED';
    const flags = [true, docsSubmitted, approved, acceptance, entryVisa, residence, transport, placement, training, completed];
    const firstPending = flags.findIndex(v => !v);
    const stateAt = (i: number): JourneyState => flags[i] ? 'COMPLETED' : i === firstPending ? 'CURRENT' : 'PENDING';
    const total = Number(financials.studentFeeDue || s.totalFees || 0);

    return [
      { title: 'Nomination', description: 'Student nominated by the university and submitted to AZAAM.', state: stateAt(0) },
      { title: 'Documents Submitted', description: docsSubmitted ? `${docs.length} supporting document(s) received.` : 'Waiting for required supporting documents.', state: stateAt(1) },
      { title: 'AZAAM Review & Approval', description: approved ? 'AZAAM review completed and process approved.' : 'AZAAM verifies documents and may Approve, Reject or Request Correction.', state: stateAt(2) },
      { title: 'Permit / Host Acceptance Letter', description: acceptance ? 'Host acceptance / permit has been issued.' : 'Issued after AZAAM approval by the host institution.', state: stateAt(3), document: acceptance ? 'Acceptance / Permit available' : undefined },
      { title: 'Entry Visa', description: entryVisa ? 'Entry visa stage completed.' : 'Entry visa processing follows host acceptance.', state: stateAt(4), feeLabel: 'Visa Fee', fee: entryVisa ? total : undefined },
      { title: 'Residence Visa', description: residence ? 'Residence visa stage completed.' : 'Residence permit/visa and applicable fee will appear here.', state: stateAt(5), feeLabel: 'Residence Visa Fee' },
      { title: 'Travel & Transportation', description: transport ? 'Arrival and transportation confirmed by AZAAM.' : 'AZAAM confirms arrival/transport after the student reaches the destination.', state: stateAt(6), feeLabel: 'Transportation Fee' },
      { title: 'Hospital Placement', description: placement ? `Placed at ${s.hospitalPlacement.name}.` : 'AZAAM assigns the approved teaching hospital and department.', state: stateAt(7), feeLabel: 'Placement Fee' },
      { title: 'Clinical Training', description: training ? `Attendance ${s.attendancePercent || 0}% • Logbook ${s.logbookSigned || 0}/${s.logbookRequired || 0}.` : 'Attendance, logbook and supervisor evaluation begin after placement.', state: stateAt(8) },
      { title: 'Completion & Certificate', description: completed ? `Completed${s.certificateCode ? ` • Certificate ${s.certificateCode}` : ''}.` : 'Final evaluation and certificate are completed at the end of training.', state: stateAt(9) },
    ];
  }, [data]);

  if (loading) return <LoadingState message="Loading student journey..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const s: any = data.student;
  const completedCount = stages.filter(x => x.state === 'COMPLETED').length;
  const current = stages.find(x => x.state === 'CURRENT');
  const icons = [FileText, FileText, ShieldCheck, FileText, Plane, Home, Car, Building2, Stethoscope, Award];

  return (
    <div className="space-y-5 pb-10">
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900">
        <ArrowLeft className="w-4 h-4" /> Back to Students Registry
      </Link>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-xl">
        <div className="p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-lg font-black shadow-lg">
                {s.firstName?.[0]}{s.lastName?.[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black">{s.firstName} {s.lastName}</h1>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-xs text-slate-300">{s.studentNumber} • {s.university?.name} • {s.specialty}</p>
                <p className="mt-2 text-sm font-semibold text-cyan-200">Current stage: {current?.title || 'Journey completed'}</p>
              </div>
            </div>
            <div className="min-w-56 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex justify-between text-xs font-bold"><span>Journey Progress</span><span>{completedCount}/10</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${completedCount * 10}%` }} /></div>
              <p className="mt-2 text-[11px] text-slate-300">University view follows every AZAAM-controlled milestone.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">COMPLETED</p><p className="mt-1 text-2xl font-black text-emerald-900">{completedCount}</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700">CURRENT STAGE</p><p className="mt-1 text-sm font-black text-amber-900">{current?.title || 'Completed'}</p></div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold text-blue-700">UNIVERSITY</p><p className="mt-1 text-sm font-black text-blue-950">{s.university?.name || 'University'}</p></div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-black text-slate-950">Full Student Journey</h2><p className="text-xs text-slate-500">Completed stages show a green tick. The next stage is highlighted; future stages remain numbered.</p></div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">Live AZAAM Tracking</span>
        </div>

        <div className="relative space-y-3 md:pl-2">
          {stages.map((stage, index) => {
            const Icon = icons[index];
            const complete = stage.state === 'COMPLETED';
            const active = stage.state === 'CURRENT';
            return (
              <div key={stage.title} className={`relative rounded-2xl border p-4 transition ${complete ? 'border-emerald-200 bg-emerald-50/60' : active ? 'border-amber-300 bg-amber-50 shadow-sm' : 'border-slate-200 bg-slate-50/70'}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${complete ? 'bg-emerald-600 text-white' : active ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {complete ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${complete ? 'text-emerald-700' : active ? 'text-amber-700' : 'text-slate-500'}`} /><h3 className="text-sm font-black text-slate-900">{stage.title}</h3></div>
                      <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${complete ? 'bg-emerald-100 text-emerald-800' : active ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>{complete ? 'COMPLETED' : active ? 'PENDING AZAAM ACTION' : 'UPCOMING'}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{stage.description}</p>
                    {(stage.document || stage.feeLabel) && <div className="mt-3 flex flex-wrap gap-2">
                      {stage.document && <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800"><FileText className="h-3.5 w-3.5" />{stage.document}</span>}
                      {stage.feeLabel && <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-800"><DollarSign className="h-3.5 w-3.5" />{stage.feeLabel}: {stage.fee !== undefined ? `$${stage.fee}` : 'Pending'}</span>}
                    </div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Workflow control:</strong> University submits nomination and documents. AZAAM controls review/approval, immigration milestones, transportation, hospital placement, applicable fees and final completion. The university follows progress from this journey.</p>
        </div>
      </section>
    </div>
  );
};
