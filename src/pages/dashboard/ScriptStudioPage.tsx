import React, { useState } from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateScriptApi } from '../../services/aiClient';
import type { GeneratedScript } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const SAMPLE_SCRIPT: GeneratedScript = {
  title: 'Stop Cutting Dead Air Manually: 2-Minute Retention Edit',
  platform: 'YouTube Shorts',
  duration: '45 seconds',
  hook: 'If your retention graph drops at second five, your pauses are too polite.',
  fullScript:
    'If your retention graph drops at second five, your pauses are too polite. Viewers decide in one breath whether your pacing respects their time. Instead of trimming every clip by eye, tighten every sentence gap to under three frames, add a visual angle change every four seconds, and move your payoff into the first ten words. Clean pacing beats flashy transitions every time. Save this checklist before exporting your next cut.',
  scenes: [
    {
      sceneNumber: 1,
      timeRange: '0:00 - 0:06',
      visual: 'Tight close-up over timeline showing retention dip at 0:05.',
      voiceover: 'If your retention graph drops at second five, your pauses are too polite.',
      transition: 'Jump cut on beat',
    },
    {
      sceneNumber: 2,
      timeRange: '0:06 - 0:28',
      visual: 'Screen recording trimming breath gaps down to 2 frames.',
      voiceover: 'Tighten sentence gaps under three frames and swap visual framing every four seconds.',
      transition: 'Slide left to comparison',
    },
    {
      sceneNumber: 3,
      timeRange: '0:28 - 0:45',
      visual: 'Before/after retention timeline + clean end card.',
      voiceover: 'Clean pacing beats flashy effects. Save this checklist before your next export.',
      transition: 'Fade out',
    },
  ],
  voiceoverNotes: 'Crisp, conversational cadence; raise energy slightly on the closing CTA.',
  visualSuggestions: ['Timeline zoom-in on waveform cuts', 'On-screen 4-second pacing marker'],
  transitionSuggestions: ['Audio pre-lap 2 frames early', 'Punch-in 115% scale cut'],
  endingAndCta: 'Save this checklist before exporting your next cut.',
};

export function ScriptStudioPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [topic, setTopic] = useState('Why clean audio and tight pacing beat expensive cameras');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [duration, setDuration] = useState('45-60 seconds');
  const [tone, setTone] = useState('Direct & Story-led');
  const [audience, setAudience] = useState('Video editors and solo creators');
  const [language, setLanguage] = useState('English');

  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenSection, setRegenSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent, sectionToRegen?: string) => {
    e?.preventDefault();
    if (loading || regenSection) return;
    if (!topic.trim()) {
      setError('Topic is required.');
      return;
    }

    setError(null);
    if (sectionToRegen) {
      setRegenSection(sectionToRegen);
    } else {
      setLoading(true);
      setIsSample(false);
    }

    try {
      const result = await generateScriptApi({
        topic: topic.trim(),
        platform,
        duration,
        tone,
        audience: audience.trim(),
        language,
        brandVoice,
        regenerateSection: sectionToRegen,
        existingScriptJson: sectionToRegen && script ? JSON.stringify(script) : undefined,
      });
      setScript(result);
      setIsSample(false);
      await recordActivity('script', result.title || topic.trim());
      if (sectionToRegen) {
        notify(`Regenerated ${sectionToRegen} section.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Script generation failed.');
    } finally {
      setLoading(false);
      setRegenSection(null);
    }
  };

  const handleSave = async () => {
    if (!script) return;
    await saveLibraryItem({
      category: 'script',
      title: script.title || topic,
      summary: `${script.platform} · ${script.duration} — ${script.hook}`,
      platform: script.platform || platform,
      tags: ['script', platform.toLowerCase().slice(0, 25)],
      payload: script as unknown as Record<string, unknown>,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Script Studio</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Build shoot-ready scripts with hooks, scene breakdowns, visual direction, and section-level regeneration.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={(e) => handleGenerate(e)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="script-topic" className={labelClassName}>Topic / Premise</label>
            <input
              id="script-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="script-platform" className={labelClassName}>Platform</label>
            <select
              id="script-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClassName}
            >
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
              <option>YouTube Long-form</option>
              <option>LinkedIn Video</option>
            </select>
          </div>
          <div>
            <label htmlFor="script-duration" className={labelClassName}>Duration</label>
            <select
              id="script-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClassName}
            >
              <option>30 seconds</option>
              <option>45-60 seconds</option>
              <option>90 seconds</option>
              <option>5-8 minutes</option>
            </select>
          </div>
          <div>
            <label htmlFor="script-tone" className={labelClassName}>Tone</label>
            <input
              id="script-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="script-audience" className={labelClassName}>Audience</label>
            <input
              id="script-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="script-language" className={labelClassName}>Language</label>
            <input
              id="script-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3 pt-2">
            <PrimaryButton type="submit" loading={loading}>
              Generate Script
            </PrimaryButton>
            <GlassButton
              onClick={() => {
                setError(null);
                setScript(SAMPLE_SCRIPT);
                setIsSample(true);
                notify('Loaded clearly labeled Sample data.');
              }}
            >
              Load Sample Data
            </GlassButton>
          </div>
        </form>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </div>
        )}
      </GlassCard>

      {!script ? (
        <GlassCard subtle className="p-10 text-center">
          <p className="text-sm font-medium text-white">Your script workspace is ready</p>
          <p className="mt-1 text-xs text-[#9ca2b8]">
            Generate a full script above, then edit or regenerate individual sections as needed.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs text-[#9ca2b8]">
                  {script.platform} · {script.duration}
                  {isSample ? ' · Sample data' : ''}
                </p>
                <input
                  aria-label="Script title"
                  value={script.title}
                  onChange={(e) => setScript({ ...script, title: e.target.value })}
                  className="mt-1 w-full bg-transparent text-xl font-bold text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CopyTextButton
                  text={`${script.title}\n\nHOOK:\n${script.hook}\n\nSCRIPT:\n${script.fullScript}\n\nCTA:\n${script.endingAndCta}`}
                  label="Copy Full Script"
                />
                <PrimaryButton onClick={handleSave} className="px-4 py-2 text-xs">
                  <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save Script</span>
                </PrimaryButton>
              </div>
            </div>

            {/* Hook */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="edit-hook" className="text-xs font-semibold text-violet-300">
                  Opening Hook
                </label>
                <button
                  type="button"
                  disabled={Boolean(regenSection)}
                  onClick={() => handleGenerate(undefined, 'hook')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#b8bcd0] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'hook' ? 'animate-spin' : ''}`} />
                  <span>Regenerate Hook</span>
                </button>
              </div>
              <textarea
                id="edit-hook"
                rows={2}
                value={script.hook}
                onChange={(e) => setScript({ ...script, hook: e.target.value })}
                className={inputClassName}
              />
            </div>

            {/* Full Spoken Script */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="edit-full-script" className="text-xs font-semibold text-violet-300">
                  Full Spoken Script (Editable)
                </label>
                <button
                  type="button"
                  disabled={Boolean(regenSection)}
                  onClick={() => handleGenerate(undefined, 'fullScript')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#b8bcd0] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'fullScript' ? 'animate-spin' : ''}`} />
                  <span>Regenerate Body</span>
                </button>
              </div>
              <textarea
                id="edit-full-script"
                rows={5}
                value={script.fullScript}
                onChange={(e) => setScript({ ...script, fullScript: e.target.value })}
                className={inputClassName}
              />
            </div>

            {/* Ending & CTA */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="edit-cta" className="text-xs font-semibold text-violet-300">
                  Ending & CTA
                </label>
                <button
                  type="button"
                  disabled={Boolean(regenSection)}
                  onClick={() => handleGenerate(undefined, 'endingAndCta')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#b8bcd0] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'endingAndCta' ? 'animate-spin' : ''}`} />
                  <span>Regenerate CTA</span>
                </button>
              </div>
              <input
                id="edit-cta"
                value={script.endingAndCta}
                onChange={(e) => setScript({ ...script, endingAndCta: e.target.value })}
                className={inputClassName}
              />
            </div>
          </GlassCard>

          {/* Scene-by-Scene Breakdown */}
          <GlassCard subtle className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Scene-by-Scene Breakdown</h2>
              <button
                type="button"
                disabled={Boolean(regenSection)}
                onClick={() => handleGenerate(undefined, 'scenes')}
                className="inline-flex items-center gap-1.5 text-xs text-[#b8bcd0] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'scenes' ? 'animate-spin' : ''}`} />
                <span>Regenerate Scenes</span>
              </button>
            </div>

            <div className="mt-4 divide-y divide-white/10">
              {script.scenes.map((scene, idx) => (
                <div key={scene.sceneNumber} className="grid gap-4 py-4 md:grid-cols-12">
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-violet-300">Scene {scene.sceneNumber}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#9ca2b8] tabular-nums">
                      {scene.timeRange}
                    </p>
                  </div>
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs text-[#9ca2b8]">Visual Direction</label>
                    <textarea
                      rows={2}
                      value={scene.visual}
                      onChange={(e) => {
                        const next = [...script.scenes];
                        next[idx] = { ...scene, visual: e.target.value };
                        setScript({ ...script, scenes: next });
                      }}
                      className={inputClassName}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs text-[#9ca2b8]">Voiceover & Transition</label>
                    <textarea
                      rows={2}
                      value={scene.voiceover}
                      onChange={(e) => {
                        const next = [...script.scenes];
                        next[idx] = { ...scene, voiceover: e.target.value };
                        setScript({ ...script, scenes: next });
                      }}
                      className={inputClassName}
                    />
                    <p className="mt-1 text-xs text-[#7e8399]">Transition: {scene.transition}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Voiceover, Visuals & Transitions */}
          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard subtle className="p-5">
              <h3 className="text-sm font-semibold text-white">Voiceover Notes</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#b8bcd0]">{script.voiceoverNotes}</p>
            </GlassCard>
            <GlassCard subtle className="p-5">
              <h3 className="text-sm font-semibold text-white">Visual Suggestions</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-[#b8bcd0]">
                {script.visualSuggestions.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard subtle className="p-5">
              <h3 className="text-sm font-semibold text-white">Transition Suggestions</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-[#b8bcd0]">
                {script.transitionSuggestions.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
