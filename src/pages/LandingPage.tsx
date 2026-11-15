import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  FileText,
  Gauge,
  Layers,
  Repeat,
  Sliders,
  Stethoscope,
  Wand2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  BrandWordmark,
  GlassButton,
  GlassCard,
  inputClassName,
  PrimaryButton,
} from '../components/ui/GlassPrimitives';
import { LegalModal } from '../components/ui/LegalModal';
import { generateIdeasApi } from '../services/aiClient';
import type { GeneratedIdea } from '../types/ideonix';

const PREVIEW_TABS = [
  {
    id: 'autopilot',
    label: 'Creator Autopilot',
    heading: '7-Day Short-Form Launch Pipeline',
    meta: '8 autonomous steps · Brand Voice synced',
    items: [
      '01. Preferences & Pillars — Cinematic Storytelling · Small-room studio creators',
      '02. Hook Angles — "You do not need three lights—you need one dark wall."',
      '03. Flagship Script — 45s 3-scene pacing with transition cues',
      '04. Weekly Calendar — 5 scheduled posts linked to scripts and captions',
    ],
  },
  {
    id: 'script',
    label: 'Script Studio',
    heading: 'Scene-by-Scene Production Breakdown',
    meta: 'Instagram Reels · 45s · 3 Scenes',
    items: [
      '0:00–0:05 · Overhead light flicks off; side key light snaps on',
      '0:05–0:25 · Top-down 45° key light & negative fill diagram',
      '0:25–0:45 · Split-screen comparison + targeted save CTA',
    ],
  },
  {
    id: 'viral',
    label: 'Viral Analyzer',
    heading: 'Structural Quality Evaluation',
    meta: 'AI-generated estimate · 7 dimensions',
    items: [
      'Hook Strength: 88/100 · Immediate visual contrast in first 2 seconds',
      'Clarity: 91/100 · Concrete physical setup steps without jargon',
      'Actionable Fix: Trim intro pause by 0.5s before diagram transition',
    ],
  },
] as const;

const SAMPLE_DEMO_IDEA: GeneratedIdea = {
  id: 'sample_landing_1',
  title: 'Stop Over-Lighting Your Desk: The 1-Lamp Studio Rule',
  description:
    'Show creators why turning off ceiling lights and adding a single side key light instantly elevates low-budget video.',
  hook: 'Your camera is not the problem—your ceiling light is.',
  format: '45s Split-Screen Reel',
  audienceRelevance: 'Targets creators filming in bedrooms or small offices.',
  cta: 'Comment "LIGHT" for the 1-page angle diagram.',
};

const FAQS = [
  {
    q: 'How does Creator Autopilot differ from a generic prompt box?',
    a: 'Autopilot executes 8 linked stages—preferences, strategy, ideas, flagship script, captions, viral quality analysis, Content Doctor edits, and a weekly publishing plan—where each stage passes structured context forward and can be regenerated individually.',
  },
  {
    q: 'Does IDEONIX auto-publish directly to Instagram or YouTube?',
    a: 'No. Content Calendar is built for planning, status tracking (Draft, Planned, Published), linking scripts and captions, and reminders without claiming external auto-publishing.',
  },
  {
    q: 'How is my Brand Voice applied?',
    a: 'Your selected preset (Cinematic, Minimal, Storytelling, etc.), custom voice guidelines, target audience, and banned words are saved in your profile and automatically included in every backend AI call.',
  },
  {
    q: 'Are Viral Analyzer scores a guarantee of reach?',
    a: 'No. Scores are clearly labeled AI-generated structural estimates evaluating hook strength, clarity, storytelling, CTA, and pacing—not predictions of algorithm performance.',
  },
];

export function LandingPage() {
  const { setView, enterDemoMode, brandVoice } = useWorkspace();
  const [previewTab, setPreviewTab] = useState<'autopilot' | 'script' | 'viral'>('autopilot');
  const [demoTopic, setDemoTopic] = useState('How solo editors can cut editing time in half');
  const [demoPlatform, setDemoPlatform] = useState('Instagram Reels');
  const [demoResult, setDemoResult] = useState<GeneratedIdea | null>(null);
  const [demoIsSample, setDemoIsSample] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const activePreview = PREVIEW_TABS.find((t) => t.id === previewTab) || PREVIEW_TABS[0];

  const handleInteractiveDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoTopic.trim() || demoLoading) return;
    setDemoLoading(true);
    setDemoError(null);
    setDemoIsSample(false);
    try {
      const ideas = await generateIdeasApi({
        niche: 'Creator Workflow & Video Production',
        topic: demoTopic.trim(),
        audience: 'Instagram and YouTube creators',
        platform: demoPlatform,
        style: 'Storytelling',
        language: 'English',
        count: 1,
        brandVoice,
      });
      if (ideas[0]) setDemoResult(ideas[0]);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Unable to reach AI endpoint.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#07070b] text-[#f4f4f8]">
      {/* Subtle ambient background mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.16),transparent_65%)]"
      />

      {/* Top Bar Contract: Zone 1 Brand — Zone 2 Links — Zone 3 Primary CTA */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07070b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-5 py-3.5 md:px-8">
          <a href="#top" className="whitespace-nowrap shrink-0">
            <BrandWordmark />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#b8bcd0]">
            <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#demo" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Demo
            </a>
            <a href="#pricing" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => setView('login')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Login
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <PrimaryButton onClick={() => setView('login')} className="px-4 py-2 text-xs sm:text-sm">
              Get Started
            </PrimaryButton>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 md:px-8 md:pt-20">
          <div className="grid items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-medium tracking-wide text-violet-300">
                IDEONIX · From Ideas to Impact.
              </p>
              <h1 className="headline-balance mt-4 text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-white">
                Turn Your Ideas Into Content That Connects.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#b8bcd0]">
                Go from a single rough thought to a complete content strategy. Generate hooks,
                shoot-ready scripts, platform-native captions, quality diagnostics, and a structured
                publishing calendar inside one calm workspace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={() => setView('login')}>
                  <span>Start Creating</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
                <GlassButton
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore Features
                </GlassButton>
                <button
                  type="button"
                  onClick={enterDemoMode}
                  className="min-h-[44px] px-3 text-sm font-medium text-[#b8bcd0] underline decoration-white/25 underline-offset-4 hover:text-white"
                >
                  Launch Demo Workspace
                </button>
              </div>
            </div>

            {/* Animated Interactive Dashboard Preview */}
            <div className="lg:col-span-6">
              <GlassCard className="h-full p-5 sm:p-6" withRefraction>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                    {PREVIEW_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPreviewTab(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          previewTab === tab.id
                            ? 'bg-violet-600 text-white'
                            : 'text-[#b8bcd0] hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.div
                  key={activePreview.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mt-5"
                >
                  <div className="text-xs text-[#9ca2b8]">{activePreview.meta}</div>
                  <h2 className="mt-1 text-lg font-semibold text-white">{activePreview.heading}</h2>

                  <div className="mt-4 space-y-2.5">
                    {activePreview.items.map((line, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#d9dce8]"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard subtle className="p-7">
              <p className="text-xs font-medium text-[#9ca2b8]">The Creator Bottleneck</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Scattered docs, inconsistent voice, zero feedback loop.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#b8bcd0]">
                Creators juggle separate note apps for hooks, generic chat threads for scripts,
                spreadsheets for schedules, and guesswork for pacing. Every platform rewrite drifts
                further from their actual voice.
              </p>
            </GlassCard>

            <GlassCard className="p-7">
              <p className="text-xs font-medium text-violet-300">The IDEONIX Pipeline</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Connected modules sharing one Brand Voice & Library.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#b8bcd0]">
                Define your voice once. Run Autopilot or open any dedicated studio—every script,
                caption, viral audit, Content Doctor rewrite, and calendar slot pulls from the same
                creative context.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Asymmetric Feature Bento Grid */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-violet-300">Capabilities</p>
            <h2 className="headline-balance mt-2 text-3xl font-bold tracking-tight text-white">
              Thirteen connected tools built for daily publishing.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-6">
            <GlassCard className="p-6 md:col-span-4">
              <div className="flex items-center justify-between">
                <Wand2 className="h-5 w-5 text-violet-300" aria-hidden="true" />
                <span className="text-xs text-[#9ca2b8]">Signature Pipeline</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Creator Autopilot</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]">
                Moves sequentially through preferences, strategy, ideas, flagship script, captions,
                viral critique, Content Doctor edits, and a weekly calendar—letting you regenerate
                any single step without restarting.
              </p>
            </GlassCard>

            <GlassCard subtle className="p-6 md:col-span-2">
              <FileText className="h-5 w-5 text-violet-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">Script Studio</h3>
              <p className="mt-2 text-sm text-[#b8bcd0]">
                Timed scene-by-scene breakdowns, voiceover notes, transitions, and per-section edits.
              </p>
            </GlassCard>

            <GlassCard subtle className="p-6 md:col-span-2">
              <Repeat className="h-5 w-5 text-violet-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">Content Repurposer</h3>
              <p className="mt-2 text-sm text-[#b8bcd0]">
                Turns one script into Instagram Reel, YouTube Shorts, YouTube Description, Facebook,
                LinkedIn, and X posts.
              </p>
            </GlassCard>

            <GlassCard subtle className="p-6 md:col-span-2">
              <Gauge className="h-5 w-5 text-violet-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">Viral Analyzer</h3>
              <p className="mt-2 text-sm text-[#b8bcd0]">
                7-axis quality estimate (Hook, Relevance, Clarity, Engagement, Storytelling, CTA,
                Structure) with concrete fixes.
              </p>
            </GlassCard>

            <GlassCard subtle className="p-6 md:col-span-2">
              <Stethoscope className="h-5 w-5 text-violet-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">Content Doctor</h3>
              <p className="mt-2 text-sm text-[#b8bcd0]">
                Flags weak transitions and filler wording, showing original vs. improved copy side by
                side.
              </p>
            </GlassCard>

            <GlassCard subtle className="p-6 md:col-span-3">
              <Layers className="h-5 w-5 text-violet-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">Campaign Studio & Brand Voice</h3>
              <p className="mt-2 text-sm text-[#b8bcd0]">
                Generate multi-day launch plans with interactive checklists, and lock your voice
                preset across every future output.
              </p>
            </GlassCard>

            <GlassCard subtle className="p-6 md:col-span-3">
              <Calendar className="h-5 w-5 text-violet-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-white">Calendar & Creator Assistant</h3>
              <p className="mt-2 text-sm text-[#b8bcd0]">
                Monthly, weekly, and daily schedules linked to saved scripts and captions, backed by
                an always-available context-aware assistant.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-violet-300">How It Works</p>
            <h2 className="headline-balance mt-2 text-3xl font-bold tracking-tight text-white">
              Three steps from raw concept to scheduled week.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                num: '01. Capture & Align',
                desc: 'Choose your niche, target audience, and Brand Voice preset so every line matches your natural delivery.',
              },
              {
                num: '02. Draft & Diagnose',
                desc: 'Run Creator Autopilot or individual studios to build scenes, hooks, and multi-platform captions, then tighten weak spots with Content Doctor.',
              },
              {
                num: '03. Organize & Schedule',
                desc: 'Save final assets to My Library, link scripts directly to Content Calendar slots, and track Draft to Published progress.',
              },
            ].map((step) => (
              <div key={step.num} className="border-t border-white/15 pt-5">
                <h3 className="text-lg font-semibold text-white">{step.num}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Demo */}
        <section id="demo" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <GlassCard className="p-6 sm:p-8" withRefraction>
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-xs font-medium text-violet-300">Interactive Demo</p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Test an idea angle right here.
                </h2>
                <p className="mt-2 text-sm text-[#b8bcd0]">
                  Calls the live IDEONIX backend Gemini endpoint or lets you inspect a clearly
                  labeled sample output.
                </p>

                <form onSubmit={handleInteractiveDemo} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="landing-topic" className="mb-1.5 block text-xs font-medium text-[#b8bcd0]">
                      Video Topic
                    </label>
                    <input
                      id="landing-topic"
                      value={demoTopic}
                      onChange={(e) => setDemoTopic(e.target.value)}
                      className={inputClassName}
                      placeholder="Enter a topic..."
                    />
                  </div>
                  <div>
                    <label htmlFor="landing-platform" className="mb-1.5 block text-xs font-medium text-[#b8bcd0]">
                      Platform
                    </label>
                    <select
                      id="landing-platform"
                      value={demoPlatform}
                      onChange={(e) => setDemoPlatform(e.target.value)}
                      className={inputClassName}
                    >
                      <option value="Instagram Reels">Instagram Reels</option>
                      <option value="YouTube Shorts">YouTube Shorts</option>
                      <option value="YouTube Long-form">YouTube Long-form</option>
                      <option value="LinkedIn">LinkedIn</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <PrimaryButton type="submit" loading={demoLoading}>
                      Generate Live Idea
                    </PrimaryButton>
                    <GlassButton
                      onClick={() => {
                        setDemoError(null);
                        setDemoResult(SAMPLE_DEMO_IDEA);
                        setDemoIsSample(true);
                      }}
                    >
                      Load Sample Data
                    </GlassButton>
                  </div>
                </form>

                {demoError && (
                  <p role="alert" className="mt-3 text-xs text-rose-300">
                    {demoError}
                  </p>
                )}
              </div>

              <div className="lg:col-span-7">
                <div className="h-full rounded-2xl border border-white/10 bg-[#07070b]/70 p-6">
                  {demoResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-[#9ca2b8]">
                        <span>
                          {demoResult.format} · {demoPlatform}
                        </span>
                        {demoIsSample && (
                          <span className="font-medium text-amber-300">Sample data</span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-white">{demoResult.title}</h3>
                      <p className="text-sm text-[#b8bcd0]">{demoResult.description}</p>
                      <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                        <p>
                          <span className="font-semibold text-violet-300">Hook: </span>
                          <span className="text-white">{demoResult.hook}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-violet-300">Audience Fit: </span>
                          <span className="text-[#b8bcd0]">{demoResult.audienceRelevance}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-violet-300">CTA: </span>
                          <span className="text-[#b8bcd0]">{demoResult.cta}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                      <Sliders className="h-6 w-6 text-violet-300/70" aria-hidden="true" />
                      <p className="mt-3 text-sm font-medium text-white">
                        Ready to preview an IDEONIX concept
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-[#9ca2b8]">
                        Submit a topic on the left to generate a structured hook, format, and CTA.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-violet-300">Pricing</p>
            <h2 className="headline-balance mt-2 text-3xl font-bold tracking-tight text-white">
              Transparent tiers for solo creators and studios.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                audience: 'For emerging solo creators',
                price: '$0',
                cadence: 'Free forever',
                limits: [
                  '15 AI studio runs per month',
                  '1 saved Brand Voice profile',
                  'Content Calendar & My Library',
                ],
              },
              {
                name: 'Creator Pro',
                audience: 'For weekly Instagram & YouTube channels',
                price: '$24',
                cadence: 'per month',
                featured: true,
                limits: [
                  'Unlimited Idea, Script & Caption runs',
                  '20 Creator Autopilot workflows / month',
                  'Viral Analyzer & Content Doctor diagnostics',
                ],
              },
              {
                name: 'Studio Team',
                audience: 'For editors & social media managers',
                price: '$59',
                cadence: 'per month',
                limits: [
                  'Unlimited Autopilot & Campaign Studio',
                  'Up to 10 client Brand Voice profiles',
                  'Full workspace JSON export & priority limits',
                ],
              },
            ].map((tier) => (
              <GlassCard
                key={tier.name}
                subtle={!tier.featured}
                className={`flex flex-col justify-between p-6 ${
                  tier.featured ? 'ring-1 ring-violet-400/50' : ''
                }`}
              >
                <div>
                  <p className="text-xs text-[#9ca2b8]">{tier.audience}</p>
                  <h3 className="mt-1 text-xl font-bold text-white">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-white tabular-nums">
                      {tier.price}
                    </span>
                    <span className="text-xs text-[#9ca2b8]">{tier.cadence}</span>
                  </div>
                  <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm text-[#b8bcd0]">
                    {tier.limits.map((lim) => (
                      <li key={lim}>{lim}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7">
                  {tier.featured ? (
                    <PrimaryButton onClick={() => setView('login')} className="w-full justify-center">
                      Start Creator Pro
                    </PrimaryButton>
                  ) : (
                    <GlassButton onClick={() => setView('login')} className="w-full justify-center">
                      Choose {tier.name}
                    </GlassButton>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-5 py-16 md:px-8">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white hover:text-violet-200"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#9ca2b8] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-5 text-sm leading-relaxed text-[#b8bcd0]">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#07070b]/90 px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <BrandWordmark />
            <p className="mt-2 text-xs text-[#7e8399]">
              IDEONIX · From Ideas to Impact.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#9ca2b8]">
            <button type="button" onClick={() => setLegalModal('terms')} className="hover:text-white">
              Terms of Service
            </button>
            <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-white">
              Privacy Policy
            </button>
            <button type="button" onClick={() => setView('login')} className="hover:text-white">
              Login
            </button>
          </div>
        </div>
      </footer>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
