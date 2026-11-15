import { Type, type Schema } from '@google/genai';
import type { BrandVoiceConfig } from '../../src/types/ideonix.ts';

export function formatBrandVoiceContext(brandVoice?: Partial<BrandVoiceConfig> | null): string {
  if (!brandVoice) {
    return 'Brand voice: Clear, high-retention, natural creator tone. Avoid hype clichés.';
  }
  const parts = [
    `Active Brand Voice Preset: ${brandVoice.preset || 'Professional'}`,
    brandVoice.customDescription ? `Custom Voice Rules: ${brandVoice.customDescription}` : '',
    brandVoice.targetAudience ? `Default Target Audience: ${brandVoice.targetAudience}` : '',
    brandVoice.bannedWords ? `Avoid these words/phrases: ${brandVoice.bannedWords}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

export const ideasPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX, a senior short-form and long-form content strategist. Generate concrete, original content concepts tailored to the creator's inputs and brand voice. Never use generic filler buzzwords.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: {
    niche: string;
    topic: string;
    audience: string;
    platform: string;
    style: string;
    language: string;
    count: number;
  }) =>
    `Generate ${input.count} distinct content ideas in ${input.language}.
Niche: ${input.niche}
Core Topic: ${input.topic}
Target Audience: ${input.audience}
Platform: ${input.platform}
Style: ${input.style}

Each idea must include a crisp title, practical description, scroll-stopping opening hook, recommended format, why it matters to the audience, and a natural CTA.`,
  schema: {
    type: Type.OBJECT,
    properties: {
      ideas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            hook: { type: Type.STRING },
            format: { type: Type.STRING },
            audienceRelevance: { type: Type.STRING },
            cta: { type: Type.STRING },
          },
          required: ['title', 'description', 'hook', 'format', 'audienceRelevance', 'cta'],
        },
      },
    },
    required: ['ideas'],
  } satisfies Schema,
};

export const scriptPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Script Studio, a veteran video producer and scriptwriter. Write shoot-ready, natural spoken scripts with visual direction, pacing, and transitions.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: {
    topic: string;
    platform: string;
    duration: string;
    tone: string;
    audience: string;
    language: string;
    regenerateSection?: string;
    existingScriptJson?: string;
  }) => {
    if (input.regenerateSection && input.existingScriptJson) {
      return `Revise and regenerate ONLY the "${input.regenerateSection}" section of this script while keeping the rest cohesive. Return the complete updated script object in ${input.language}.
Topic: ${input.topic}
Platform: ${input.platform}
Duration: ${input.duration}
Tone: ${input.tone}
Audience: ${input.audience}

Existing Script JSON:
${input.existingScriptJson}`;
    }

    return `Write a complete production-ready script in ${input.language}.
Topic: ${input.topic}
Platform: ${input.platform}
Target Duration: ${input.duration}
Tone: ${input.tone}
Target Audience: ${input.audience}

Provide a strong hook, full spoken script, 4-6 timed scene-by-scene breakdowns (sceneNumber, timeRange, visual, voiceover, transition), voiceover delivery notes, visual suggestions, transition suggestions, and a clean ending with CTA.`;
  },
  schema: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      platform: { type: Type.STRING },
      duration: { type: Type.STRING },
      hook: { type: Type.STRING },
      fullScript: { type: Type.STRING },
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            timeRange: { type: Type.STRING },
            visual: { type: Type.STRING },
            voiceover: { type: Type.STRING },
            transition: { type: Type.STRING },
          },
          required: ['sceneNumber', 'timeRange', 'visual', 'voiceover', 'transition'],
        },
      },
      voiceoverNotes: { type: Type.STRING },
      visualSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      transitionSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      endingAndCta: { type: Type.STRING },
    },
    required: [
      'title',
      'platform',
      'duration',
      'hook',
      'fullScript',
      'scenes',
      'voiceoverNotes',
      'visualSuggestions',
      'transitionSuggestions',
      'endingAndCta',
    ],
  } satisfies Schema,
};

export const captionsPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Caption Studio. Write high-converting, platform-native social captions with strategic hashtags and clean CTAs.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: {
    topic: string;
    context: string;
    platform: string;
    language: string;
  }) =>
    `Create 5 distinct caption variations for ${input.platform} in ${input.language} covering exactly these five styles: Engaging, Short, Professional, Funny, Emotional.
Topic: ${input.topic}
Additional Context / Key Points: ${input.context || 'None provided'}

Each variation needs a tailored caption, 4-7 relevant hashtags (without spammy filler), and a crisp CTA.`,
  schema: {
    type: Type.OBJECT,
    properties: {
      variations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            style: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            cta: { type: Type.STRING },
          },
          required: ['style', 'caption', 'hashtags', 'cta'],
        },
      },
    },
    required: ['variations'],
  } satisfies Schema,
};

export const repurposePrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Content Repurposer. Transform one core piece of content into six natively adapted formats for Instagram Reel, YouTube Shorts, YouTube Description, Facebook, LinkedIn, and X — genuinely altering hook, cadence, length, and structure for each network.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: { sourceText: string; goal: string }) =>
    `Repurpose the following script or article into all 6 platform formats: "Instagram Reel", "YouTube Shorts", "YouTube Description", "Facebook", "LinkedIn", and "X".
Primary Goal: ${input.goal || 'Maximize clarity and audience retention'}

Source Content:
${input.sourceText}`,
  schema: {
    type: Type.OBJECT,
    properties: {
      versions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            headline: { type: Type.STRING },
            content: { type: Type.STRING },
            structureNotes: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['platform', 'headline', 'content', 'structureNotes', 'hashtags'],
        },
      },
    },
    required: ['versions'],
  } satisfies Schema,
};

export const viralAnalyzerPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Viral Analyzer, an editorial quality evaluator. Score content honestly out of 100 across 7 structural dimensions without flattery or fabricated guarantees.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: {
    title: string;
    content: string;
    platform: string;
    audience: string;
  }) =>
    `Evaluate this ${input.platform} draft for ${input.audience || 'general creator audience'}.
Title / Hook: ${input.title}
Draft Content:
${input.content}

Return an overallScore (0-100), summary, exactly 7 metrics ("Hook Strength", "Relevance", "Clarity", "Engagement", "Storytelling", "CTA", "Structure") with score (0-100), clear explanation, and a concrete fix for each, plus topFixes.`,
  schema: {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER },
      summary: { type: Type.STRING },
      metrics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            score: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            fix: { type: Type.STRING },
          },
          required: ['label', 'score', 'explanation', 'fix'],
        },
      },
      topFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['overallScore', 'summary', 'metrics', 'topFixes'],
  } satisfies Schema,
};

export const contentDoctorPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Content Doctor, a ruthless copy and script editor. Identify weak sections, cut filler wording, sharpen hooks, clarify storytelling, and strengthen the CTA while preserving the creator's voice.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: { content: string; platform: string; goal: string }) =>
    `Diagnose and improve this ${input.platform} draft. Goal: ${input.goal || 'Higher retention and clearer CTA'}.

Original Draft:
${input.content}

Identify unnecessaryWording phrases, provide a tightened improvedFullText, improvedHook, improvedCta, and 3-5 side-by-side changes (section, weakness, originalSnippet, improvedSnippet, reason).`,
  schema: {
    type: Type.OBJECT,
    properties: {
      diagnosisSummary: { type: Type.STRING },
      unnecessaryWording: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvedFullText: { type: Type.STRING },
      improvedHook: { type: Type.STRING },
      improvedCta: { type: Type.STRING },
      changes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            section: { type: Type.STRING },
            weakness: { type: Type.STRING },
            originalSnippet: { type: Type.STRING },
            improvedSnippet: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ['section', 'weakness', 'originalSnippet', 'improvedSnippet', 'reason'],
        },
      },
    },
    required: ['diagnosisSummary', 'unnecessaryWording', 'improvedFullText', 'improvedHook', 'improvedCta', 'changes'],
  } satisfies Schema,
};

export const campaignPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Campaign Studio. Architect practical multi-day creator campaigns with daily angles, formats, script outlines, captions, hashtags, and production checklists.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: {
    topic: string;
    objective: string;
    audience: string;
    durationDays: number;
    platform: string;
    startDate: string;
  }) =>
    `Build a ${input.durationDays}-day campaign starting on ${input.startDate}.
Topic: ${input.topic}
Objective: ${input.objective}
Target Audience: ${input.audience}
Primary Platform: ${input.platform}

Provide a campaign title, strategic overview, ${input.durationDays} daily plan items (day number, ISO publishDate starting from ${input.startDate}, title, format, idea, scriptOutline, caption, hashtags), and a 5-7 item production checklist.`,
  schema: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      overview: { type: Type.STRING },
      days: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER },
            publishDate: { type: Type.STRING },
            title: { type: Type.STRING },
            format: { type: Type.STRING },
            idea: { type: Type.STRING },
            scriptOutline: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['day', 'publishDate', 'title', 'format', 'idea', 'scriptOutline', 'caption', 'hashtags'],
        },
      },
      checklist: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ['title', 'overview', 'days', 'checklist'],
  } satisfies Schema,
};

export const profileAnalyzerPrompt = {
  system: (brandVoice?: Partial<BrandVoiceConfig>) =>
    `You are IDEONIX Creator Profile Analyzer. Analyze positioning and writing patterns purely from the creator's provided niche, bio, and sample captions. NEVER invent follower counts, engagement rates, impressions, or fabricated metrics.\n\n${formatBrandVoiceContext(brandVoice)}`,
  buildPrompt: (input: {
    niche: string;
    platform: string;
    bio: string;
    sampleCaptions: string;
  }) =>
    `Analyze this creator profile strictly based on the text provided below. Do not invent follower counts or numerical analytics.
Niche: ${input.niche}
Primary Platform: ${input.platform}
Bio / Positioning Statement: ${input.bio || 'Not provided'}
Sample Captions / Scripts:
${input.sampleCaptions}`,
  schema: {
    type: Type.OBJECT,
    properties: {
      identitySummary: { type: Type.STRING },
      writingStyle: { type: Type.STRING },
      positioning: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
      note: { type: Type.STRING },
    },
    required: ['identitySummary', 'writingStyle', 'positioning', 'strengths', 'weaknesses', 'opportunities', 'note'],
  } satisfies Schema,
};

export const autopilotSchemas: Record<string, Schema> = {
  preferences: {
    type: Type.OBJECT,
    properties: {
      positioningSummary: { type: Type.STRING },
      contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
      toneAlignment: { type: Type.STRING },
    },
    required: ['positioningSummary', 'contentPillars', 'toneAlignment'],
  },
  strategy: {
    type: Type.OBJECT,
    properties: {
      campaignTitle: { type: Type.STRING },
      overview: { type: Type.STRING },
      targetOutcome: { type: Type.STRING },
      cadenceRecommendation: { type: Type.STRING },
    },
    required: ['campaignTitle', 'overview', 'targetOutcome', 'cadenceRecommendation'],
  },
  ideas: ideasPrompt.schema,
  script: scriptPrompt.schema,
  captions: captionsPrompt.schema,
  quality: viralAnalyzerPrompt.schema,
  improve: contentDoctorPrompt.schema,
  calendar: {
    type: Type.OBJECT,
    properties: {
      weeklyPlan: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dayLabel: { type: Type.STRING },
            suggestedDate: { type: Type.STRING },
            platform: { type: Type.STRING },
            format: { type: Type.STRING },
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            caption: { type: Type.STRING },
          },
          required: ['dayLabel', 'suggestedDate', 'platform', 'format', 'title', 'hook', 'caption'],
        },
      },
    },
    required: ['weeklyPlan'],
  },
};
