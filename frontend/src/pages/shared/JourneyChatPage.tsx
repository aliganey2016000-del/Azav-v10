import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCheck,
  GraduationCap,
  Loader2,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { JourneyChatData, JourneyChatMessage } from '../../types/admin.types';
import { useAuth } from '../../context/AuthContext';

type PortalMode = 'admin' | 'university';

interface JourneyChatPageProps {
  portal: PortalMode;
}

const stageShortLabel = (stageKey: string) => {
  if (stageKey === 'PERMIT') return 'Permit / Host Letter';
  if (stageKey === 'VISA') return 'Entry Visa';
  if (stageKey === 'RESIDENCE') return 'Residence Visa';
  return stageKey;
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDay = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export const JourneyChatPage: React.FC<JourneyChatPageProps> = ({ portal }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [chat, setChat] = useState<JourneyChatData | null>(null);
  const [studentName, setStudentName] = useState('Student');
  const [universityName, setUniversityName] = useState('University');
  const [selectedStage, setSelectedStage] = useState<'PERMIT' | 'VISA' | 'RESIDENCE'>('PERMIT');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const viewerRole = chat?.viewerRole || (portal === 'admin' ? 'AZAAM' : 'UNIVERSITY');
  const backPath = portal === 'admin' ? '/admin/students/' + id : '/university/students/' + id;

  const loadChat = async (markRead = false) => {
    if (!id) return;

    try {
      setError(null);
      const data = markRead
        ? await AdminApiService.markJourneyChatRead(id)
        : await AdminApiService.getJourneyChat(id);

      setChat(data);

      const requestedStage = searchParams.get('stage') as 'PERMIT' | 'VISA' | 'RESIDENCE' | null;
      const currentStage =
        data.availableStages.find((s) => requestedStage === s.stageKey && s.enabled) ||
        data.availableStages.find((s) => s.stageKey === selectedStage && s.enabled) ||
        data.availableStages.find((s) => s.enabled);

      if (currentStage) setSelectedStage(currentStage.stageKey);

      if (!markRead && data.unreadCount > 0) {
        const readData = await AdminApiService.markJourneyChatRead(id);
        setChat(readData);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || e.message || 'Unable to load chat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    AdminApiService.getStudentById(id)
      .then((res) => {
        const student = res.student;
        setStudentName([student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student');
        setUniversityName(student.university?.name || 'University');
      })
      .catch(() => {});

    loadChat(true);

    const timer = window.setInterval(() => {
      loadChat(false);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat?.messages.length]);

  const filteredMessages = useMemo(() => {
    const messages = chat?.messages || [];
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (message) =>
        message.message.toLowerCase().includes(q) ||
        message.authorName?.toLowerCase().includes(q) ||
        message.stageTitle.toLowerCase().includes(q)
    );
  }, [chat?.messages, search]);

  const groupedMessages = useMemo(() => {
    const groups: { day: string; items: JourneyChatMessage[] }[] = [];
    filteredMessages.forEach((message) => {
      const day = formatDay(message.createdAt);
      const existing = groups.find((g) => g.day === day);
      if (existing) existing.items.push(message);
      else groups.push({ day, items: [message] });
    });
    return groups;
  }, [filteredMessages]);

  const sendMessage = async () => {
    if (!id || !draft.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      await AdminApiService.addJourneyComment(id, selectedStage, draft.trim());
      setDraft('');
      const refreshed = await AdminApiService.markJourneyChatRead(id);
      setChat(refreshed);
      window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || e.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const currentStage = chat?.availableStages.find((stage) => stage.stageKey === selectedStage);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading conversation...
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 -my-4 sm:-mx-4 sm:-my-5 lg:-mx-6 lg:-my-6 xl:-mx-7">
      <section className="flex h-[calc(100dvh-72px)] min-h-[620px] flex-col overflow-hidden bg-[#efeae2] dark:bg-[#0b141a]">
        <header className="z-10 shrink-0 border-b border-emerald-950/10 bg-[#075e54] text-white shadow-sm dark:bg-[#202c33]">
          <div className="flex h-[70px] items-center gap-2 px-3 sm:px-4">
            <Link
              to={backPath}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
              aria-label="Back to student journey"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-extrabold">{studentName}</h1>
              <p className="truncate text-[11px] text-emerald-50/80 dark:text-slate-300">
                {portal === 'admin' ? universityName : 'AZAAM MEDICS'} · Clinical Coordination
              </p>
            </div>

            <div className="hidden min-w-[190px] sm:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages"
                  className="h-9 w-full rounded-full border border-white/10 bg-white/10 pl-9 pr-3 text-[11px] text-white outline-none placeholder:text-white/55 focus:bg-white/15"
                />
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
              aria-label="Conversation options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 px-3 py-2 [scrollbar-width:none] sm:px-4">
            <span className="shrink-0 text-[10px] font-bold text-white/70">Conversation:</span>
            {(chat?.availableStages || []).map((stage) => (
              <button
                key={stage.stageKey}
                type="button"
                disabled={!stage.enabled}
                onClick={() => {
                  setSelectedStage(stage.stageKey);
                  setSearchParams({ stage: stage.stageKey });
                }}
                className={
                  'shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold transition ' +
                  (selectedStage === stage.stageKey
                    ? 'bg-white text-[#075e54]'
                    : stage.enabled
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'cursor-not-allowed bg-black/10 text-white/35')
                }
              >
                {stageShortLabel(stage.stageKey)}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="mx-3 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <div
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-[7%] md:px-[12%]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(120,120,120,0.055) 1px, transparent 1px), radial-gradient(circle at 80% 55%, rgba(120,120,120,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px, 30px 30px',
          }}
        >
          {groupedMessages.length === 0 ? (
            <div className="mx-auto mt-12 max-w-sm rounded-2xl bg-[#fff5c4] px-4 py-3 text-center text-xs leading-5 text-slate-700 shadow-sm dark:bg-[#182229] dark:text-slate-300">
              <MessageCircle className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
              No messages yet. Start the conversation about Permit, Entry Visa or Residence Visa.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMessages.map((group) => (
                <div key={group.day}>
                  <div className="sticky top-0 z-[1] mb-3 flex justify-center">
                    <span className="rounded-lg bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-500 shadow-sm backdrop-blur dark:bg-[#182229]/95 dark:text-slate-300">
                      {group.day}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map((message) => {
                      const mine = message.author === viewerRole;
                      return (
                        <div key={message.id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={
                              'relative max-w-[88%] rounded-lg px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:max-w-[72%] ' +
                              (mine
                                ? 'rounded-tr-sm bg-[#d9fdd3] text-slate-900 dark:bg-[#005c4b] dark:text-white'
                                : 'rounded-tl-sm bg-white text-slate-900 dark:bg-[#202c33] dark:text-white')
                            }
                          >
                            {!mine && (
                              <p className="mb-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                                {message.authorName || (message.author === 'AZAAM' ? 'AZAAM MEDICS' : universityName)}
                              </p>
                            )}

                            <span className="mb-1 inline-flex rounded-md bg-black/5 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                              {stageShortLabel(message.stageKey)}
                            </span>

                            <p className="whitespace-pre-wrap break-words text-[13px] leading-[19px]">
                              {message.message}
                            </p>

                            <div className="mt-1 flex items-center justify-end gap-1 pl-8">
                              <span className="text-[9px] text-slate-500 dark:text-slate-300/80">
                                {formatTime(message.createdAt)}
                              </span>
                              {mine && (
                                <CheckCheck
                                  className={
                                    'h-3.5 w-3.5 ' +
                                    ((message.readBy || []).includes(viewerRole === 'AZAAM' ? 'UNIVERSITY' : 'AZAAM')
                                      ? 'text-sky-500'
                                      : 'text-slate-400 dark:text-slate-300/70')
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-black/5 bg-[#f0f2f5] px-2 py-2 dark:border-white/5 dark:bg-[#202c33] sm:px-4">
          <div className="mx-auto flex max-w-5xl items-end gap-2">
            <div className="min-w-0 flex-1 rounded-3xl bg-white px-4 py-2 shadow-sm dark:bg-[#2a3942]">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {currentStage ? stageShortLabel(currentStage.stageKey) : 'Select stage'}
                </span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={!currentStage?.enabled}
                rows={1}
                placeholder={currentStage?.enabled ? 'Type a message' : 'Select an active stage to chat'}
                className="max-h-28 min-h-[24px] w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !draft.trim() || !currentStage?.enabled}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-sm transition hover:bg-[#029978] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>

          <p className="mt-1 text-center text-[9px] text-slate-400 dark:text-slate-500">
            Messages are shared only between AZAAM MEDICS and the student's university.
          </p>
        </footer>
      </section>
    </div>
  );
};
