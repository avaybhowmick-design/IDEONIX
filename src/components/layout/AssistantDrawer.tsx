import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { sendAssistantMessageApi } from '../../services/aiClient';
import type { AssistantMessage } from '../../types/ideonix';
import {
  CopyTextButton,
  inputClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../ui/GlassPrimitives';
import { getListItemVariants, MOTION_EASING, useMotionSettings } from '../../config/motion';

export function AssistantDrawer() {
  const {
    activePage,
    brandVoice,
    campaigns,
    library,
    saveLibraryItem,
    notify,
  } = useWorkspace();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      text: `I am aware of your ${brandVoice.preset} brand voice, ${campaigns.length} saved campaign(s), and ${library.length} library items. Ask for hooks, script edits, or weekly angles anytime.`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const { durations } = useMotionSettings();
  const listVariants = getListItemVariants(durations.base);

  const activeCampaign = campaigns.find((c) => c.status === 'Active') || campaigns[0];
  const librarySummary = library
    .slice(0, 6)
    .map((i) => `- [${i.category}] ${i.title} (${i.platform})`)
    .join('\n');

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || sending) return;

    const userMsg: AssistantMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const reply = await sendAssistantMessageApi({
        message: trimmed,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        brandVoice,
        activeCampaignTitle: activeCampaign?.title,
        activeCampaignOverview: activeCampaign?.overview,
        librarySummary,
        currentPage: activePage,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant request failed.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {/* Floating Assistant Trigger — narrow upper-right tab below Voice header */}
        {!open && (
          <motion.button
            key="assistant-trigger"
            type="button"
            initial={{ opacity: 0, x: 10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.96 }}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
            onClick={() => setOpen(true)}
            title="AI Creator Assistant"
            aria-label="Open AI Creator Assistant"
            className="glass fixed top-[68px] right-0 z-40 inline-flex h-9 w-7 items-center justify-center !rounded-l-xl !rounded-r-none !border-r-0 !border-white/30 !bg-white/15 text-white transition-[background-color,border-color,filter] duration-200 hover:!bg-white/25 hover:brightness-110"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.button>
        )}

        {/* Backdrop for click-outside and dimming */}
        {open && (
          <motion.div
            key="assistant-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
          />
        )}

        {/* Opaque, High-Contrast Upper-Right Assistant Pop-up */}
        {open && (
          <motion.aside
            key="assistant-drawer"
            aria-label="AI Creator Assistant"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: durations.base, ease: MOTION_EASING.out }}
            className="fixed top-[68px] right-3 sm:right-4 z-50 flex h-[min(460px,calc(100dvh-5.25rem))] w-[min(calc(100vw-1.5rem),360px)] flex-col"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0d0d12] shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/12 bg-[#121218] px-4 py-3">
                <div>
                  <h2 className="text-xs font-semibold text-white">AI Creator Assistant</h2>
                  <p className="text-[11px] text-neutral-400">
                    Context: {brandVoice.preset} voice · {library.length} library items
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  aria-label="Close AI Creator Assistant"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Quick context starters */}
              <div className="flex flex-wrap gap-1.5 border-b border-white/12 bg-[#101015] px-4 py-2">
                {[
                  'Suggest 3 hooks matching my brand voice',
                  'Give me a post idea from my library',
                ].map((quick) => (
                  <motion.button
                    key={quick}
                    type="button"
                    disabled={sending}
                    whileHover={sending ? undefined : { y: -1 }}
                    whileTap={sending ? undefined : { scale: 0.97 }}
                    transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                    onClick={() => sendPrompt(quick)}
                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    {quick}
                  </motion.button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#0d0d12] px-4 py-3">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={listVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'ml-6 border border-white/30 bg-white/15 text-white'
                          : 'mr-4 border border-white/12 bg-[#16161d] text-neutral-200 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      {msg.role === 'assistant' && msg.id !== 'welcome_msg' && (
                        <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2">
                          <CopyTextButton text={msg.text} />
                          <SaveActionButton
                            variant="compact"
                            label="Save"
                            savedLabel="Saved"
                            onSave={async () => {
                              await saveLibraryItem({
                                category: 'assistant',
                                title: `Assistant Note (${new Date().toLocaleDateString()})`,
                                summary: msg.text.slice(0, 140),
                                platform: 'Multi-platform',
                                tags: ['assistant', brandVoice.preset.toLowerCase()],
                                payload: { reply: msg.text },
                              });
                              notify('Saved assistant response to My Library.');
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {sending && (
                  <div className="mr-4 rounded-xl border border-white/12 bg-[#16161d] px-4 py-3">
                    <ResultsSkeleton variant="inline" />
                  </div>
                )}

                {error && (
                  <div role="alert" className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs text-white">
                    {error}
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/12 bg-[#121218] p-3">
                <input
                  aria-label="Message AI Creator Assistant"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about hooks, scripts, or strategy..."
                  className={inputClassName}
                  disabled={sending}
                />
                <PrimaryButton
                  type="submit"
                  loading={sending}
                  aria-label="Send message"
                  className="px-3.5"
                >
                  {!sending && <Send className="h-4 w-4" aria-hidden="true" />}
                </PrimaryButton>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
