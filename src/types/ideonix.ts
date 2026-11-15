export type BrandVoicePreset =
  | 'Cinematic'
  | 'Professional'
  | 'Funny'
  | 'Minimal'
  | 'Educational'
  | 'Storytelling'
  | 'Bold'
  | 'Friendly';

export interface BrandVoiceConfig {
  preset: BrandVoicePreset;
  customDescription: string;
  targetAudience: string;
  bannedWords: string;
  updatedAt?: string;
}

export type DashboardPageId =
  | 'overview'
  | 'autopilot'
  | 'ideas'
  | 'scripts'
  | 'captions'
  | 'repurposer'
  | 'viral'
  | 'doctor'
  | 'campaigns'
  | 'calendar'
  | 'library'
  | 'brand-voice'
  | 'settings';

export type LibraryCategory =
  | 'idea'
  | 'script'
  | 'caption'
  | 'repurpose'
  | 'campaign'
  | 'autopilot'
  | 'viral'
  | 'doctor'
  | 'assistant';

export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  hook: string;
  format: string;
  audienceRelevance: string;
  cta: string;
}

export interface ScriptScene {
  sceneNumber: number;
  timeRange: string;
  visual: string;
  voiceover: string;
  transition: string;
}

export interface GeneratedScript {
  title: string;
  platform: string;
  duration: string;
  hook: string;
  fullScript: string;
  scenes: ScriptScene[];
  voiceoverNotes: string;
  visualSuggestions: string[];
  transitionSuggestions: string[];
  endingAndCta: string;
}

export interface CaptionVariation {
  style: 'Engaging' | 'Short' | 'Professional' | 'Funny' | 'Emotional';
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface RepurposedVersion {
  platform: 'Instagram Reel' | 'YouTube Shorts' | 'YouTube Description' | 'Facebook' | 'LinkedIn' | 'X';
  headline: string;
  content: string;
  structureNotes: string;
  hashtags: string[];
}

export interface ViralMetric {
  label: 'Hook Strength' | 'Relevance' | 'Clarity' | 'Engagement' | 'Storytelling' | 'CTA' | 'Structure';
  score: number;
  explanation: string;
  fix: string;
}

export interface ViralAnalysisResult {
  overallScore: number;
  summary: string;
  metrics: ViralMetric[];
  topFixes: string[];
  disclaimer: string;
}

export interface ContentDoctorChange {
  section: string;
  weakness: string;
  originalSnippet: string;
  improvedSnippet: string;
  reason: string;
}

export interface ContentDoctorResult {
  diagnosisSummary: string;
  unnecessaryWording: string[];
  improvedFullText: string;
  improvedHook: string;
  improvedCta: string;
  changes: ContentDoctorChange[];
}

export interface CampaignDayPlan {
  day: number;
  publishDate: string;
  title: string;
  format: string;
  idea: string;
  scriptOutline: string;
  caption: string;
  hashtags: string[];
}

export interface CampaignChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface CampaignPlan {
  id: string;
  title: string;
  topic: string;
  objective: string;
  audience: string;
  duration: string;
  platform: string;
  overview: string;
  status: 'Draft' | 'Active' | 'Completed';
  days: CampaignDayPlan[];
  checklist: CampaignChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export type AutopilotStepId =
  | 'preferences'
  | 'strategy'
  | 'ideas'
  | 'script'
  | 'captions'
  | 'quality'
  | 'improve'
  | 'calendar';

export interface AutopilotState {
  preferences?: {
    positioningSummary: string;
    contentPillars: string[];
    toneAlignment: string;
  };
  strategy?: {
    campaignTitle: string;
    overview: string;
    targetOutcome: string;
    cadenceRecommendation: string;
  };
  ideas?: GeneratedIdea[];
  script?: GeneratedScript;
  captions?: CaptionVariation[];
  quality?: ViralAnalysisResult;
  improve?: ContentDoctorResult;
  calendar?: {
    weeklyPlan: Array<{
      dayLabel: string;
      suggestedDate: string;
      platform: string;
      format: string;
      title: string;
      hook: string;
      caption: string;
    }>;
  };
}

export interface CreatorProfileAnalysis {
  identitySummary: string;
  writingStyle: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  note: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  category: LibraryCategory;
  title: string;
  summary: string;
  platform: string;
  tags: string[];
  payload: Record<string, unknown>;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CalendarStatus = 'Draft' | 'Planned' | 'Published';

export interface CalendarEntry {
  id: string;
  userId: string;
  title: string;
  date: string;
  timeSlot: string;
  platform: string;
  status: CalendarStatus;
  notes: string;
  reminderAt: string;
  linkedScriptId: string;
  linkedScriptTitle: string;
  linkedCaptionId: string;
  linkedCaptionTitle: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  tool: string;
  title: string;
  dateKey: string;
  createdAt: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
