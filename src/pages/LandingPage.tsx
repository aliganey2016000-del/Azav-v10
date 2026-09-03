import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  Globe2,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs px-3.5 py-1.5 rounded-full font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>International Medical Clinical Attachment Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              AZAAM International <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
                Medics Network
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Connecting medical students, accredited university institutions, and premier healthcare organizations for verified clinical attachments, digital logbooks, and competency evaluations.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-sky-500/25 text-sm"
              >
                <span>Apply for Attachment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/verify-certificate"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-6 py-3.5 rounded-xl transition-all text-sm"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Verify Certificate</span>
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-800 text-slate-400 text-xs">
              <div>
                <span className="block text-xl font-bold text-white">100%</span>
                <span>Verified Digital Logbooks</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-white">RBAC</span>
                <span>Multi-Tenant Data Security</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-white">Dual Path</span>
                <span>Uni & Independent Support</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="relative">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Clinical Attachment Workflow</h3>
                    <p className="text-xs text-slate-400">End-to-End Medical Rotation Pipeline</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                  SYSTEM ACTIVE
                </span>
              </div>

              {/* Step Process Visual */}
              <div className="space-y-3 text-xs">
                {[
                  { step: '1. Discover & Apply', desc: 'University or Independent Student Application', icon: GraduationCap },
                  { step: '2. Review & Place', desc: 'Healthcare Organization Capacity & Supervisor Matching', icon: Building2 },
                  { step: '3. Track & Supervise', desc: 'Daily Attendance & Digital Logbook Sign-offs', icon: BookOpen },
                  { step: '4. Evaluate & Certify', desc: 'Mid-term / Final Evaluation & Verification Code', icon: Award },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="p-2 rounded-lg bg-slate-800 text-sky-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{item.step}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">About AZAAM International Medics</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            AZAAM provides a standardized, secure platform to streamline international clinical attachments, elective medical rotations, and supervisor evaluations across borderless healthcare systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">University & Independent Trainees</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supports students sponsored by medical universities as well as independent applicants seeking clinical experience without institutional boundaries.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Capacity-Controlled Placements</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hospitals and medical centers set strict rotation capacity limits to guarantee quality supervisor-to-trainee ratios.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Verified Digital Certificates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every completed clinical rotation yields a uniquely code-verifiable digital certificate preserving privacy and preventing fraud.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How The Platform Works</h2>
            <p className="text-slate-400 text-sm">
              Strict multi-tenant architecture with RBAC ensuring data isolation between universities, healthcare organizations, supervisors, and students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-2">
              <span className="text-sky-400 font-bold text-base">01. Application</span>
              <h4 className="font-semibold text-white text-sm">Submit Credentials</h4>
              <p className="text-slate-400">Student chooses University or Independent pathway and submits specialty preferences.</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-2">
              <span className="text-sky-400 font-bold text-base">02. Placement</span>
              <h4 className="font-semibold text-white text-sm">Capacity Review</h4>
              <p className="text-slate-400">Healthcare organization reviews available slots and assigns an accredited supervisor.</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-2">
              <span className="text-sky-400 font-bold text-base">03. Supervision</span>
              <h4 className="font-semibold text-white text-sm">Logbook & Attendance</h4>
              <p className="text-slate-400">Daily check-ins recorded and clinical procedures signed off by the supervisor.</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-2">
              <span className="text-sky-400 font-bold text-base">04. Certification</span>
              <h4 className="font-semibold text-white text-sm">Evaluation & Issue</h4>
              <p className="text-slate-400">Final evaluation triggers completion and issues public verification certificate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Accreditation Disclaimer Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
              Transparency Notice
            </span>
            <h3 className="font-bold text-slate-900 text-lg">Official Accreditation & Licensing Status</h3>
            <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
              All medical university affiliations, healthcare facility credentials, and local licensing authorities listed in the system are verified individually per application. Formal government recognition claims: <span className="font-semibold text-amber-800">TO BE CONFIRMED</span>.
            </p>
          </div>
          <Link
            to="/verify-certificate"
            className="shrink-0 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all"
          >
            Check Verification Portal
          </Link>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-3xl p-10 sm:p-14 text-white shadow-xl space-y-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Begin Your Clinical Rotation?</h2>
          <p className="text-sky-100 text-sm max-w-xl mx-auto">
            Join medical students and healthcare institutions worldwide on the AZAAM Clinical Attachment platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="bg-white text-sky-700 hover:bg-slate-100 font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md"
            >
              Register as Student
            </Link>
            <Link
              to="/login"
              className="bg-sky-800/80 hover:bg-sky-800 text-white font-medium border border-sky-400/30 px-8 py-3.5 rounded-xl text-sm transition-all"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
