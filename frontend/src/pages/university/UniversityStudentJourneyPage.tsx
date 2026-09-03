import React from 'react';
import { useParams } from 'react-router-dom';
import { User, GraduationCap, FileText, DollarSign, Plane, Building2, UserCheck, CalendarRange, BookOpen, Award, ShieldCheck, ClipboardCheck } from 'lucide-react';

export const UniversityStudentJourneyPage: React.FC = () => {
  const { id } = useParams();

  const sections = [
    { title: 'Student Information', icon: <User className="h-4 w-4" />, items: ['Student ID', 'Full Name', 'Contact', 'Nationality', 'Passport'] },
    { title: 'Academic Information', icon: <GraduationCap className="h-4 w-4" />, items: ['University', 'Faculty', 'Program', 'Year', 'Graduation Date'] },
    { title: 'Nomination Information', icon: <FileText className="h-4 w-4" />, items: ['Nomination Status', 'Requested specialty', 'Start / End date', 'Purpose'] },
    { title: 'Documents', icon: <FileText className="h-4 w-4" />, items: ['Passport', 'Student ID', 'Academic transcripts', 'Insurance', 'Support files'] },
    { title: 'Finance', icon: <DollarSign className="h-4 w-4" />, items: ['Invoice', 'Amount', 'Payment status', 'Balance', 'Receipt'] },
    { title: 'Visa', icon: <Plane className="h-4 w-4" />, items: ['Required?', 'Status', 'Submission', 'Approval', 'Expiry', 'Notes'] },
    { title: 'Accommodation', icon: <Building2 className="h-4 w-4" />, items: ['Required?', 'Status', 'Residence', 'City', 'Check-in / Check-out'] },
    { title: 'Hospital Placement', icon: <Building2 className="h-4 w-4" />, items: ['Hospital', 'Department', 'Placement start', 'Placement end', 'Supervisor'] },
    { title: 'Department', icon: <ClipboardCheck className="h-4 w-4" />, items: ['Department assignment', 'Rotation schedule', 'Clinical unit'] },
    { title: 'Clinical Supervisor', icon: <UserCheck className="h-4 w-4" />, items: ['Name', 'Title', 'Hospital', 'Assignment date', 'Status'] },
    { title: 'Attendance', icon: <CalendarRange className="h-4 w-4" />, items: ['Date', 'In / Out', 'Hours', 'Late', 'Absence', 'Attendance %'] },
    { title: 'Logsheet / Logbook', icon: <BookOpen className="h-4 w-4" />, items: ['Entries', 'Pending', 'Approved', 'Revision requests', 'Completion %'] },
    { title: 'Evaluation', icon: <Award className="h-4 w-4" />, items: ['Mid-term', 'Final', 'Score', 'Result', 'Comments'] },
    { title: 'Grade', icon: <ShieldCheck className="h-4 w-4" />, items: ['Final score', 'Grade', 'Pass / Fail', 'Status', 'Completion'] },
    { title: 'Completion', icon: <ClipboardCheck className="h-4 w-4" />, items: ['Training completed', 'Verification status', 'AZAAM review'] },
    { title: 'Certificate', icon: <Award className="h-4 w-4" />, items: ['Certificate number', 'Verification code', 'Issue date', 'Status', 'Download'] },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-sky-300">Student Journey</p>
            <h1 className="mt-2 text-2xl font-bold">Student Record #{id || 'N/A'}</h1>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            Under AZAAM Coordination
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">{section.icon}</div>
              <h2 className="text-base font-bold">{section.title}</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
