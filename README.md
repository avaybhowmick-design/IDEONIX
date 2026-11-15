# IDEONIX — From Ideas to Impact

IDEONIX turns a single creator idea into a complete content strategy. Plan campaigns, generate hooks, scripts, and multi-tone captions, repurpose across six platforms, analyze structural quality, refine drafts with Content Doctor, and organize your publishing calendar inside one dark Liquid Glass workspace.

## Core Features

- **Creator Autopilot**: 8-step autonomous workflow (`Preferences -> Strategy -> Ideas -> Flagship Script -> Captions -> Quality Audit -> Content Doctor -> Weekly Plan`) driven by live sequential Gemini API calls, with individual step regeneration and one-click saving to Library & Calendar.
- **AI Idea Generator**: Niche, topic, audience, platform, style, language, and count inputs with inline editing, copy, regenerate, and save.
- **Script Studio**: Full spoken script, timed scene-by-scene breakdown, voiceover notes, visual & transition suggestions, and per-section regeneration.
- **Caption Studio**: Engaging, Short, Professional, Funny, and Emotional caption variations with hashtags and CTAs.
- **Content Repurposer**: Adapts one script or article into Instagram Reel, YouTube Shorts, YouTube Description, Facebook, LinkedIn, and X formats.
- **Viral Analyzer**: 7-dimension structural quality score (`Hook Strength`, `Relevance`, `Clarity`, `Engagement`, `Storytelling`, `CTA`, `Structure`) with actionable fixes and clear disclaimer (`AI-generated estimate, not a prediction or guarantee of virality.`).
- **Content Doctor**: Side-by-side Original vs. Improved editor highlighting filler wording and weak sections.
- **Campaign Studio & Content Calendar**: Multi-day timelines, toggleable checklists, Month/Week/Day calendar views, Draft/Planned/Published statuses, reminders, and linked scripts/captions (planning & reminders only; no external auto-publishing).
- **Brand Voice & Creator Profile Analyzer**: Presets (`Cinematic`, `Professional`, `Funny`, `Minimal`, `Educational`, `Storytelling`, `Bold`, `Friendly`) + custom rules auto-applied to all generations, plus positioning audits without fabricated metrics.
- **Global AI Creator Assistant**: Context-aware drawer on every dashboard page with Copy and Save to Library actions.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (`motion`), Lucide React
- **Backend**: Node.js, Express, TypeScript (`@google/genai` server-side only)
- **Auth & Database**: Firebase Authentication (Google Sign-In popup/redirect + Email/Password + password reset) and Cloud Firestore (`firebase-applet-config.json`, `firestore.rules`), with an optional clearly labeled Local Demo Mode (`localStorage`).

## Installation & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your secrets:
   ```bash
   cp .env.example .env
   ```
   - `GEMINI_API_KEY`: Required for server-side Gemini API calls (`/api/ai/*`).
   - `APP_URL`: App base URL (`http://localhost:3000` locally).
3. Start the full-stack server on port 3000:
   ```bash
   npm run dev
   ```
4. Run unit tests, TypeScript checks, and production build:
   ```bash
   npx tsx --test src/utils/creatorHelpers.test.ts
   npm run lint
   npm run build
   ```

## Firebase Console Checklist

To verify Firebase Authentication in production and local environments:

1. **Authentication > Sign-in method**:
   - Ensure **Google** provider is enabled.
   - Enable **Email/Password** provider (required for email login, registration, and `sendPasswordResetEmail`).
2. **Authentication > Settings > Authorized domains**:
   - Ensure `localhost` and your hosted Cloud Run / preview domain are listed.
3. **Firestore Rules**:
   - Deploy `firestore.rules` (already provisioned and deployed via `firebase-blueprint.json` + `firestore.rules`). Note that Firestore writes enforce `request.auth.token.email_verified == true`.

## Deployment

Build the client bundle and start the Express server:

```bash
npm run build
npm run start
```
