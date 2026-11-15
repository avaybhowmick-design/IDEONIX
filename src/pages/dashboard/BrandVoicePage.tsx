import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { analyzeCreatorProfileApi } from '../../services/aiClient';
import type { BrandVoicePreset, CreatorProfileAnalysis } from '../../types/ideonix';
import { getPageVariants, MOTION_EASING, useMotionSettings } from '../../config/motion';
import {
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../../components/ui/GlassPrimitives';

const PRESETS: Array<{ name: BrandVoicePreset; note: string }> = [
  { name: 'Cinematic', note: 'Atmospheric pacing, visual scene cues, crisp dramatic pauses.' },
  { name: 'Professional', note: 'Structured, authoritative, concise operational takeaways.' },
  { name: 'Funny', note: 'Self-aware creator humor, fast punchlines, relatable observations.' },
  { name: 'Minimal', note: 'Short declarative sentences, zero fluff, calm confidence.' },
  { name: 'Educational', note: 'Step-by-step clarity, concrete examples, measurable rules.' },
  { name: 'Storytelling', note: 'Narrative tension hook, conflict-to-resolution pacing.' },
  { name: 'Bold', note: 'Contrarian opening stance, direct imperative delivery.' },
  { name: 'Friendly', note: 'Warm conversational tone, approachable guidance.' },
];

export function BrandVoicePage() {
  const {
    brandVoice,
    saveBrandVoice,
    creatorProfile,
    saveCreatorProfile,
    saveLibraryItem,
    recordActivity,
  } = useWorkspace();
  const { durations, tabTransition } = useMotionSettings();

  const [tab, setTab] = useState<'voice' | 'profile'>('voice');

  // Brand Voice form
  const [preset, setPreset] = useState<BrandVoicePreset>(brandVoice.preset);
  const [customDescription, setCustomDescription] = useState(brandVoice.customDescription);
  const [targetAudience, setTargetAudience] = useState(brandVoice.targetAudience);
  const [bannedWords, setBannedWords] = useState(brandVoice.bannedWords);
  const [savingVoice, setSavingVoice] = useState(false);

  // Profile Analyzer form
  const [niche, setNiche] = useState('Filmmaking, editing & creator productivity');
  const [platform, setPlatform] = useState('Instagram & YouTube');
  const [bio, setBio] = useState('Helping solo creators build calm, repeatable studio workflows.');
  const [sampleCaptions, setSampleCaptions] = useState(
    '1) You do not need three lights to look cinematic—you need one dark wall.\n2) Two focused hours on Sunday beats scrambling for ideas every Tuesday night.'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [profileResult, setProfileResult] = useState<CreatorProfileAnalysis | null>(
    creatorProfile
  );
  const [error, setError] = useState<string | null>(null);

  const handleSaveVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingVoice) return;
    setSavingVoice(true);
    try {
      await saveBrandVoice({
        preset,
        customDescription: customDescription.trim(),
        targetAudience: targetAudience.trim(),
        bannedWords: bannedWords.trim(),
      });
    } finally {
      setSavingVoice(false);
    }
  };

  const handleAnalyzeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (analyzing) return;
    if (!niche.trim() || sampleCaptions.trim().length < 20) {
      setError('Niche and at least 20 characters of sample captions are required.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeCreatorProfileApi({
        niche: niche.trim(),
        platform,
        bio: bio.trim(),
        sampleCaptions: sampleCaptions.trim(),
        brandVoice,
      });
      setProfileResult(analysis);
      await saveCreatorProfile(analysis);
      await recordActivity('profile-analyzer', niche.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Brand Voice & Profile Analyzer</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Lock your creative voice across every future AI run, and audit your creator positioning without fabricated metrics.
          </p>
        </div>

        <LayoutGroup id="brand-voice-tabs">
          <div className="glass flex items-center gap-1 rounded-xl p-1">
            {(
              [
                { id: 'voice', label: 'Brand Voice' },
                { id: 'profile', label: 'Creator Profile Analyzer' },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'text-white' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="brand-voice-tab-pill"
                      transition={tabTransition}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-lg border border-white/25 bg-white/20"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'voice' ? (
          <motion.div
            key="voice"
            variants={getPageVariants(durations.base)}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <GlassCard className="p-6">
              <form onSubmit={handleSaveVoice} className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-neutral-300 mb-3">Select Voice Preset</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {PRESETS.map((p) => {
                      const active = preset === p.name;
                      return (
                        <motion.button
                          key={p.name}
                          type="button"
                          onClick={() => setPreset(p.name)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                          className={`glass rounded-xl p-3.5 text-left transition-[border-color,background-color,filter] duration-200 hover:border-white/30 hover:brightness-110 ${
                            active ? '!border-white/35 !bg-white/15' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">{p.name}</span>
                            {active && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-neutral-400">{p.note}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="bv-custom" className={labelClassName}>
                      Custom Voice Instructions (Auto-applied to every generation)
                    </label>
                    <textarea
                      id="bv-custom"
                      rows={3}
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className={inputClassName}
                      placeholder="Describe sentence rhythm, vocabulary, formatting, or sign-off style..."
                    />
                  </div>
                  <div>
                    <label htmlFor="bv-audience" className={labelClassName}>Default Target Audience</label>
                    <input
                      id="bv-audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="bv-banned" className={labelClassName}>Words or Clichés to Avoid</label>
                    <input
                      id="bv-banned"
                      value={bannedWords}
                      onChange={(e) => setBannedWords(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <PrimaryButton type="submit" loading={savingVoice}>
                  Save & Apply Brand Voice
                </PrimaryButton>
              </form>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            variants={getPageVariants(durations.base)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <form onSubmit={handleAnalyzeProfile} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pa-niche" className={labelClassName}>Creator Niche</label>
                  <input
                    id="pa-niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pa-platform" className={labelClassName}>Primary Platform</label>
                  <input
                    id="pa-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pa-bio" className={labelClassName}>Bio / Channel Positioning</label>
                  <input
                    id="pa-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="pa-samples" className={labelClassName}>
                    Sample Captions or Script Excerpts
                  </label>
                  <textarea
                    id="pa-samples"
                    rows={4}
                    value={sampleCaptions}
                    onChange={(e) => setSampleCaptions(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                  <PrimaryButton type="submit" loading={analyzing}>
                    Analyze Creator Profile
                  </PrimaryButton>
                  {profileResult && (
                    <SaveActionButton
                      onSave={() =>
                        saveLibraryItem({
                          category: 'assistant',
                          title: `Profile Audit: ${niche}`,
                          summary: profileResult.identitySummary,
                          platform,
                          tags: ['profile-analyzer', 'positioning'],
                          payload: profileResult as unknown as Record<string, unknown>,
                        })
                      }
                      label="Save Audit to Library"
                      savedLabel="Saved Audit"
                      className="!min-h-[44px]"
                    />
                  )}
                </div>
              </form>

              {error && (
                <div role="alert" className="glass mt-4 rounded-xl px-4 py-3 text-xs text-white">
                  {error}
                </div>
              )}
            </GlassCard>

            {analyzing ? (
              <ResultsSkeleton variant="single" />
            ) : (
              profileResult && (
                <GlassCard className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-medium text-neutral-300">Creator Identity</p>
                    <p className="mt-1 text-sm leading-relaxed text-white">
                      {profileResult.identitySummary}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-neutral-400">Writing Style</p>
                      <p className="mt-1 text-sm text-neutral-200">{profileResult.writingStyle}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-400">Positioning</p>
                      <p className="mt-1 text-sm text-neutral-200">{profileResult.positioning}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 border-t border-white/10 pt-4 text-xs">
                    <div>
                      <p className="font-semibold text-white">Strengths</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-neutral-200">
                        {profileResult.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-300">Weaknesses</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-neutral-300">
                        {profileResult.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Opportunities</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-neutral-200">
                        {profileResult.opportunities.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="border-t border-white/10 pt-3 text-xs text-neutral-400">
                    {profileResult.note}
                  </p>
                </GlassCard>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
