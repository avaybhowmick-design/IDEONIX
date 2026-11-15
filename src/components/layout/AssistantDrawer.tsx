import React, { useState } from 'react';
import { Bookmark, MessageSquare, Send, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { sendAssistantMessageApi } from '../../services/aiClient';
import type { AssistantMessage } from '../../types/ideonix';
import { CopyTextButton, GlassCard, inputClassName, PrimaryButton } from '../ui/GlassPrimitives';

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
      {/* Floating Assistant Trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI Creator Assistant"
          className="fixed right-4 bottom-4 z-40 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-600/95 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-transform hover:scale-[1.02] hover:bg-violet-500"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          <span>Creator Assistant</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <aside
          aria-label="AI Creator Assistant"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col p-3 sm:p-4"
        >
          <GlassCard className="flex h-full flex-col overflow-hidden" withRefraction>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-white">AI Creator Assistant</h2>
                <p className="text-[11px] text-[#9ca2b8]">
                  Context: {brandVoice.preset} voice · {library.length} library items
                </p>
              </div>
              <button
                type="button"
                aria-label="Close AI Creator Assistant"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#b8bcd0] hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Quick context starters */}
            <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-5 py-2.5">
              {[
                'Suggest 3 hooks matching my brand voice',
                'Give me a post idea from my library',
              ].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  disabled={sending}
                  onClick={() => sendPrompt(quick)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#b8bcd0] hover:bg-white/[0.08] hover:text-white"
                >
                  {quick}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-6 border-violet-400/35 bg-violet-600/20 text-white'
                      : 'mr-4 border-white/10 bg-white/[0.04] text-[#e5e7f2]'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.role === 'assistant' && msg.id !== 'welcome_msg' && (
                    <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2">
                      <CopyTextButton text={msg.text} />
                      <button
                        type="button"
                        onClick={async () => {
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
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#b8bcd0] hover:text-white"
                      >
                        <Bookmark className="h-3 w-3 text-violet-300" aria-hidden="true" />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div role="alert" className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
                  {error}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-4">
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
        </aside>
      )}
    </>
  );
}
