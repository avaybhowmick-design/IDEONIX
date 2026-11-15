import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ThinkingLevel } from '@google/genai';
import {
  AiServiceError,
  generateChatReply,
  generateStructuredJson,
} from './server/gemini.ts';
import {
  autopilotSchemas,
  campaignPrompt,
  captionsPrompt,
  contentDoctorPrompt,
  formatBrandVoiceContext,
  ideasPrompt,
  profileAnalyzerPrompt,
  repurposePrompt,
  scriptPrompt,
  viralAnalyzerPrompt,
} from './server/prompts/creatorPrompts.ts';
import { TokenBucketRateLimiter } from './server/rateLimit.ts';
import { boundedInt, optionalString, requireNonEmptyString, ValidationError } from './server/validation.ts';
import type {
  AutopilotStepId,
  BrandVoiceConfig,
  CaptionVariation,
  ContentDoctorResult,
  CreatorProfileAnalysis,
  GeneratedIdea,
  GeneratedScript,
  RepurposedVersion,
  ViralAnalysisResult,
} from './src/types/ideonix.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isCloudRunOrProdEnv =
  process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE);

// 40 AI requests per minute per client IP
const aiLimiter = new TokenBucketRateLimiter(40, 60_000);

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const result = aiLimiter.consume(clientIp);
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSeconds));
    res.status(429).json({
      error: `Too many AI requests. Please wait ${result.retryAfterSeconds}s before trying again.`,
      code: 'RATE_LIMIT_EXCEEDED',
    });
    return;
  }
  next();
}

function handleRouteError(res: Response, err: unknown) {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof AiServiceError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  const msg = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ error: msg, code: 'INTERNAL_ERROR' });
}

function getBrandVoice(body: Record<string, unknown>): Partial<BrandVoiceConfig> | undefined {
  if (body.brandVoice && typeof body.brandVoice === 'object') {
    return body.brandVoice as Partial<BrandVoiceConfig>;
  }
  return undefined;
}

export async function createApp(httpServer?: http.Server) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const key = process.env.GEMINI_API_KEY?.trim();
    const aiConfigured = Boolean(key && key !== 'MY_GEMINI_API_KEY');
    res.json({
      ok: true,
      service: 'IDEONIX API',
      aiConfigured,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/ai/ideas', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const niche = requireNonEmptyString(body.niche, 'Niche', 160);
      const topic = requireNonEmptyString(body.topic, 'Topic', 300);
      const audience = requireNonEmptyString(body.audience, 'Audience', 200);
      const platform = optionalString(body.platform, 'Instagram Reels', 80);
      const style = optionalString(body.style, 'Educational & Story-led', 80);
      const language = optionalString(body.language, 'English', 60);
      const count = boundedInt(body.count, 5, 1, 10);
      const brandVoice = getBrandVoice(body);

      const data = await generateStructuredJson<{ ideas: Omit<GeneratedIdea, 'id'>[] }>({
        systemInstruction: ideasPrompt.system(brandVoice),
        prompt: ideasPrompt.buildPrompt({ niche, topic, audience, platform, style, language, count }),
        responseSchema: ideasPrompt.schema,
        thinkingLevel: ThinkingLevel.LOW,
      });

      const ideas: GeneratedIdea[] = (data.ideas || []).map((idea, idx) => ({
        id: `idea_${Date.now()}_${idx}`,
        ...idea,
      }));

      res.json({ ideas });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/script', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const topic = requireNonEmptyString(body.topic, 'Topic', 400);
      const platform = optionalString(body.platform, 'Instagram Reels', 80);
      const duration = optionalString(body.duration, '45-60 seconds', 60);
      const tone = optionalString(body.tone, 'Engaging & Clear', 80);
      const audience = optionalString(body.audience, 'Ambitious creators', 200);
      const language = optionalString(body.language, 'English', 60);
      const regenerateSection = optionalString(body.regenerateSection, '', 60);
      const existingScriptJson = optionalString(body.existingScriptJson, '', 12000);
      const brandVoice = getBrandVoice(body);

      const script = await generateStructuredJson<GeneratedScript>({
        systemInstruction: scriptPrompt.system(brandVoice),
        prompt: scriptPrompt.buildPrompt({
          topic,
          platform,
          duration,
          tone,
          audience,
          language,
          regenerateSection: regenerateSection || undefined,
          existingScriptJson: existingScriptJson || undefined,
        }),
        responseSchema: scriptPrompt.schema,
        thinkingLevel: ThinkingLevel.MEDIUM,
      });

      res.json({ script });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/captions', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const topic = requireNonEmptyString(body.topic, 'Topic', 400);
      const context = optionalString(body.context, '', 3000);
      const platform = optionalString(body.platform, 'Instagram', 80);
      const language = optionalString(body.language, 'English', 60);
      const brandVoice = getBrandVoice(body);

      const data = await generateStructuredJson<{ variations: CaptionVariation[] }>({
        systemInstruction: captionsPrompt.system(brandVoice),
        prompt: captionsPrompt.buildPrompt({ topic, context, platform, language }),
        responseSchema: captionsPrompt.schema,
        thinkingLevel: ThinkingLevel.LOW,
      });

      res.json({ variations: data.variations || [] });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/repurpose', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const sourceText = requireNonEmptyString(body.sourceText, 'Source script or article', 10000);
      const goal = optionalString(body.goal, 'Cross-platform reach and clarity', 300);
      const brandVoice = getBrandVoice(body);

      const data = await generateStructuredJson<{ versions: RepurposedVersion[] }>({
        systemInstruction: repurposePrompt.system(brandVoice),
        prompt: repurposePrompt.buildPrompt({ sourceText, goal }),
        responseSchema: repurposePrompt.schema,
        thinkingLevel: ThinkingLevel.MEDIUM,
      });

      res.json({ versions: data.versions || [] });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/viral-analyze', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const title = optionalString(body.title, 'Untitled Draft', 300);
      const content = requireNonEmptyString(body.content, 'Script or caption content', 10000);
      const platform = optionalString(body.platform, 'Instagram Reels', 80);
      const audience = optionalString(body.audience, 'Creators & Builders', 200);
      const brandVoice = getBrandVoice(body);

      const analysis = await generateStructuredJson<Omit<ViralAnalysisResult, 'disclaimer'>>({
        systemInstruction: viralAnalyzerPrompt.system(brandVoice),
        prompt: viralAnalyzerPrompt.buildPrompt({ title, content, platform, audience }),
        responseSchema: viralAnalyzerPrompt.schema,
        thinkingLevel: ThinkingLevel.MEDIUM,
      });

      res.json({
        analysis: {
          ...analysis,
          disclaimer: 'AI-generated estimate, not a prediction or guarantee of virality.',
        },
      });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/content-doctor', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const content = requireNonEmptyString(body.content, 'Draft content', 10000);
      const platform = optionalString(body.platform, 'YouTube Shorts', 80);
      const goal = optionalString(body.goal, 'Tighter hook, higher clarity, stronger CTA', 300);
      const brandVoice = getBrandVoice(body);

      const report = await generateStructuredJson<ContentDoctorResult>({
        systemInstruction: contentDoctorPrompt.system(brandVoice),
        prompt: contentDoctorPrompt.buildPrompt({ content, platform, goal }),
        responseSchema: contentDoctorPrompt.schema,
        thinkingLevel: ThinkingLevel.MEDIUM,
      });

      res.json({ report });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/campaign', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const topic = requireNonEmptyString(body.topic, 'Campaign topic', 300);
      const objective = requireNonEmptyString(body.objective, 'Campaign objective', 300);
      const audience = requireNonEmptyString(body.audience, 'Target audience', 200);
      const durationDays = boundedInt(body.durationDays, 7, 3, 14);
      const platform = optionalString(body.platform, 'Instagram & YouTube', 80);
      const startDate = optionalString(body.startDate, new Date().toISOString().slice(0, 10), 20);
      const brandVoice = getBrandVoice(body);

      const raw = await generateStructuredJson<{
        title: string;
        overview: string;
        days: Array<{
          day: number;
          publishDate: string;
          title: string;
          format: string;
          idea: string;
          scriptOutline: string;
          caption: string;
          hashtags: string[];
        }>;
        checklist: string[];
      }>({
        systemInstruction: campaignPrompt.system(brandVoice),
        prompt: campaignPrompt.buildPrompt({
          topic,
          objective,
          audience,
          durationDays,
          platform,
          startDate,
        }),
        responseSchema: campaignPrompt.schema,
        thinkingLevel: ThinkingLevel.MEDIUM,
      });

      res.json({
        campaign: {
          title: raw.title,
          overview: raw.overview,
          days: raw.days || [],
          checklist: (raw.checklist || []).map((label, idx) => ({
            id: `chk_${Date.now()}_${idx}`,
            label,
            done: false,
          })),
        },
      });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/autopilot/step', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const step = requireNonEmptyString(body.step, 'Autopilot step', 40) as AutopilotStepId;
      const validSteps: AutopilotStepId[] = [
        'preferences',
        'strategy',
        'ideas',
        'script',
        'captions',
        'quality',
        'improve',
        'calendar',
      ];
      if (!validSteps.includes(step)) {
        throw new ValidationError(`Unsupported autopilot step "${step}".`);
      }

      const niche = requireNonEmptyString(body.niche, 'Niche', 160);
      const topic = requireNonEmptyString(body.topic, 'Topic', 300);
      const audience = requireNonEmptyString(body.audience, 'Audience', 200);
      const platform = optionalString(body.platform, 'Instagram Reels & YouTube Shorts', 80);
      const duration = optionalString(body.duration, '7 days', 60);
      const goals = requireNonEmptyString(body.goals, 'Goals', 400);
      const brandVoice = getBrandVoice(body);
      const context = (body.context && typeof body.context === 'object' ? body.context : {}) as Record<string, unknown>;
      const startDate = new Date().toISOString().slice(0, 10);

      const sysBase = `You are IDEONIX Creator Autopilot executing step "${step}" of an autonomous end-to-end creator workflow. Build directly on prior step context.\n\n${formatBrandVoiceContext(brandVoice)}`;

      let prompt = '';
      if (step === 'preferences') {
        prompt = `Synthesize creator preferences and content pillars.\nNiche: ${niche}\nTopic: ${topic}\nAudience: ${audience}\nPlatform: ${platform}\nCampaign Duration: ${duration}\nGoals: ${goals}`;
      } else if (step === 'strategy') {
        prompt = `Define the overarching campaign strategy using these preferences:\n${JSON.stringify(context.preferences || {})}\nTopic: ${topic}\nAudience: ${audience}\nPlatform: ${platform}\nDuration: ${duration}\nGoals: ${goals}`;
      } else if (step === 'ideas') {
        prompt = ideasPrompt.buildPrompt({
          niche,
          topic: `${topic} — Strategy context: ${JSON.stringify(context.strategy || {})}`,
          audience,
          platform,
          style: String(brandVoice?.preset || 'Storytelling'),
          language: 'English',
          count: 4,
        });
      } else if (step === 'script') {
        const leadIdea = Array.isArray(context.ideas) && context.ideas[0] ? context.ideas[0] : { title: topic };
        prompt = scriptPrompt.buildPrompt({
          topic: `${topic} (Lead angle: ${JSON.stringify(leadIdea)})`,
          platform,
          duration: '45-60 seconds',
          tone: String(brandVoice?.preset || 'Storytelling'),
          audience,
          language: 'English',
        });
      } else if (step === 'captions') {
        const scriptSummary = context.script ? JSON.stringify(context.script).slice(0, 2200) : topic;
        prompt = captionsPrompt.buildPrompt({
          topic,
          context: `Based on flagship script:\n${scriptSummary}`,
          platform,
          language: 'English',
        });
      } else if (step === 'quality') {
        const draft = context.script
          ? `${(context.script as GeneratedScript).hook}\n\n${(context.script as GeneratedScript).fullScript}`
          : topic;
        prompt = viralAnalyzerPrompt.buildPrompt({
          title: (context.script as GeneratedScript | undefined)?.title || topic,
          content: draft,
          platform,
          audience,
        });
      } else if (step === 'improve') {
        const draft = context.script
          ? `${(context.script as GeneratedScript).hook}\n\n${(context.script as GeneratedScript).fullScript}`
          : topic;
        prompt = contentDoctorPrompt.buildPrompt({
          content: draft,
          platform,
          goal: `Address quality findings: ${JSON.stringify(context.quality || {}).slice(0, 1400)}`,
        });
      } else if (step === 'calendar') {
        prompt = `Create a cohesive weekly publishing plan starting ${startDate} for ${duration} on ${platform}.\nTopic: ${topic}\nGoals: ${goals}\nStrategy: ${JSON.stringify(context.strategy || {}).slice(0, 1200)}\nIdeas: ${JSON.stringify(context.ideas || []).slice(0, 1600)}\nProduce 5-7 scheduled posts with dayLabel (e.g. "Day 1"), suggestedDate (YYYY-MM-DD), platform, format, title, hook, and ready-to-post caption.`;
      }

      const raw = await generateStructuredJson<Record<string, unknown>>({
        systemInstruction: sysBase,
        prompt,
        responseSchema: autopilotSchemas[step],
        thinkingLevel: step === 'strategy' || step === 'script' || step === 'improve' ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW,
      });

      let result: unknown = raw;
      if (step === 'ideas' && Array.isArray(raw.ideas)) {
        result = raw.ideas.map((item: Record<string, unknown>, idx: number) => ({
          id: `auto_idea_${Date.now()}_${idx}`,
          ...item,
        }));
      } else if (step === 'captions' && Array.isArray(raw.variations)) {
        result = raw.variations;
      } else if (step === 'quality') {
        result = {
          ...raw,
          disclaimer: 'AI-generated estimate, not a prediction or guarantee of virality.',
        };
      }

      res.json({ step, result });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/profile-analyze', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const niche = requireNonEmptyString(body.niche, 'Niche', 200);
      const platform = optionalString(body.platform, 'Instagram & YouTube', 80);
      const bio = optionalString(body.bio, '', 1000);
      const sampleCaptions = requireNonEmptyString(body.sampleCaptions, 'Sample captions or scripts', 8000);
      const brandVoice = getBrandVoice(body);

      const analysis = await generateStructuredJson<CreatorProfileAnalysis>({
        systemInstruction: profileAnalyzerPrompt.system(brandVoice),
        prompt: profileAnalyzerPrompt.buildPrompt({ niche, platform, bio, sampleCaptions }),
        responseSchema: profileAnalyzerPrompt.schema,
        thinkingLevel: ThinkingLevel.MEDIUM,
      });

      res.json({ analysis });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.post('/api/ai/assistant', rateLimitMiddleware, async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const message = requireNonEmptyString(body.message, 'Message', 2000);
      const history = Array.isArray(body.history)
        ? (body.history as Array<{ role: 'user' | 'assistant'; text: string }>)
        : [];
      const brandVoice = getBrandVoice(body);
      const activeCampaignTitle = optionalString(body.activeCampaignTitle, '', 200);
      const activeCampaignOverview = optionalString(body.activeCampaignOverview, '', 1200);
      const librarySummary = optionalString(body.librarySummary, '', 2000);
      const currentPage = optionalString(body.currentPage, 'overview', 60);

      const systemInstruction = `You are the IDEONIX AI Creator Assistant. Give crisp, immediately usable creator strategy, hooks, edits, and publishing advice. Never invent fake follower counts or analytics.

Current Dashboard Page: ${currentPage}
${formatBrandVoiceContext(brandVoice)}
${activeCampaignTitle ? `Active Campaign: ${activeCampaignTitle}\nOverview: ${activeCampaignOverview}` : 'No active campaign selected.'}
${librarySummary ? `Creator Saved Library Context:\n${librarySummary}` : 'Saved library is currently empty.'}`;

      const reply = await generateChatReply({
        systemInstruction,
        history,
        message,
      });

      res.json({ reply });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found.', code: 'NOT_FOUND' });
  });

  let viteModule: typeof import('vite') | null = null;
  if (!isCloudRunOrProdEnv) {
    try {
      viteModule = await import('vite');
    } catch {
      viteModule = null;
    }
  }

  if (isCloudRunOrProdEnv || !viteModule) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        maxAge: '1h',
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = viteModule;
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(httpServer
          ? {
              hmr: disableHmr ? false : { server: httpServer },
              ws: { server: httpServer },
            }
          : {}),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const httpServer = http.createServer();
  createApp(httpServer)
    .then((app) => {
      httpServer.on('request', app);
      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`IDEONIX server listening on http://0.0.0.0:${PORT}`);
      });

      const shutdown = (signal: string) => {
        console.log(`Received ${signal}, shutting down IDEONIX server...`);
        httpServer.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 8000).unref();
      };
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      console.error('Failed to start IDEONIX server:', err);
      process.exit(1);
    });
}
