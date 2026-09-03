import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';

const highlights = [
  { label: 'CORE PARTIES', value: '02' },
  { label: 'CLINICAL AREAS', value: '10+' },
  { label: 'TRAINING STAGES', value: '03' },
  { label: 'QUALITY FOCUS', value: '01' },
  { label: 'PATHWAY', value: 'END-TO-END' },
];

const programs = [
  { title: 'Internal Medicine', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=85' },
  { title: 'Surgery & Emergency Medicine', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=85' },
  { title: 'Pediatrics', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=85' },
  { title: 'Obstetrics & Gynecology', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=85' },
  { title: 'Orthopedics', image: '/orthopedics-bone.svg' },
  { title: 'Anesthesia', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=85' },
  { title: 'Radiology & Diagnostics', image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=85' },
  { title: 'Community Medicine / Public Health', image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=85' },
];

const news = [
  { title: 'Clinical attachment applications are now open for university-nominated students', date: 'Placement update' },
  { title: 'AIMN coordinates international clinical training with approved host institutions', date: 'Network update' },
  { title: 'Supporting safe, ethical, and supervised practical learning', date: 'Quality update' },
];

const networkRoles = [
  'Sending universities',
  'Approved host institutions',
  'Qualified clinical supervisors',
  'Hospitals and health facilities',
  'Academic coordinators',
  'Professional networks',
  'Uganda and East Africa',
  'Asia and other agreed destinations',
  'Research collaborators',
  'Quality and compliance stakeholders',
];

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#f5f3ee] text-slate-800">
      <section className="relative isolate overflow-hidden bg-[#0d1b2a] text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=85"
            alt="AZAAM International Medics Network clinical training campus"
            className="h-full w-full object-cover opacity-35"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1626]/95 via-[#0f172a]/78 to-[#0b1020]/45" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#e2c579]">
            <ShieldCheck className="h-4 w-4" />
            Clinical excellence without borders
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                AZAAM International <br />
                Medics Network (AIMN)
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                AIMN is an international medical education and clinical attachment network committed to quality training, trusted partnerships, and stronger healthcare practice.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-[#d5b56d] px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-[#e5c87e]">
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/verify-certificate" className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  Verify Certificate
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e2c579]/30 bg-white/[0.08] p-4 backdrop-blur-sm shadow-2xl shadow-slate-950/40 lg:translate-y-4">
              <div className="rounded-[22px] bg-[#f5f3ee] p-5 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9b7a2f]">AIMN Network</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">Your placement, coordinated</h2>
                  </div>
                  <div className="rounded-xl bg-[#0d1b2a] p-2 text-[#d5b56d]">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    { icon: GraduationCap, title: 'University nomination', text: 'Eligible students are selected and submitted by their institution.' },
                    { icon: BookOpen, title: 'AIMN coordination', text: 'We arrange placement, orientation, rotation, and communication.' },
                    { icon: Building2, title: 'Host supervision', text: 'Approved facilities provide day-to-day clinical learning.' },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="rounded-xl bg-[#f3e8c5] p-2 text-[#0d1b2a]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-5">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-black text-[#0d1b2a]">{item.value}</div>
              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#a47d27]">About AIMN</p>
          <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">International medical training with purpose.</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 text-base leading-8 text-slate-700">
            <p>
              AZAAM International Medics Network (AIMN) delivers quality clinical attachment and medical training experiences that blend academic strength with supervised practical learning.
            </p>
            <p>
              Our network connects students, universities, hospitals, and clinical supervisors to produce experienced, engaged, and confident healthcare professionals.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#0d1b2a] p-5 text-white">
                <div className="mb-2 inline-flex rounded-lg bg-[#d5b56d] p-2 text-[#0d1b2a]">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold">Student-focused</h3>
                <p className="mt-2 text-sm text-slate-300">Students gain structured exposure under qualified healthcare professionals.</p>
              </div>
              <div className="rounded-2xl bg-[#f2e7c7] p-5 text-slate-900">
                <div className="mb-2 inline-flex rounded-lg bg-[#0d1b2a] p-2 text-[#d5b56d]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold">Career-oriented</h3>
                <p className="mt-2 text-sm text-slate-700">Training follows the sending institution and host facility requirements.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <img
              src="https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=800&q=80"
              alt="AIMN clinical training facility"
              className="h-60 w-full rounded-[24px] object-cover shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=80"
              alt="AIMN medical students in class"
              className="h-60 w-full rounded-[24px] object-cover shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80"
              alt="AIMN healthcare training grounds"
              className="h-60 w-full rounded-[24px] object-cover shadow-lg sm:col-span-2"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#0d1b2a] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#d5b56d]">Clinical Rotations</p>
            <h2 className="mt-4 text-3xl font-black">Practical Experience Across Essential Departments</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Hands-on clinical rotations designed to build core medical competencies.
            </p>
          </div>

          <div id="programs" className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {programs.map((program) => (
              <div key={program.title} className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-lg">
                <img src={program.image} alt={`${program.title} clinical training: orthopedic bone, joint, and X-ray imaging`} className={`h-52 w-full object-center ${program.title === 'Orthopedics' ? 'bg-slate-100 object-contain' : 'object-cover'}`} />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold leading-7 text-white">{program.title}</h3>
                  <Link to="/register" className="mt-auto inline-flex w-fit items-center gap-2 rounded-lg bg-[#d5b56d] px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-[#e7cb82]">
                    Explore more
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div id="events" className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#a47d27]">Latest Events</p>
            <h2 className="mt-4 text-3xl font-black text-slate-900">Updates from the AIMN network</h2>
          </div>
          <Link to="/login" className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 md:inline-flex">
            View more events
          </Link>
        </div>

        <div id="news" className="grid gap-6 lg:grid-cols-3">
          {news.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex h-48 items-center justify-center bg-[#e7e4de] p-4">
                <CalendarDays className="h-16 w-16 text-[#b7862d]" />
              </div>
              <div className="p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a47d27]">{item.date}</div>
                <h3 className="text-lg font-bold leading-7 text-slate-900">{item.title}</h3>
                <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0d1b2a] hover:text-[#1d3557]">
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f3ead1] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#8c6727]">AIMN network ecosystem</p>
            <h2 className="mt-4 text-3xl font-black text-slate-900">The partners who make safe placement possible</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {networkRoles.map((name) => (
              <div key={name} className="rounded-2xl border border-[#d9c899] bg-white/60 p-4 text-center text-sm font-semibold text-slate-700 shadow-sm">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[28px] bg-[#0d1b2a] p-8 text-white shadow-xl lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#d5b56d]">Explore more</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">A trusted bridge between universities and clinical practice.</h2>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-[#d5b56d] px-6 py-3.5 text-sm font-bold text-slate-900 hover:bg-[#e7cb82]">
                Join now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

