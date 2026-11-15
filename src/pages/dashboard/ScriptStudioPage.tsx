import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateScriptApi } from '../../services/aiClient';
import type { GeneratedScript } from '../../types/ideonix';
import { MOTION_EASING, useMotionSettings } from '../../config/motion';
import {
  CopyTextButton,
  GlassCard,
  GlassSelect,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../../components/ui/GlassPrimitives';

export function ScriptStudioPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();
  const { durations } = useMotionSettings();

  const [topic, setTopic] = useState('Why clean audio and tight pacing beat expensive cameras');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [duration, setDuration] = useState('45-60 seconds');
  const [tone, setTone] = useState('Direct & Story-led');
  const [audience, setAudience] = useState('Video editors and solo creators');
  const [language, setLanguage] = useState('English');

  const [script, setScript] = useState<GeneratedScript | null>(null);
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
      <div className="border-b border-white/15 pb-5">
        <h1 className="text-2xl font-bold text-white">Script Studio</h1>
        <p className="mt-1 text-sm text-neutral-300">
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
            <GlassSelect
              id="script-platform"
              value={platform}
              onChange={setPlatform}
              options={['Instagram Reels', 'YouTube Shorts', 'YouTube Long-form', 'LinkedIn Video']}
            />
          </div>
          <div>
            <label htmlFor="script-duration" className={labelClassName}>Duration</label>
            <GlassSelect
              id="script-duration"
              value={duration}
              onChange={setDuration}
              options={['30 seconds', '45-60 seconds', '90 seconds', '5-8 minutes']}
            />
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
          </div>
        </form>

        {error && (
          <div role="alert" className="glass mt-4 rounded-xl !border-white/35 !bg-white/10 px-4 py-3 text-xs text-white">
            {error}
          </div>
        )}
      </GlassCard>

      {loading ? (
        <ResultsSkeleton variant="script" />
      ) : !script ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-white">Your script workspace is ready</p>
          <p className="mt-1 text-xs text-neutral-400">
            Generate a full script above, then edit or regenerate individual sections as needed.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <GlassCard index={0} className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
              <div className="min-w-[220px] flex-1">
                <p className="text-xs text-neutral-400">
                  {script.platform} · {script.duration}
                </p>
                <input
                  aria-label="Script title"
                  value={script.title}
                  onChange={(e) => setScript({ ...script, title: e.target.value })}
                  className="-mx-2 mt-1 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-bold text-white transition-[border-color,box-shadow] duration-200 focus:!border-white focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CopyTextButton
                  text={`${script.title}\n\nHOOK:\n${script.hook}\n\nSCRIPT:\n${script.fullScript}\n\nCTA:\n${script.endingAndCta}`}
                  label="Copy Full Script"
                />
                <SaveActionButton
                  variant="primary"
                  onSave={handleSave}
                  label="Save Script"
                  savedLabel="Saved Script"
                />
              </div>
            </div>

            {/* Hook */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="edit-hook" className="text-xs font-semibold text-white">
                  Opening Hook
                </label>
                <motion.button
                  type="button"
                  disabled={Boolean(regenSection)}
                  onClick={() => handleGenerate(undefined, 'hook')}
                  whileHover={regenSection ? undefined : { y: -2 }}
                  whileTap={regenSection ? undefined : { scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-300 transition-colors hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'hook' ? 'animate-spin' : ''}`} />
                  <span>Regenerate Hook</span>
                </motion.button>
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
                <label htmlFor="edit-full-script" className="text-xs font-semibold text-white">
                  Full Spoken Script (Editable)
                </label>
                <motion.button
                  type="button"
                  disabled={Boolean(regenSection)}
                  onClick={() => handleGenerate(undefined, 'fullScript')}
                  whileHover={regenSection ? undefined : { y: -2 }}
                  whileTap={regenSection ? undefined : { scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-300 transition-colors hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'fullScript' ? 'animate-spin' : ''}`} />
                  <span>Regenerate Body</span>
                </motion.button>
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
                <label htmlFor="edit-cta" className="text-xs font-semibold text-white">
                  Ending & CTA
                </label>
                <motion.button
                  type="button"
                  disabled={Boolean(regenSection)}
                  onClick={() => handleGenerate(undefined, 'endingAndCta')}
                  whileHover={regenSection ? undefined : { y: -2 }}
                  whileTap={regenSection ? undefined : { scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-300 transition-colors hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'endingAndCta' ? 'animate-spin' : ''}`} />
                  <span>Regenerate CTA</span>
                </motion.button>
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
          <GlassCard index={1} className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Scene-by-Scene Breakdown</h2>
              <motion.button
                type="button"
                disabled={Boolean(regenSection)}
                onClick={() => handleGenerate(undefined, 'scenes')}
                whileHover={regenSection ? undefined : { y: -2 }}
                whileTap={regenSection ? undefined : { scale: 0.97 }}
                transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-300 transition-colors hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${regenSection === 'scenes' ? 'animate-spin' : ''}`} />
                <span>Regenerate Scenes</span>
              </motion.button>
            </div>

            <div className="mt-4 divide-y divide-white/15">
              {script.scenes.map((scene, idx) => (
                <div key={scene.sceneNumber} className="grid gap-4 py-4 md:grid-cols-12">
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-white">Scene {scene.sceneNumber}</p>
                    <p className="mt-0.5 font-mono text-xs text-neutral-400 tabular-nums">
                      {scene.timeRange}
                    </p>
                  </div>
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs text-neutral-400">Visual Direction</label>
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
                    <label className="mb-1 block text-xs text-neutral-400">Voiceover & Transition</label>
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
                    <p className="mt-1 text-xs text-neutral-400">Transition: {scene.transition}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Voiceover, Visuals & Transitions */}
          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard index={0} className="p-5">
              <h3 className="text-sm font-semibold text-white">Voiceover Notes</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-300">{script.voiceoverNotes}</p>
            </GlassCard>
            <GlassCard index={1} className="p-5">
              <h3 className="text-sm font-semibold text-white">Visual Suggestions</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
                {script.visualSuggestions.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard index={2} className="p-5">
              <h3 className="text-sm font-semibold text-white">Transition Suggestions</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-neutral-300">
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
