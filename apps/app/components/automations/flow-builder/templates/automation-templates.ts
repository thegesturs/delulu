import type { NodePositions } from "../hooks/use-automation-state";
import type {
  AutomationStep,
  AutomationTriggerType,
  Note,
} from "../utils/flow-types";
import { createConditionStep, createSendDmStep } from "../utils/step-helpers";

export interface AutomationTemplate {
  slug: string;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  stepCount: number;
  buildSteps: () => {
    steps: AutomationStep[];
    firstStepId: string;
    notes: Note[];
    nodePositions: NodePositions;
  };
}

// ─── 1. Grow Followers (Comments) ──────────────────────────────────────────
function buildGrowFollowersComments() {
  const condition = createConditionStep({ operator: "is_follower" });
  const dmYes = createSendDmStep({
    messageTemplate: "Thanks for following! Here's your exclusive content:",
    buttons: [
      {
        type: "url",
        title: "Get Content",
        url: "https://example.com/content",
      },
    ],
  });
  const dmNo = createSendDmStep({
    messageTemplate:
      "Hey! Follow us first to unlock this exclusive content, then tap the button below.",
    buttons: [
      {
        type: "quick_reply",
        title: "I'm following!",
        payload: "check_follow",
        nextStepId: condition.id,
      },
    ],
  });

  condition.yesStepId = dmYes.id;
  condition.noStepId = dmNo.id;

  const steps: AutomationStep[] = [condition, dmYes, dmNo];

  const notes: Note[] = [
    {
      id: "note_gfc_1",
      content:
        "This automation checks if commenters are followers. Non-followers are asked to follow first, creating a loop until they do.",
      position: { x: 500, y: 0 },
    },
    {
      id: "note_gfc_2",
      content:
        'The "I\'m following!" button loops back to re-check follower status.',
      position: { x: 500, y: 340 },
    },
  ];

  const nodePositions: NodePositions = {
    [condition.id]: { x: 0, y: 160 },
    [dmYes.id]: { x: -170, y: 340 },
    [dmNo.id]: { x: 170, y: 340 },
    note_gfc_1: { x: 500, y: 0 },
    note_gfc_2: { x: 500, y: 340 },
  };

  return { steps, firstStepId: condition.id, notes, nodePositions };
}

// ─── 2. Grow Followers (Stories) ───────────────────────────────────────────
function buildGrowFollowersStories() {
  const condition = createConditionStep({ operator: "is_follower" });
  const dmYes = createSendDmStep({
    messageTemplate:
      "Thanks for being a follower! Here's something special for you:",
    buttons: [
      {
        type: "url",
        title: "Exclusive Link",
        url: "https://example.com/exclusive",
      },
    ],
  });
  const dmNo = createSendDmStep({
    messageTemplate:
      "Hey! Follow us to unlock exclusive content, then tap below.",
    buttons: [
      {
        type: "quick_reply",
        title: "I'm following!",
        payload: "check_follow_story",
        nextStepId: condition.id,
      },
    ],
  });

  condition.yesStepId = dmYes.id;
  condition.noStepId = dmNo.id;

  const steps: AutomationStep[] = [condition, dmYes, dmNo];

  const notes: Note[] = [
    {
      id: "note_gfs_1",
      content:
        "Story reply trigger: checks if the replier follows you. Great for growing your follower count from story engagement.",
      position: { x: 500, y: 0 },
    },
  ];

  const nodePositions: NodePositions = {
    [condition.id]: { x: 0, y: 160 },
    [dmYes.id]: { x: -170, y: 340 },
    [dmNo.id]: { x: 170, y: 340 },
    note_gfs_1: { x: 500, y: 0 },
  };

  return { steps, firstStepId: condition.id, notes, nodePositions };
}

// ─── 3. Email Collection ───────────────────────────────────────────────────
function buildEmailCollection() {
  const condition = createConditionStep({ operator: "has_email" });
  const dmYes = createSendDmStep({
    messageTemplate: "You're all set! Here's your content:",
    buttons: [
      {
        type: "url",
        title: "Download Now",
        url: "https://example.com/download",
      },
    ],
  });
  const dmNo = createSendDmStep({
    messageTemplate:
      "Reply with your email address to get instant access to the content!",
  });

  condition.yesStepId = dmYes.id;
  condition.noStepId = dmNo.id;

  const steps: AutomationStep[] = [condition, dmYes, dmNo];

  const notes: Note[] = [
    {
      id: "note_ec_1",
      content:
        "Collects emails from commenters. Users without an email on file are asked to reply with theirs. Once stored, they get the content link.",
      position: { x: 500, y: 0 },
    },
  ];

  const nodePositions: NodePositions = {
    [condition.id]: { x: 0, y: 160 },
    [dmYes.id]: { x: -170, y: 340 },
    [dmNo.id]: { x: 170, y: 340 },
    note_ec_1: { x: 500, y: 0 },
  };

  return { steps, firstStepId: condition.id, notes, nodePositions };
}

// ─── 4. Lead Magnet ────────────────────────────────────────────────────────
function buildLeadMagnet() {
  const dm = createSendDmStep({
    messageTemplate: "Here's what you asked for! Tap the link below:",
    buttons: [
      {
        type: "url",
        title: "Get It Now",
        url: "https://example.com/lead-magnet",
      },
    ],
  });

  const steps: AutomationStep[] = [dm];

  const notes: Note[] = [
    {
      id: "note_lm_1",
      content:
        "Simple lead magnet delivery: anyone who comments gets a DM with the download link. Update the URL button with your actual link.",
      position: { x: 500, y: 0 },
    },
  ];

  const nodePositions: NodePositions = {
    [dm.id]: { x: 0, y: 160 },
    note_lm_1: { x: 500, y: 0 },
  };

  return { steps, firstStepId: dm.id, notes, nodePositions };
}

// ─── 5. Story Engagement ───────────────────────────────────────────────────
function buildStoryEngagement() {
  const dm = createSendDmStep({
    messageTemplate:
      "Thanks for replying to my story! Here's a special link just for you:",
    buttons: [
      {
        type: "url",
        title: "Special Link",
        url: "https://example.com/story-bonus",
      },
    ],
  });

  const steps: AutomationStep[] = [dm];

  const notes: Note[] = [
    {
      id: "note_se_1",
      content:
        "Rewards story replies with a DM containing a special link. Great for driving traffic from stories.",
      position: { x: 500, y: 0 },
    },
  ];

  const nodePositions: NodePositions = {
    [dm.id]: { x: 0, y: 160 },
    note_se_1: { x: 500, y: 0 },
  };

  return { steps, firstStepId: dm.id, notes, nodePositions };
}

// ─── Template Registry ─────────────────────────────────────────────────────

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    slug: "grow-followers-comments",
    name: "Grow Followers",
    description:
      "Check if commenters follow you, then loop until they do to unlock content.",
    triggerType: "COMMENT",
    stepCount: 3,
    buildSteps: buildGrowFollowersComments,
  },
  {
    slug: "grow-followers-stories",
    name: "Grow Followers (Stories)",
    description: "Same follower-check loop but triggered by story replies.",
    triggerType: "STORY_REPLY",
    stepCount: 3,
    buildSteps: buildGrowFollowersStories,
  },
  {
    slug: "email-collection",
    name: "Email Collection",
    description: "Collect emails from commenters before delivering content.",
    triggerType: "COMMENT",
    stepCount: 3,
    buildSteps: buildEmailCollection,
  },
  {
    slug: "lead-magnet",
    name: "Lead Magnet",
    description: "Send a download link to anyone who comments on your post.",
    triggerType: "COMMENT",
    stepCount: 1,
    buildSteps: buildLeadMagnet,
  },
  {
    slug: "story-engagement",
    name: "Story Engagement",
    description: "Reward story replies with a special link via DM.",
    triggerType: "STORY_REPLY",
    stepCount: 1,
    buildSteps: buildStoryEngagement,
  },
];

export function getTemplateBySlug(
  slug: string
): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((t) => t.slug === slug);
}
