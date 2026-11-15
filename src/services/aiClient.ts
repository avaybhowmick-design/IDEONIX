import type {
  AutopilotStepId,
  BrandVoiceConfig,
  CampaignChecklistItem,
  CampaignDayPlan,
  CaptionVariation,
  ContentDoctorResult,
  CreatorProfileAnalysis,
  GeneratedIdea,
  GeneratedScript,
  RepurposedVersion,
  ViralAnalysisResult,
} from '../types/ideonix';

async function postAi<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string } & T;
    if (res.ok) {
      return data;
    }

    if (attempt === 0 && (res.status === 429 || res.status === 503)) {
      const retryAfterSec = Number(res.headers.get('Retry-After') || '0');
      const delayMs =
        Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? Math.min(retryAfterSec * 1000, 4000)
          : 2000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  throw new Error('AI request failed after retry.');
}

export async function checkApiHealth(): Promise<{ ok: boolean; aiConfigured: boolean }> {
  const res = await fetch('/api/health');
  if (!res.ok) return { ok: false, aiConfigured: false };
  return res.json();
}

export async function generateIdeasApi(params: {
  niche: string;
  topic: string;
  audience: string;
  platform: string;
  style: string;
  language: string;
  count: number;
  brandVoice: BrandVoiceConfig;
}): Promise<GeneratedIdea[]> {
  const res = await postAi<{ ideas: GeneratedIdea[] }>('/api/ai/ideas', params);
  return res.ideas;
}

export async function generateScriptApi(params: {
  topic: string;
  platform: string;
  duration: string;
  tone: string;
  audience: string;
  language: string;
  brandVoice: BrandVoiceConfig;
  regenerateSection?: string;
  existingScriptJson?: string;
}): Promise<GeneratedScript> {
  const res = await postAi<{ script: GeneratedScript }>('/api/ai/script', params);
  return res.script;
}

export async function generateCaptionsApi(params: {
  topic: string;
  context: string;
  platform: string;
  language: string;
  brandVoice: BrandVoiceConfig;
}): Promise<CaptionVariation[]> {
  const res = await postAi<{ variations: CaptionVariation[] }>('/api/ai/captions', params);
  return res.variations;
}

export async function repurposeContentApi(params: {
  sourceText: string;
  goal: string;
  brandVoice: BrandVoiceConfig;
}): Promise<RepurposedVersion[]> {
  const res = await postAi<{ versions: RepurposedVersion[] }>('/api/ai/repurpose', params);
  return res.versions;
}

export async function analyzeViralApi(params: {
  title: string;
  content: string;
  platform: string;
  audience: string;
  brandVoice: BrandVoiceConfig;
}): Promise<ViralAnalysisResult> {
  const res = await postAi<{ analysis: ViralAnalysisResult }>('/api/ai/viral-analyze', params);
  return res.analysis;
}

export async function runContentDoctorApi(params: {
  content: string;
  platform: string;
  goal: string;
  brandVoice: BrandVoiceConfig;
}): Promise<ContentDoctorResult> {
  const res = await postAi<{ report: ContentDoctorResult }>('/api/ai/content-doctor', params);
  return res.report;
}

export async function generateCampaignApi(params: {
  topic: string;
  objective: string;
  audience: string;
  durationDays: number;
  platform: string;
  startDate: string;
  brandVoice: BrandVoiceConfig;
}): Promise<{
  title: string;
  overview: string;
  days: CampaignDayPlan[];
  checklist: CampaignChecklistItem[];
}> {
  const res = await postAi<{
    campaign: {
      title: string;
      overview: string;
      days: CampaignDayPlan[];
      checklist: CampaignChecklistItem[];
    };
  }>('/api/ai/campaign', params);
  return res.campaign;
}

export async function runAutopilotStepApi<T>(params: {
  step: AutopilotStepId;
  niche: string;
  topic: string;
  audience: string;
  platform: string;
  duration: string;
  goals: string;
  brandVoice: BrandVoiceConfig;
  context: Record<string, unknown>;
}): Promise<T> {
  const res = await postAi<{ step: AutopilotStepId; result: T }>('/api/ai/autopilot/step', params);
  return res.result;
}

export async function analyzeCreatorProfileApi(params: {
  niche: string;
  platform: string;
  bio: string;
  sampleCaptions: string;
  brandVoice: BrandVoiceConfig;
}): Promise<CreatorProfileAnalysis> {
  const res = await postAi<{ analysis: CreatorProfileAnalysis }>('/api/ai/profile-analyze', params);
  return res.analysis;
}

export async function sendAssistantMessageApi(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  brandVoice: BrandVoiceConfig;
  activeCampaignTitle?: string;
  activeCampaignOverview?: string;
  librarySummary?: string;
  currentPage: string;
}): Promise<string> {
  const res = await postAi<{ reply: string }>('/api/ai/assistant', params);
  return res.reply;
}
