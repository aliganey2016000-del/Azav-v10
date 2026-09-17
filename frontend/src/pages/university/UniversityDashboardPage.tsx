import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Building2, CalendarDays, ChevronRight, DollarSign, FileCheck2,
  GraduationCap, Search, ShieldCheck, UserPlus, Users, Activity, Bell,
  BookOpen, CheckCircle2, Clock3, Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealInvoice, RealMouConfig, RealTrainee } from '../../services/realDataStore';

export const UniversityDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const universityName = user?.universityName || user?.organizationName || 'University';
  const adminName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'University Admin';
  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [invoices, setInvoices] = useState<RealInvoice[]>([]);
  const [mouConfig, setMouConfig] = useState<RealMouConfig>(() => RealDataStore.getMouConfig(universityName));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTrainees(RealDataStore.getTrainees());
    setInvoices(RealDataStore.getInvoices());
    setMouConfig(RealDataStore.getMouConfig(universityName));
  }, [universityName]);

  const totalStudents = trainees.length;
  const quotaTotal = mouConfig.annualQuota || 60;
  const activeRotations = trainees.filter(t => t.hospitalPlacementStatus === 'CONFIRMED' && !t.certificateIssued).length;
  const certificates = trainees.filter(t => t.certificateIssued).length;
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const filtered = trainees.filter(t => {
    const q = searchQuery.toLowerCase();
    return t.studentName.toLowerCase().includes(q) || t.studentId.toLowerCase().includes(q) || t.specialty.toLowerCase().includes(q) || t.targetHospital.toLowerCase().includes(q);
  });

  const quickActions = [
    { to: '/university/nominate-student', label: 'Nominate Student', sub: 'New trainee', icon: UserPlus, box: 'bg-blue-50 text-blue-700 border-blue-100' },
    { to: '/university/students', label: 'Manage Students', sub: 'Student tracking', icon: Users, box: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { to: '/university/student-status', label: 'Clinical Rotations', sub: 'Status & placement', icon: Building2, box: 'bg-orange-50 text-orange-700 border-orange-100' },
    { to: '/university/mou', label: 'Bilateral MoU', sub: 'Quota & agreement', icon: FileCheck2, box: 'bg-violet-50 text-violet-700 border-violet-100' },
    { to: '/university/financials', label: 'Financials', sub: 'Invoices & receipts', icon: DollarSign, box: 'bg-pink-50 text-pink-700 border-pink-100' },
    { to: '/university/certificates', label: 'Certificates', sub: `${certificates} issued`, icon: Award, box: 'bg-sky-50 text-sky-700 border-sky-100' },
  ];

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-sky-600 to-teal-400 text-white shadow-xl">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute right-28 bottom-[-80px] h-56 w-56 rounded-full bg-indigo-500/20" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.5fr_.7fr] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">University Portal</span>
              <span className="flex items-center gap-1 rounded-full border border-emerald-200/30 bg-emerald-300/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider"><ShieldCheck className="h-3.5 w-3.5" /> Secure Institutional Access</span>
            </div>
            <p className="text-sm font-medium text-sky-100">Welcome back,</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{adminName}</h1>
            <div className="mt-2 flex items-center gap-2 text-lg font-bold sm:text-xl"><GraduationCap className="h-6 w-6" /> {universityName} — University Portal</div>
            <p className="mt-4 max-w-2xl text-xs leading-6 text-blue-50 sm:text-sm">Manage nominated students, clinical rotations, institutional agreements, financials and certificates from one responsive workspace.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-3"><GraduationCap className="h-7 w-7" /></div><div><div className="text-xs text-sky-100">Institution</div><div className="text-xl font-extrabold">{universityName}</div></div></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-black/10 p-3"><div className="text-sky-100">Student quota</div><div className="mt-1 text-lg font-black">{totalStudents} / {quotaTotal}</div></div><div className="rounded-xl bg-black/10 p-3"><div className="text-sky-100">MoU Status</div><div className="mt-1 font-bold">{mouConfig.isSigned ? 'Active' : 'Pending'}</div></div></div>
          </div>
        </div>
      </section>

      {!mouConfig.isSigned && <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl bg-amber-500 p-2.5 text-white"><FileCheck2 className="h-5 w-5" /></div><div><h2 className="text-sm font-extrabold text-amber-950">Institutional Bilateral MoU Signature Required</h2><p className="mt-1 text-xs text-amber-800">Activate your university's clinical placement quota and partner-hospital access.</p></div></div><Link to="/university/mou" className="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">Sign MoU Agreement <ChevronRight className="h-4 w-4" /></Link></section>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Students', totalStudents, Users, 'from-blue-50 to-sky-50', 'text-blue-700'],
          ['Active Rotations', activeRotations, Building2, 'from-emerald-50 to-teal-50', 'text-emerald-700'],
          ['Certificates Issued', certificates, Award, 'from-violet-50 to-purple-50', 'text-violet-700'],
          ['Financials Paid', `$${totalPaid.toLocaleString()}`, DollarSign, 'from-orange-50 to-amber-50', 'text-orange-700'],
        ].map(([label, value, Icon, gradient, tone]: any) => <div key={label} className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${gradient} p-5 shadow-sm`}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div><div className={`rounded-2xl bg-white p-3 shadow-sm ${tone}`}><Icon className="h-6 w-6" /></div></div></div>)}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Quick Actions</h2><p className="text-xs text-slate-500">Common university tasks and activities</p></div></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{quickActions.map(({to,label,sub,icon:Icon,box}) => <Link key={label} to={to} className={`rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md ${box}`}><div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80"><Icon className="h-5 w-5" /></div><div className="text-xs font-extrabold">{label}</div><div className="mt-1 text-[10px] opacity-70">{sub}</div></Link>)}</div></section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold text-slate-900">Enrolled Medical Trainees</h2><p className="text-xs text-slate-500">Live university student status</p></div><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search students..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"/></div></div>{filtered.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"><GraduationCap className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-2 text-xs text-slate-500">No medical trainees nominated yet.</p><Link to="/university/nominate-student" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><UserPlus className="h-4 w-4"/> Nominate First Student</Link></div> : <div className="mt-4 space-y-2">{filtered.slice(0,5).map(t=><div key={t.studentId} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-bold text-slate-900">{t.studentName}</div><div className="text-[10px] text-slate-500">{t.studentId} • {t.specialty}</div></div><div className="text-[10px] font-semibold text-blue-700">{t.targetHospital}</div></div>)}</div>}</div>

        <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-violet-600"/><h2 className="font-extrabold text-slate-900">Announcements</h2></div><div className="mt-4 space-y-3 text-xs"><div className="rounded-xl bg-violet-50 p-3"><b>Clinical Rotation Placement</b><p className="mt-1 text-slate-500">New rotation slots and updates appear here.</p></div><div className="rounded-xl bg-blue-50 p-3"><b>University Portal</b><p className="mt-1 text-slate-500">Institution: {universityName}</p></div></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-600"/><h2 className="font-extrabold text-slate-900">Academic Calendar</h2></div><div className="mt-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4"><div className="text-xs font-bold text-slate-900">September 2026</div><div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">{['M','T','W','T','F','S','S'].map((d,i)=><span key={`${d}-${i}`} className="font-bold">{d}</span>)}{Array.from({length:28},(_,i)=><span key={i} className={`rounded-md py-1 ${i===14?'bg-blue-600 text-white font-bold':''}`}>{i+1}</span>)}</div></div></div></div>
      </section>

      <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5"/><b className="text-sm">Institution Connected</b></div><p className="mt-2 text-xs text-slate-500">This account is assigned to {universityName}.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-blue-700"><Activity className="h-5 w-5"/><b className="text-sm">Portal Activity</b></div><p className="mt-2 text-xs text-slate-500">University operations are available from the sidebar.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-violet-700"><Bell className="h-5 w-5"/><b className="text-sm">Notifications</b></div><p className="mt-2 text-xs text-slate-500">Important placement and document updates will appear here.</p></div></section>
    </div>
  );
};
