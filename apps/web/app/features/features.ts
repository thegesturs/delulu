import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  Eye,
  MessagesSquare,
  Send,
  Users,
  Workflow,
} from "lucide-react";
import type { IconType } from "react-icons";
import { FaInstagram } from "react-icons/fa";

export interface FeatureQuestion {
  readonly question: string;
  readonly answer: string;
}

export interface FeatureSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

interface FeatureIntegration {
  readonly slug:
    | "instagram"
    | "facebook"
    | "linkedin"
    | "tiktok"
    | "youtube"
    | "threads";
  readonly name: string;
}

export interface Feature {
  readonly slug: string;
  readonly job:
    | "Create"
    | "Plan"
    | "Schedule"
    | "Automate"
    | "Collaborate"
    | "Analyze";
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly description: string;
  readonly icon: LucideIcon | IconType;
  readonly iconClassName?: string;
  readonly outcome: string;
  readonly workflow: readonly {
    readonly title: string;
    readonly description: string;
  }[];
  readonly capabilities: readonly string[];
  readonly audience: readonly string[];
  readonly examples: readonly string[];
  readonly sections: readonly FeatureSection[];
  readonly requirements: readonly string[];
  readonly questions: readonly FeatureQuestion[];
  readonly related: readonly string[];
  readonly integrations: readonly FeatureIntegration[];
}

const publishingIntegrations = [
  { slug: "instagram", name: "Instagram" },
  { slug: "facebook", name: "Facebook" },
  { slug: "linkedin", name: "LinkedIn" },
  { slug: "tiktok", name: "TikTok" },
  { slug: "youtube", name: "YouTube" },
  { slug: "threads", name: "Threads" },
] as const satisfies readonly FeatureIntegration[];

const videoIntegrations = publishingIntegrations.filter(({ slug }) =>
  ["instagram", "facebook", "tiktok", "youtube"].includes(slug)
);

const instagramIntegration = publishingIntegrations.filter(
  ({ slug }) => slug === "instagram"
);

export const features = [
  {
    slug: "multi-platform-publishing",
    job: "Create",
    title: "Multi-platform social publishing",
    eyebrow: "Publish once, adapt where it matters",
    summary:
      "Create one campaign and publish it across connected social accounts without rebuilding the post for every network.",
    description:
      "Create, tailor, schedule, and publish social posts across Instagram, Facebook, X, LinkedIn, TikTok, Pinterest, Threads, YouTube, Bluesky, and Farcaster from Delulu.",
    icon: Send,
    outcome:
      "A single publishing workflow for teams and creators who manage several networks but still need control over each destination.",
    workflow: [
      {
        title: "Connect accounts",
        description: "Add the social profiles you are authorized to manage.",
      },
      {
        title: "Build the post",
        description:
          "Write the shared message, add media, and choose the destination accounts.",
      },
      {
        title: "Adjust and publish",
        description:
          "Review network settings, publish now, save a draft, or choose a future time.",
      },
    ],
    capabilities: [
      "Select multiple connected accounts for one post",
      "Publish text, images, and supported video formats",
      "Set network-specific options such as visibility, replies, boards, and video privacy",
      "Save drafts and return to scheduled or published posts",
      "See failures in the post list instead of losing the entire campaign",
    ],
    audience: [
      "Solo creators with several profiles",
      "Social media managers",
      "Small teams publishing for a brand",
    ],
    examples: [
      "Launch a product update on LinkedIn, X, Threads, and Bluesky from one draft.",
      "Schedule the same short video for Instagram, TikTok, and YouTube with destination-specific settings.",
      "Publish a company announcement to multiple brand accounts while retaining one place to track it.",
    ],
    sections: [
      {
        title: "One campaign, separate destinations",
        paragraphs: [
          "Cross-posting saves time only when it does not erase the differences between networks. Delulu starts with shared content, then keeps destination settings available before anything is sent.",
          "The result is a faster workflow with a deliberate review step: account selection, media compatibility, publishing time, and platform controls remain visible.",
        ],
      },
    ],
    requirements: [
      "Each destination requires a connected social account and the permissions requested by that network.",
      "Media limits and publishing options vary by network; Delulu validates supported formats but cannot override platform rules.",
      "A provider outage or expired connection can cause one destination to fail even when others succeed.",
    ],
    questions: [
      {
        question: "Which social networks can I publish to?",
        answer:
          "The current composer supports Instagram, Facebook, X, LinkedIn, TikTok, Pinterest, Threads, YouTube, Bluesky, and Farcaster. Available post types and controls differ by network.",
      },
      {
        question: "Does every account receive identical content?",
        answer:
          "You can begin with shared content, then use network-specific content and settings where the destination needs a different message or format.",
      },
      {
        question: "Can I publish immediately or schedule the post?",
        answer:
          "Both are supported. You can publish now, save a draft, or set a future date and time.",
      },
      {
        question: "What happens if one network rejects the post?",
        answer:
          "Publishing status is tracked per post so a destination-specific failure can be identified and handled without pretending the entire campaign succeeded.",
      },
    ],
    related: [
      "platform-specific-content",
      "social-media-scheduling",
      "content-calendar",
    ],
    integrations: publishingIntegrations,
  },
  {
    slug: "platform-specific-content",
    job: "Create",
    title: "Platform-specific content and previews",
    eyebrow: "See and shape each destination",
    summary:
      "Start with a shared post, then tailor copy, media, and publishing controls for the networks that need a different treatment.",
    description:
      "Tailor social post copy and settings by network, then review visual previews for major platforms before publishing with Delulu.",
    icon: Eye,
    outcome:
      "Fewer avoidable publishing mistakes and content that feels intentional on each network rather than blindly duplicated.",
    workflow: [
      {
        title: "Draft the shared version",
        description: "Create the core message and choose media once.",
      },
      {
        title: "Open a network tab",
        description:
          "Override content only for destinations that need a change.",
      },
      {
        title: "Review the preview",
        description:
          "Check the approximate feed presentation and required publishing controls.",
      },
    ],
    capabilities: [
      "Shared content plus per-network content variants",
      "Composer previews for Instagram, Facebook, X, LinkedIn, TikTok, Threads, and YouTube",
      "Network controls for privacy, replies, visibility, boards, and audience settings where supported",
      "Image and video selection with thumbnail support for applicable video posts",
      "Platform-aware validation before submission",
    ],
    audience: [
      "Creators repurposing one idea",
      "Brand teams with channel-specific voice",
      "Managers reviewing posts before release",
    ],
    examples: [
      "Use a concise hook on X while keeping the full announcement on LinkedIn.",
      "Choose YouTube privacy and made-for-kids settings before scheduling a video.",
      "Review an Instagram-style preview while configuring whether a video also appears in the feed.",
    ],
    sections: [
      {
        title: "A preview is a check, not a promise",
        paragraphs: [
          "Delulu previews approximate familiar feed layouts so you can catch obvious copy, media, and composition problems before publishing.",
          "Social networks can change their interfaces without notice. The final rendered post is controlled by the destination network, so previews should be used as a practical review aid rather than pixel-perfect certification.",
        ],
      },
    ],
    requirements: [
      "Some controls appear only after a compatible account and post format are selected.",
      "Preview appearance may differ from the live network because destination interfaces change independently.",
      "Character, media, and audience restrictions remain subject to each network's API rules.",
    ],
    questions: [
      {
        question: "Can I write different copy for each social network?",
        answer:
          "Yes. Keep a shared version for most destinations and create overrides for selected networks when the copy needs to change.",
      },
      {
        question: "Are the previews exact screenshots of the final post?",
        answer:
          "No. They are composer previews designed to surface likely layout and content issues. The social network controls the final rendering.",
      },
      {
        question: "Which settings can be customized?",
        answer:
          "Settings depend on the destination and may include reply controls, visibility, privacy, Pinterest boards, TikTok interaction and promotional-content choices, and YouTube audience settings.",
      },
      {
        question: "Does Delulu resize or bypass unsupported media?",
        answer:
          "Delulu validates media against known rules, but it does not bypass a network's limits. You may need to edit the source media before publishing.",
      },
    ],
    related: [
      "multi-platform-publishing",
      "bulk-video-scheduling",
      "team-approvals",
    ],
    integrations: publishingIntegrations,
  },
  {
    slug: "social-media-scheduling",
    job: "Schedule",
    title: "Social media scheduling",
    eyebrow: "Prepare the post now, send it later",
    summary:
      "Choose a future date and time for connected accounts while keeping drafts and publishing status in one workspace.",
    description:
      "Schedule social posts for connected accounts, manage drafts, and track scheduled and published content from one Delulu workspace.",
    icon: CalendarDays,
    outcome:
      "A dependable queue that separates content preparation from the moment each post needs to go live.",
    workflow: [
      {
        title: "Create and validate",
        description:
          "Write the post, attach media, and resolve destination requirements.",
      },
      {
        title: "Choose the time",
        description: "Set the future date and time in the composer.",
      },
      {
        title: "Track the result",
        description:
          "Use posts and calendar views to find upcoming, published, or failed work.",
      },
    ],
    capabilities: [
      "Schedule a post for one or several connected accounts",
      "Save unfinished work as drafts",
      "Edit scheduled content before it is published",
      "Track draft, scheduled, published, and failed states",
      "Review upcoming work from the dashboard and calendar",
    ],
    audience: [
      "Creators batching content",
      "Marketing teams running campaigns",
      "Managers coordinating posts across time zones",
    ],
    examples: [
      "Prepare a week of announcements in one session and assign each a publishing time.",
      "Schedule a launch post across several brand profiles for the same moment.",
      "Return to a draft after media and copy have been approved.",
    ],
    sections: [
      {
        title: "Scheduling still depends on connected networks",
        paragraphs: [
          "Delulu keeps the publishing plan and dispatch state together, but the final delivery still depends on valid account connections and the destination API being available.",
          "Checking failed-post alerts and reconnecting expired accounts is part of operating a reliable schedule, especially for long-running campaigns.",
        ],
      },
    ],
    requirements: [
      "A connected account must remain authorized when the scheduled time arrives.",
      "The post must satisfy destination media and content rules.",
      "Publishing can be delayed or rejected during a destination outage; failed states remain visible for follow-up.",
    ],
    questions: [
      {
        question: "Can I edit a scheduled post?",
        answer:
          "Yes. Scheduled posts can be opened and changed before they publish. Changes do not alter a copy that has already been published.",
      },
      {
        question: "Can one post be scheduled to several accounts?",
        answer:
          "Yes. Select the connected destinations in the composer and set the future publishing time for the campaign.",
      },
      {
        question: "Where can I see what is scheduled?",
        answer:
          "Upcoming posts appear in the posts workflow, dashboard schedule, and calendar view.",
      },
      {
        question: "Will a post publish if an account connection expires?",
        answer:
          "No service can publish through an invalid connection. Reconnect the account and resolve the failed post before trying again.",
      },
    ],
    related: [
      "content-calendar",
      "multi-platform-publishing",
      "bulk-video-scheduling",
    ],
    integrations: publishingIntegrations,
  },
  {
    slug: "content-calendar",
    job: "Plan",
    title: "Social media content calendar",
    eyebrow: "See the publishing plan in time",
    summary:
      "Review scheduled and published posts in a calendar so gaps, collisions, and campaign timing are easier to spot.",
    description:
      "Plan social content in a calendar view, inspect scheduled posts by date, and move between campaign planning and creation in Delulu.",
    icon: CalendarDays,
    outcome:
      "A time-based view of the real publishing queue instead of a disconnected planning spreadsheet.",
    workflow: [
      {
        title: "Open the calendar",
        description:
          "View the month and the posts already attached to each date.",
      },
      {
        title: "Inspect the schedule",
        description:
          "Select a post to review its timing, destinations, and status.",
      },
      {
        title: "Fill the gaps",
        description: "Move into the composer to add or adjust scheduled work.",
      },
    ],
    capabilities: [
      "Monthly view of scheduled and published posts",
      "Navigate between months and jump back to today",
      "Filter calendar content through connected account context",
      "Open existing posts from the calendar",
      "Create content for a selected date using the same publishing workflow",
    ],
    audience: [
      "Content planners",
      "Campaign owners",
      "Teams balancing several accounts",
    ],
    examples: [
      "Spot three campaign posts competing on the same morning.",
      "Confirm every launch phase has a scheduled social touchpoint.",
      "Check which dates are still empty before a weekly planning session.",
    ],
    sections: [
      {
        title: "Planning connected to execution",
        paragraphs: [
          "The calendar reflects posts in Delulu, so it stays tied to the same drafts and publishing statuses the team operates every day.",
          "It is designed for schedule visibility, not as a replacement for a full project-management system. Campaign briefs, asset production, and broader marketing milestones may still live elsewhere.",
        ],
      },
    ],
    requirements: [
      "Only posts created or managed in the active workspace appear in its calendar.",
      "Calendar accuracy depends on the date and time saved on each post.",
      "The view tracks publishing work, not unrelated campaign tasks or external editorial documents.",
    ],
    questions: [
      {
        question: "What appears on the content calendar?",
        answer:
          "The calendar shows Delulu posts associated with dates, including scheduled and published work in the active workspace.",
      },
      {
        question: "Can I create a post from a date?",
        answer:
          "Yes. The calendar connects planning back to the composer so you can begin content for a chosen time.",
      },
      {
        question: "Does it import every item from an external calendar?",
        answer:
          "The current product calendar is focused on Delulu publishing activity. It is not a general external-calendar sync.",
      },
      {
        question: "Is the calendar shared with my workspace?",
        answer:
          "Workspace members see publishing data according to their workspace access and role permissions.",
      },
    ],
    related: ["social-media-scheduling", "team-approvals", "social-analytics"],
    integrations: publishingIntegrations,
  },
  {
    slug: "bulk-video-scheduling",
    job: "Schedule",
    title: "Bulk video scheduling",
    eyebrow: "Turn a folder of videos into a queue",
    summary:
      "Upload multiple videos, choose destinations and a cadence, then create a scheduled sequence without entering every post separately.",
    description:
      "Bulk upload and schedule multiple social videos with platform validation, destination selection, captions, and a repeatable cadence in Delulu.",
    icon: Clapperboard,
    outcome:
      "A faster way to queue a prepared batch of short-form video while preserving validation and review before submission.",
    workflow: [
      {
        title: "Add the videos",
        description: "Drop a batch of local video files into the workspace.",
      },
      {
        title: "Choose accounts and cadence",
        description:
          "Select destinations, a start date, posting time, interval, and ordering.",
      },
      {
        title: "Review and submit",
        description:
          "Resolve validation errors, edit captions, then create the scheduled posts.",
      },
    ],
    capabilities: [
      "Upload several videos in one batch",
      "Validate files against the selected networks' video rules",
      "Choose multiple connected destinations",
      "Set a starting date, time, interval, and sequence",
      "Edit individual captions before scheduling",
    ],
    audience: [
      "Short-form video creators",
      "Teams with an approved asset backlog",
      "Managers distributing recurring video series",
    ],
    examples: [
      "Queue ten approved clips to publish one per weekday.",
      "Schedule the same video series to several compatible accounts.",
      "Reorder a batch so the strongest introduction publishes first.",
    ],
    sections: [
      {
        title: "Built for prepared assets",
        paragraphs: [
          "Bulk scheduling removes repetitive data entry; it does not turn unfinished footage into finished posts. Videos should be edited and approved before upload.",
          "Every selected destination is validated against its known video requirements. A batch cannot be submitted until uploads finish and blocking errors are resolved.",
        ],
      },
    ],
    requirements: [
      "Bulk scheduling is for video files and requires sufficient plan usage for the posts being created.",
      "All selected networks must accept each video's format and dimensions, or the incompatible file must be changed or removed.",
      "View-only workspace members cannot submit a batch; approval requirements still apply to roles that need review.",
    ],
    questions: [
      {
        question: "Can I upload several videos at once?",
        answer:
          "Yes. Add a batch, wait for each upload to complete, and then schedule the group after validation.",
      },
      {
        question: "Can every video have its own caption?",
        answer:
          "Yes. Individual items in the batch can be reviewed and given their own caption before submission.",
      },
      {
        question: "How is the publishing cadence set?",
        answer:
          "Choose a start date and time, then use the scheduling controls to space the ordered videos at the selected interval.",
      },
      {
        question: "What if one video is invalid for a selected network?",
        answer:
          "The batch shows validation errors and blocks submission until the incompatible media or destination selection is corrected.",
      },
    ],
    related: [
      "social-media-scheduling",
      "platform-specific-content",
      "multi-platform-publishing",
    ],
    integrations: videoIntegrations,
  },
  {
    slug: "social-media-api",
    job: "Automate",
    title: "Social media publishing API",
    eyebrow: "Build on the same publishing system",
    summary:
      "Create a scoped API key or OAuth client and manage posts, media, accounts, reviews, analytics, and automations through a typed REST contract.",
    description:
      "Use Delulu's typed REST API to create, schedule, publish, inspect, and retry social posts while preserving workspace roles, review rules, and per-target status.",
    icon: Workflow,
    outcome:
      "A programmable publishing layer for internal tools and custom workflows without duplicating Delulu's account, review, and delivery rules.",
    workflow: [
      {
        title: "Choose authorization",
        description:
          "Use a workspace API key, OAuth with PKCE or device authorization, or a supported first-party session.",
      },
      {
        title: "Prepare the request",
        description:
          "Upload or import media, select connection IDs, and create a draft, schedule, or immediate-publish intent.",
      },
      {
        title: "Inspect every target",
        description:
          "Read the post and destination states until each target reaches a terminal result.",
      },
    ],
    capabilities: [
      "OpenAPI 3.1 generated from the same typed server contract",
      "Post draft, schedule, publish, edit, delete, target inspection, and retry operations",
      "Presigned uploads and public-URL media import",
      "Account connection and workspace administration operations",
      "Review queues, decisions, comments, and activity",
      "Analytics, automation, billing, and usage groups",
      "Workspace-bound API keys and OAuth scopes",
    ],
    audience: [
      "Product teams adding social publishing to an internal tool",
      "Agencies connecting an existing content pipeline",
      "Developers who need explicit delivery state and retry behavior",
    ],
    examples: [
      "Create a reviewed draft from a content-management system, then let an authorized publisher release it.",
      "Import approved media from a public URL and schedule it to selected connection IDs.",
      "Poll target state after publication and surface a provider-specific failure in an operations dashboard.",
    ],
    sections: [
      {
        title: "A successful request is not always a published post",
        paragraphs: [
          "Publishing is asynchronous and can produce a draft, scheduled post, pending review, processing job, partial destination result, or completed publication. API clients need to inspect the returned post and target states instead of treating an accepted request as delivery confirmation.",
          "Authorization is evaluated against workspace membership, role ceilings, granted scopes, quota, and review rules. A custom client cannot use the API to bypass the controls visible in the Delulu workspace.",
        ],
      },
    ],
    requirements: [
      "Clients need an API key or supported OAuth flow with only the scopes their workflow requires.",
      "Media must finish uploading or importing before its ID is referenced by a post.",
      "Provider connections, plan limits, role permissions, and approval requirements remain authoritative.",
    ],
    questions: [
      {
        question: "Is there an OpenAPI document?",
        answer:
          "Yes. The documentation build generates OpenAPI 3.1 from the typed Delulu contracts and provides an interactive explorer from the same document.",
      },
      {
        question: "How can a client authenticate?",
        answer:
          "Supported bearer credentials include workspace-bound API keys, Delulu OAuth tokens, and supported first-party sessions. OAuth supports discovery, PKCE, device authorization, refresh, and revocation.",
      },
      {
        question: "Can the API publish immediately?",
        answer:
          "Yes. Create a post with explicit publish-now intent, subject to account, role, scope, review, quota, and provider checks. Draft is safer when a human decision is still needed.",
      },
      {
        question: "How do I confirm that every destination succeeded?",
        answer:
          "Read the post and its target states. Only completed successful target states confirm delivery; an accepted or processing response is not final confirmation.",
      },
      {
        question: "Can an API key access every workspace?",
        answer:
          "No. API keys are workspace-bound and carry a frozen role plus narrowed scopes. Live membership is still checked on each request.",
      },
    ],
    related: [
      "multi-platform-publishing",
      "team-approvals",
      "social-media-cli",
    ],
    integrations: publishingIntegrations,
  },
  {
    slug: "social-media-mcp",
    job: "Automate",
    title: "Social media MCP server",
    eyebrow: "Give an agent structured publishing tools",
    summary:
      "Connect a compatible MCP client to Delulu for workspace setup, accounts, media, posts, usage, and subscription operations.",
    description:
      "Connect compatible agents to Delulu's hosted MCP server with OAuth, or run the local server with a workspace API key for structured social publishing tools.",
    icon: MessagesSquare,
    outcome:
      "An agent can prepare and operate publishing work through explicit tools while Delulu continues to enforce human authorization and workspace policy.",
    workflow: [
      {
        title: "Connect the server",
        description:
          "Add the hosted MCP URL to a browser-capable client, or run the local package over stdio or SSE.",
      },
      {
        title: "Authorize a workspace",
        description:
          "Sign in, select an eligible workspace and scopes, approve access, then confirm setup status.",
      },
      {
        title: "Call structured tools",
        description:
          "List accounts, import media, create or update posts, publish prepared work, and inspect results.",
      },
    ],
    capabilities: [
      "Hosted remote MCP with browser OAuth authorization",
      "Local stdio and SSE server modes for workspace API keys",
      "Workspace discovery and setup-status tools",
      "Connected-account listing, inspection, and authorization links",
      "Public-URL media import",
      "Post list, create, update, delete, and publish-now tools",
      "Usage and subscription inspection",
    ],
    audience: [
      "Teams operating publishing through an MCP-compatible client",
      "Developers adding social tools to an agent workflow",
      "Self-hosters who want a local MCP transport with a scoped API key",
    ],
    examples: [
      "Ask an authorized agent to prepare a draft for selected connection IDs and return the post state.",
      "Import campaign media from a public HTTPS URL before creating the post.",
      "Use setup status to identify a missing account connection before attempting to publish.",
    ],
    sections: [
      {
        title: "Structured tools do not remove human control",
        paragraphs: [
          "Hosted MCP opens Delulu sign-in and authorization in the browser. The user selects the workspace and scopes before the client receives app-issued access tokens.",
          "Every tool call reuses the REST domain rules for membership, role, scope, quota, payer eligibility, and review. The client must inspect returned post and target states because a successful tool call can still result in a draft, schedule, review, or in-progress publication.",
        ],
      },
    ],
    requirements: [
      "Hosted use requires a browser-capable MCP client that stores and refreshes its own app-issued tokens.",
      "Local stdio or SSE use requires a workspace-bound Delulu API key.",
      "Remote MCP cannot read arbitrary local file paths; media must come from a public HTTPS URL or an existing media ID.",
    ],
    questions: [
      {
        question:
          "Can I use Delulu MCP without pasting a token into the client?",
        answer:
          "Yes. The hosted server uses OAuth with browser authorization and PKCE. The MCP client stores and refreshes the app-issued tokens after approval.",
      },
      {
        question: "What tools does the server provide?",
        answer:
          "The current server covers workspace setup, checkout, accounts, media import, post listing and management, immediate publishing, usage, and subscription status.",
      },
      {
        question: "Can the hosted server upload a file from my laptop?",
        answer:
          "No. Remote MCP cannot receive arbitrary local paths. Import a public HTTPS or supported public share URL, or upload locally with the CLI and pass the completed media ID.",
      },
      {
        question: "Does MCP ignore review requirements?",
        answer:
          "No. Live roles, scopes, workspace binding, quotas, and review rules apply to every tool call just as they do in the app and REST API.",
      },
      {
        question: "How do I choose among several workspaces?",
        answer:
          "Pass a workspace ID or configure the local default. If several workspaces are eligible and no explicit choice exists, the operation fails instead of guessing.",
      },
    ],
    related: ["social-media-api", "social-media-cli", "team-approvals"],
    integrations: publishingIntegrations,
  },
  {
    slug: "social-media-cli",
    job: "Automate",
    title: "Social media command-line interface",
    eyebrow: "Operate publishing from scripts and terminals",
    summary:
      "Authorize a workspace, connect accounts, upload media, create or schedule posts, manage reviews, and inspect results with explicit commands.",
    description:
      "Use the Delulu CLI to connect accounts, upload media, draft, schedule, publish, retry, and review social posts with safe defaults and machine-readable output.",
    icon: Send,
    outcome:
      "A scriptable publishing workflow that is predictable in terminals, automation, and agent-run command environments.",
    workflow: [
      {
        title: "Log in and select",
        description:
          "Complete device or loopback authorization, then bind the intended workspace.",
      },
      {
        title: "Prepare content",
        description:
          "Connect accounts, upload local or remote media, and create a draft or schedule with explicit selectors.",
      },
      {
        title: "Confirm the terminal state",
        description:
          "Inspect posts and targets, approve eligible reviews, publish prepared work, or retry a failed destination.",
      },
    ],
    capabilities: [
      "Device login and loopback PKCE authorization",
      "Workspace selection and live overview",
      "Account list, connect, and disconnect commands",
      "Local-file and remote media upload",
      "Draft, schedule, publish-now, edit, list, inspect, retry, and delete commands",
      "Review queue and approval or rejection commands",
      "Pretty terminal output plus JSON and compact piped output modes",
      "Local operation journal and stable idempotency keys for mutations",
    ],
    audience: [
      "Developers scripting repeatable publishing work",
      "Operators who prefer terminals to dashboards",
      "Agent workflows that need non-interactive commands and structured results",
    ],
    examples: [
      "Upload a local video, create a draft for selected accounts, and inspect the returned post ID.",
      "List only scheduled posts in machine-readable output for a deployment check.",
      "Approve a pending review from an authorized workspace role before publishing.",
    ],
    sections: [
      {
        title: "Safe defaults for unattended work",
        paragraphs: [
          "The CLI does not pause for interactive prompts. Browser steps are emitted as URLs and codes, unknown flags fail, destructive actions require confirmation, and draft is the default unless immediate publishing is explicitly requested.",
          "Mutations use an operation journal and stable idempotency keys so a retry is less likely to create duplicate work. Exit codes separate syntax, authentication, permission, validation, conflict, network, partial-target, and timeout failures.",
        ],
      },
    ],
    requirements: [
      "The published CLI requires Node.js 20 or newer and a successful Delulu authorization flow.",
      "Commands operate within the selected workspace and its live role, scope, quota, and review rules.",
      "Scripts must inspect exit codes and final target states; a timed-out wait is not proof that publishing failed or succeeded.",
    ],
    questions: [
      {
        question: "Does the CLI open interactive terminal prompts?",
        answer:
          "No. It is designed for scripts and agents. Browser authorization is reported as a URL or code, and commands fail clearly when required input is missing.",
      },
      {
        question:
          "What happens if I run a post command without a publish flag?",
        answer:
          "Draft is the safe default. Immediate publishing requires explicit intent, and scheduling requires a valid future timestamp.",
      },
      {
        question: "Can I use the output in a script?",
        answer:
          "Yes. Terminals default to readable output, while piped use can return compact structured output. JSON is also available explicitly.",
      },
      {
        question: "Can the CLI upload local media?",
        answer:
          "Yes. The upload and post journeys accept local media, while completed media IDs can be reused in later operations.",
      },
      {
        question: "How are partial publishing failures reported?",
        answer:
          "The CLI uses a distinct partial-target exit code and presents post and target results so automation can separate full success from a mixed destination outcome.",
      },
    ],
    related: [
      "social-media-api",
      "social-media-mcp",
      "multi-platform-publishing",
    ],
    integrations: publishingIntegrations,
  },
  {
    slug: "instagram-dm-automation",
    job: "Automate",
    title: "Instagram DM automation",
    eyebrow: "Respond to engagement with a controlled flow",
    summary:
      "Build comment- and story-triggered Instagram conversations with keyword filters, conditions, messages, buttons, and run history.",
    description:
      "Create Instagram comment-to-DM and story-reply automations with visual steps, keyword filters, follower checks, buttons, and run analytics in Delulu.",
    icon: FaInstagram,
    iconClassName: "text-[#E4405F]",
    outcome:
      "A repeatable path from public engagement to a private response without manually replying to every qualifying interaction.",
    workflow: [
      {
        title: "Choose an Instagram trigger",
        description: "Start from comments on a post or eligible story replies.",
      },
      {
        title: "Build the flow",
        description:
          "Add keyword filters, conditions, DM messages, quick replies, and links.",
      },
      {
        title: "Publish and monitor",
        description:
          "Activate the automation and inspect runs, contacts, and outcome counts.",
      },
    ],
    capabilities: [
      "Comment and story-reply triggers for connected Instagram accounts",
      "Optional keyword matching and public comment replies",
      "DM steps with text, URL buttons, and quick replies",
      "Conditions for follower status, email presence, and user response",
      "Templates for common delivery, follower, and lead-capture flows",
      "Run history, inbox contacts, and automation analytics",
    ],
    audience: [
      "Creators delivering lead magnets",
      "Businesses handling repetitive Instagram inquiries",
      "Teams running comment-driven campaigns",
    ],
    examples: [
      "Send a download link when someone comments a chosen keyword.",
      "Ask a non-follower to follow, then re-check before delivering content.",
      "Respond to an eligible story reply with a private link and track the run.",
    ],
    sections: [
      {
        title: "Automation with explicit boundaries",
        paragraphs: [
          "The flow builder makes triggers and decisions visible, which helps teams review what a customer will receive before activation.",
          "Delivery depends on Instagram permissions, messaging windows, and platform policy. Delulu cannot guarantee that every public interaction is eligible for a private message, and automations should not be used for unsolicited spam.",
        ],
      },
    ],
    requirements: [
      "A compatible Instagram professional account must be connected with the required messaging permissions.",
      "Triggers and replies are limited by Instagram's API eligibility, messaging windows, and rate or policy controls.",
      "Links, copy, and data collection remain your responsibility; obtain appropriate consent for personal information.",
    ],
    questions: [
      {
        question: "What can trigger an Instagram automation?",
        answer:
          "The current builder supports eligible comments and story replies. Comment triggers can be narrowed with keyword filters and tied to a selected post.",
      },
      {
        question: "Can a flow check whether someone follows the account?",
        answer:
          "Yes. A follower-status condition can branch the flow, often after a quick reply establishes the conversation needed for the check.",
      },
      {
        question: "Can I send buttons or links in a DM?",
        answer:
          "Yes. Message steps can include supported URL buttons and quick replies, with optional next steps.",
      },
      {
        question: "Does automation bypass Instagram messaging limits?",
        answer:
          "No. Every flow remains subject to Instagram permissions, eligibility rules, messaging windows, and platform policy.",
      },
      {
        question: "How do I know whether a flow is working?",
        answer:
          "Use automation analytics and run history to review triggers, outcomes, failures, and the contacts entering the flow.",
      },
    ],
    related: [
      "social-analytics",
      "team-approvals",
      "multi-platform-publishing",
    ],
    integrations: instagramIntegration,
  },
  {
    slug: "team-approvals",
    job: "Collaborate",
    title: "Team workspaces and post approvals",
    eyebrow: "Give people the access their role needs",
    summary:
      "Collaborate on drafts in a shared workspace, assign roles, and route posts through approval before they can publish.",
    description:
      "Organize social publishing in shared Delulu workspaces with member roles, real-time draft collaboration, post review links, approvals, and activity history.",
    icon: Users,
    outcome:
      "A clearer handoff from creator to reviewer, with publishing permissions separated from content contribution.",
    workflow: [
      {
        title: "Set up the workspace",
        description: "Invite members and assign the appropriate role.",
      },
      {
        title: "Create together",
        description:
          "Work in the shared draft with live collaborator presence.",
      },
      {
        title: "Request a decision",
        description:
          "Send the post into review, then approve or return it with visible activity.",
      },
    ],
    capabilities: [
      "Shared organization workspaces and member management",
      "Role-based permissions for owners, admins, publishers, members, and viewers",
      "Real-time collaborator presence while editing drafts",
      "Review queue and dedicated review links",
      "Approve, reject, cancel, and track review activity",
      "Require approval before publishing for selected roles",
    ],
    audience: [
      "Agencies handling client review",
      "In-house marketing teams",
      "Organizations separating creation from publishing authority",
    ],
    examples: [
      "Let a contributor prepare a campaign while a publisher controls release.",
      "Share a review link for a specific post instead of sending screenshots through chat.",
      "Check the activity trail when a post returns for changes.",
    ],
    sections: [
      {
        title: "Permissions follow the workspace",
        paragraphs: [
          "Connected accounts, drafts, and approvals belong to a workspace. Members operate within the permissions assigned to their role rather than sharing one login.",
          "Approval protects the publish action, but it does not replace internal brand policy. Teams should still define who owns copy, legal review, and account access.",
        ],
      },
    ],
    requirements: [
      "Members need an invitation and an account before they can access a workspace.",
      "Available actions depend on the assigned role; viewers cannot create or submit publishing work.",
      "Real-time presence requires a working network connection and does not replace the explicit approval decision.",
    ],
    questions: [
      {
        question: "Can contributors create posts without publishing them?",
        answer:
          "Yes. Workspace roles and approval requirements can separate content preparation from final publishing authority.",
      },
      {
        question: "What actions are available in review?",
        answer:
          "Authorized reviewers can approve or reject a pending post, while the activity view records the review lifecycle and related actions.",
      },
      {
        question: "Can someone review without navigating the full dashboard?",
        answer:
          "A dedicated post review route presents the post and its platform previews for focused review, subject to access controls.",
      },
      {
        question: "Does Delulu show who else is editing?",
        answer:
          "The shared draft experience includes real-time collaborator presence so teammates can see active participants.",
      },
      {
        question: "Can a viewer schedule a bulk upload?",
        answer:
          "No. View-only members are prevented from submitting publishing work, including bulk schedules.",
      },
    ],
    related: [
      "platform-specific-content",
      "content-calendar",
      "social-analytics",
    ],
    integrations: publishingIntegrations,
  },
  {
    slug: "social-analytics",
    job: "Analyze",
    title: "Social media analytics",
    eyebrow: "Measure what published content did",
    summary:
      "Review account-level performance, engagement trends, and top posts without separating reporting from the publishing workspace.",
    description:
      "Track social account performance, engagement trends, audience metrics, and top posts across supported connected networks in Delulu analytics.",
    icon: BarChart3,
    outcome:
      "A practical performance view for deciding what to repeat, revise, or stop in the next content cycle.",
    workflow: [
      {
        title: "Choose the scope",
        description: "Select connected accounts and the reporting period.",
      },
      {
        title: "Read the trend",
        description: "Compare overview metrics and engagement over time.",
      },
      {
        title: "Inspect posts",
        description:
          "Use top-post results to connect aggregate movement to specific content.",
      },
    ],
    capabilities: [
      "Overview metrics across supported connected accounts",
      "Engagement charts over a selected date range",
      "Follower or audience movement where providers expose it",
      "Top-post ranking for the reporting period",
      "Account filtering and refreshable provider data",
      "Dashboard summaries for recent publishing activity",
    ],
    audience: [
      "Creators refining a content format",
      "Managers reporting across accounts",
      "Teams planning the next campaign from prior results",
    ],
    examples: [
      "Compare engagement before and after a campaign launch.",
      "Find the posts responsible for a strong reporting period.",
      "Filter to one connected account before a channel-specific planning meeting.",
    ],
    sections: [
      {
        title: "Provider data, presented in one workflow",
        paragraphs: [
          "Delulu requests insights from connected social providers and normalizes them into a usable workspace view. Metrics are only available when a provider exposes them and the connection has the required permissions.",
          "Numbers may refresh on different schedules across networks. Analytics should be treated as decision support, not as audited financial reporting or a guarantee that every network defines an engagement identically.",
        ],
      },
    ],
    requirements: [
      "Analytics availability depends on the connected network, account type, permissions, and plan access.",
      "Some metrics or historical windows may be unavailable because the provider does not expose them.",
      "Cross-network totals combine provider data that may use different definitions and refresh times.",
    ],
    questions: [
      {
        question: "Which metrics can I see?",
        answer:
          "The analytics view includes supported overview, engagement, audience, and top-post data. Exact fields vary with the selected provider and account permissions.",
      },
      {
        question: "Can I filter analytics by account?",
        answer:
          "Yes. Reporting can be scoped to connected accounts so you can separate a channel or profile from the broader workspace view.",
      },
      {
        question: "Why is a metric missing for one network?",
        answer:
          "Social providers expose different insights for different account types. A missing metric may not be available through that provider or connection permission.",
      },
      {
        question: "Are analytics updated in real time?",
        answer:
          "Not uniformly. Delulu refreshes provider-backed data, but each social network controls when insight data becomes available.",
      },
      {
        question: "Can I identify the strongest posts?",
        answer:
          "Yes. The top-post view connects period performance to individual published content where the provider supplies the required insights.",
      },
    ],
    related: [
      "content-calendar",
      "multi-platform-publishing",
      "instagram-dm-automation",
    ],
    integrations: publishingIntegrations,
  },
] as const satisfies readonly Feature[];

export type FeatureSlug = (typeof features)[number]["slug"];

export const featureBySlug: ReadonlyMap<string, Feature> = new Map(
  features.map((feature) => [feature.slug, feature])
);

export const featureJobs = [
  "Plan",
  "Create",
  "Schedule",
  "Automate",
  "Collaborate",
  "Analyze",
] as const;
