import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { sendAssistantMessageApi } from '../../services/aiClient';
import type { AssistantMessage } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassCard,
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

  return (
    <>
      <AnimatePresence>
        {/* Floating Assistant Trigger */}
        {!open && (
          <motion.button
            key="assistant-trigger"
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
            onClick={() => setOpen(true)}
            aria-label="Open AI Creator Assistant"
            className="glass fixed right-4 bottom-4 z-40 inline-flex min-h-[44px] items-center gap-2 rounded-xl !border-white/30 !bg-white/15 px-3.5 py-2.5 text-xs font-semibold text-white transition-[background-color,border-color,filter] duration-200 hover:!bg-white/25 hover:brightness-110"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>Creator Assistant</span>
          </motion.button>
        )}

        {/* Drawer */}
        {open && (
          <motion.aside
            key="assistant-drawer"
            aria-label="AI Creator Assistant"
            initial={{ opacity: 0, x: 32, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 32, scale: 0.98 }}
            transition={{ duration: durations.base, ease: MOTION_EASING.out }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col p-3 sm:p-4"
          >
            <GlassCard hoverLift={false} className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">AI Creator Assistant</h2>
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
                  className="glass inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-300 hover:border-white/30 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Quick context starters */}
              <div className="flex flex-wrap gap-1.5 border-b border-white/15 px-5 py-2.5">
                {[
                  'Suggest 3 hooks matching my brand voice',
                  'Give me a post idea from my library',
                ].map((quick) => (
                  <motion.button
                    key={quick}
                    type="button"
                    disabled={sending}
                    whileHover={sending ? undefined : { y: -2 }}
                    whileTap={sending ? undefined : { scale: 0.97 }}
                    transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                    onClick={() => sendPrompt(quick)}
                    className="glass rounded-lg px-2.5 py-1 text-[11px] text-neutral-300 hover:border-white/30 hover:text-white disabled:opacity-50"
                  >
                    {quick}
                  </motion.button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={listVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className={`glass rounded-xl px-4 py-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'ml-6 !border-white/30 !bg-white/12 text-white'
                          : 'mr-4 text-neutral-200'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      {msg.role === 'assistant' && msg.id !== 'welcome_msg' && (
                        <div className="mt-2.5 flex items-center gap-2 border-t border-white/15 pt-2">
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
                  <div className="glass mr-4 rounded-xl px-4 py-3">
                    <ResultsSkeleton variant="inline" />
                  </div>
                )}

                {error && (
                  <div role="alert" className="glass rounded-xl !border-white/35 !bg-white/10 px-3.5 py-2.5 text-xs text-white">
                    {error}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/15 p-4">
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
            </GlassCard>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
