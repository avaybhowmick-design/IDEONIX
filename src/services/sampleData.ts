import type {
  ActivityLog,
  BrandVoiceConfig,
  CalendarEntry,
  CampaignPlan,
  LibraryItem,
} from '../types/ideonix';

export const DEFAULT_BRAND_VOICE: BrandVoiceConfig = {
  preset: 'Storytelling',
  customDescription: 'Clear, grounded, zero-fluff pacing. Open with a visual tension hook and close with one focused question.',
  targetAudience: 'Independent creators, filmmakers, and solo builders',
  bannedWords: 'unlock, game-changer, secret hack, skyrocket',
};

function isoOffset(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export function buildSampleLibrary(userId: string): LibraryItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'sample_script_lighting',
      userId,
      category: 'script',
      title: 'One-Light Desk Setup That Looks Like a Studio',
      summary: '45-second Instagram Reel script breaking down key-light angles and negative fill.',
      platform: 'Instagram Reels',
      tags: ['lighting', 'filmmaking', 'desk-setup'],
      isSample: true,
      payload: {
        title: 'One-Light Desk Setup That Looks Like a Studio',
        platform: 'Instagram Reels',
        duration: '45s',
        hook: 'You do not need three lights to look cinematic—you need one dark wall.',
        fullScript:
          'You do not need three lights to look cinematic—you need one dark wall. Most beginners blast their desk with overhead room lights, which flattens every shadow. Instead, kill the ceiling lamp, place a single soft light 45 degrees off camera, and put a black foam board on the opposite side. That shadow contrast is what makes cheap cameras look expensive. Save this before your next shoot.',
        scenes: [
          {
            sceneNumber: 1,
            timeRange: '0:00 - 0:05',
            visual: 'Overhead room light flicks off; single side key light turns on.',
            voiceover: 'You do not need three lights to look cinematic—you need one dark wall.',
            transition: 'Hard snap cut on light switch click',
          },
          {
            sceneNumber: 2,
            timeRange: '0:05 - 0:25',
            visual: 'Overhead diagram showing 45-degree key light + black negative fill.',
            voiceover: 'Place one soft key light 45 degrees off axis and block bounce on the shadow side.',
            transition: 'Slide wipe right',
          },
          {
            sceneNumber: 3,
            timeRange: '0:25 - 0:45',
            visual: 'Split-screen before/after comparison on creator desk.',
            voiceover: 'Contrast creates depth. Save this setup checklist before your next shoot.',
            transition: 'Clean fade to end card',
          },
        ],
        voiceoverNotes: 'Calm, deliberate pacing with a 0.4s pause after the hook.',
        visualSuggestions: ['Before/after lighting toggle', 'Top-down 45-degree diagram'],
        transitionSuggestions: ['Match cut on snapping fingers', 'Light-switch sound bridge'],
        endingAndCta: 'Comment "LIGHT" if you want my gear placement diagram.',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_caption_workflow',
      userId,
      category: 'caption',
      title: 'Sunday Batching Workflow Captions',
      summary: 'Multi-tone caption variations for weekly creator batching reels.',
      platform: 'Instagram',
      tags: ['batching', 'workflow', 'consistency'],
      isSample: true,
      payload: {
        variations: [
          {
            style: 'Engaging',
            caption: 'Two focused hours on Sunday beats scrambling for ideas every Tuesday night. Here is the 4-step batching checklist I use before turning on the camera.',
            hashtags: ['#CreatorWorkflow', '#ContentBatching', '#VideoEditing', '#FilmmakingTips'],
            cta: 'Which step slows you down the most—hooks or editing?',
          },
          {
            style: 'Short',
            caption: 'Plan on Sunday. Shoot on Monday. Publish calmly all week.',
            hashtags: ['#CreatorRoutine', '#ContentStrategy'],
            cta: 'Save this for your Sunday reset.',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_idea_retention',
      userId,
      category: 'idea',
      title: 'Why 80% of Reels Lose Viewers at Second 4',
      summary: 'Retention audit breakdown showing visual resets every 3 seconds.',
      platform: 'YouTube Shorts',
      tags: ['retention', 'hooks', 'editing'],
      isSample: true,
      payload: {
        title: 'Why 80% of Reels Lose Viewers at Second 4',
        description: 'Walk through a real timeline showing why static talking-head intros drop retention and how a visual pattern interrupt fixes it.',
        hook: 'Your hook is not the problem—what happens in second four is.',
        format: 'Screen-recorded timeline breakdown',
        audienceRelevance: 'Directly solves early drop-off for solo video editors.',
        cta: 'Drop your channel niche and I will suggest a 3-second visual reset.',
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildSampleCampaigns(userId: string): CampaignPlan[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'sample_campaign_desk',
      userId,
      title: '7-Day Creator Studio Reset',
      topic: 'Building a repeatable studio filming workflow in a small room',
      objective: 'Grow saves and email newsletter signups',
      audience: 'Beginner YouTube & Instagram creators',
      duration: '7 days',
      platform: 'Instagram & YouTube',
      overview: 'A focused 7-day sprint moving from lighting fundamentals to audio, scripting, and Sunday batching.',
      status: 'Active',
      days: [
        {
          day: 1,
          publishDate: isoOffset(1),
          title: 'One-Light Desk Setup',
          format: '45s Reel',
          idea: 'Show room light vs single key light + negative fill.',
          scriptOutline: 'Hook -> Diagram -> Split comparison -> CTA',
          caption: 'One key light and a dark wall beats a $900 three-light kit.',
          hashtags: ['#StudioSetup', '#CreatorLighting'],
        },
        {
          day: 3,
          publishDate: isoOffset(3),
          title: 'Microphone Distance Test',
          format: 'YouTube Short',
          idea: 'Compare mic at 30cm vs 10cm with acoustic blanket.',
          scriptOutline: 'Blind A/B audio test -> Reveal -> Placement rule',
          caption: 'Audio quality fixes retention faster than a new camera lens.',
          hashtags: ['#AudioTips', '#YouTubeShorts'],
        },
      ],
      checklist: [
        { id: 'sc1', label: 'Lock filming angle and tape tripod floor marks', done: true },
        { id: 'sc2', label: 'Record A-roll for Days 1-3 in one batch', done: false },
        { id: 'sc3', label: 'Export vertical 9:16 + Shorts safe-zone captions', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    } as CampaignPlan & { userId: string },
  ];
}

export function buildSampleCalendar(userId: string): CalendarEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'sample_cal_1',
      userId,
      title: 'One-Light Desk Setup Reel',
      date: isoOffset(1),
      timeSlot: '18:00',
      platform: 'Instagram Reels',
      status: 'Planned',
      notes: 'Export 1080x1920 H.264. Check captions above lower third.',
      reminderAt: `${isoOffset(1)}T17:30`,
      linkedScriptId: 'sample_script_lighting',
      linkedScriptTitle: 'One-Light Desk Setup That Looks Like a Studio',
      linkedCaptionId: 'sample_caption_workflow',
      linkedCaptionTitle: 'Sunday Batching Workflow Captions',
      isSample: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_cal_2',
      userId,
      title: 'Why 80% of Reels Drop at Second 4',
      date: isoOffset(3),
      timeSlot: '11:30',
      platform: 'YouTube Shorts',
      status: 'Draft',
      notes: 'Add timeline zoom-in B-roll before exporting.',
      reminderAt: '',
      linkedScriptId: '',
      linkedScriptTitle: '',
      linkedCaptionId: '',
      linkedCaptionTitle: '',
      isSample: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildSampleActivity(userId: string): ActivityLog[] {
  const items: Array<{ offset: number; tool: string; title: string }> = [
    { offset: -5, tool: 'ideas', title: 'Retention Hooks Batch' },
    { offset: -4, tool: 'script', title: 'One-Light Desk Setup' },
    { offset: -2, tool: 'captions', title: 'Sunday Batching Captions' },
    { offset: -1, tool: 'viral', title: 'Hook Audit' },
    { offset: 0, tool: 'campaign', title: '7-Day Studio Reset' },
  ];
  return items.map((entry, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + entry.offset);
    const dateKey = d.toISOString().slice(0, 10);
    return {
      id: `sample_act_${idx}`,
      userId,
      tool: entry.tool,
      title: entry.title,
      dateKey,
      createdAt: d.toISOString(),
    };
  });
}
