export const ExternalIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d="M6 3h7v7M13 3 5.25 10.75M11 9.5V13H3V5h3.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.35"
    />
  </svg>
);

export const DocumentationIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d="M2.5 3.25A2.25 2.25 0 0 1 4.75 1H8v12H4.75a2.25 2.25 0 0 0-2.25 2V3.25ZM13.5 3.25A2.25 2.25 0 0 0 11.25 1H8v12h3.25a2.25 2.25 0 0 1 2.25 2V3.25Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </svg>
);

export const CliIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <rect
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.25"
      width="14"
      x="1"
      y="2"
    />
    <path
      d="m4 6 2 2-2 2M8.5 10H12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </svg>
);

export const ApiIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d="M6 2.5H5A1.5 1.5 0 0 0 3.5 4v2.25A1.75 1.75 0 0 1 2 8a1.75 1.75 0 0 1 1.5 1.75V12A1.5 1.5 0 0 0 5 13.5h1M10 2.5h1A1.5 1.5 0 0 1 12.5 4v2.25A1.75 1.75 0 0 0 14 8a1.75 1.75 0 0 0-1.5 1.75V12a1.5 1.5 0 0 1-1.5 1.5h-1"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </svg>
);

export type SidebarIconKind =
  | "account"
  | "agent"
  | "api"
  | "automation"
  | "billing"
  | "document"
  | "home"
  | "media"
  | "publish"
  | "review"
  | "settings"
  | "terminal"
  | "workspace";

const sidebarIconPaths: Record<SidebarIconKind, string> = {
  account:
    "M5 6.25a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM2.5 14c.55-2.35 2.38-3.75 5.5-3.75s4.95 1.4 5.5 3.75",
  agent:
    "M8 1.5 9.35 5.1 13 6.5 9.35 7.9 8 11.5 6.65 7.9 3 6.5l3.65-1.4L8 1.5ZM12.5 11l.55 1.45L14.5 13l-1.45.55L12.5 15l-.55-1.45L10.5 13l1.45-.55L12.5 11Z",
  api: "M5.75 2.5h-1A1.75 1.75 0 0 0 3 4.25v1.9A1.85 1.85 0 0 1 1.5 8 1.85 1.85 0 0 1 3 9.85v1.9a1.75 1.75 0 0 0 1.75 1.75h1M10.25 2.5h1A1.75 1.75 0 0 1 13 4.25v1.9A1.85 1.85 0 0 0 14.5 8a1.85 1.85 0 0 0-1.5 1.85v1.9a1.75 1.75 0 0 1-1.75 1.75h-1",
  automation:
    "M3 3.5h4v4H3v-4ZM9 8.5h4v4H9v-4ZM7 5.5h2.25A1.75 1.75 0 0 1 11 7.25V8.5M5 7.5v2.25A1.75 1.75 0 0 0 6.75 11H9",
  billing:
    "M2 4.25A1.25 1.25 0 0 1 3.25 3h9.5A1.25 1.25 0 0 1 14 4.25v7.5A1.25 1.25 0 0 1 12.75 13h-9.5A1.25 1.25 0 0 1 2 11.75v-7.5ZM2 6h12M4.5 10h2",
  document: "M4 1.75h5.5L13 5.25v9H4v-12.5ZM9.5 1.75v3.5H13M6 8h5M6 10.5h5",
  home: "m2 7 6-5 6 5v7H9.75v-4h-3.5v4H2V7Z",
  media: "M2.5 2.5h11v11h-11v-11ZM2.5 10l3-3 2.2 2.2L9.5 7.4l4 4M10.75 5.5h.01",
  publish: "m2 8 12-5-4.5 10-2-4L2 8Zm5.5 1L14 3",
  review: "M3 2.5h10v11H3v-11ZM5.5 8l1.5 1.5L10.75 6",
  settings:
    "M8 5.25A2.75 2.75 0 1 0 8 10.75 2.75 2.75 0 0 0 8 5.25ZM8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9",
  terminal: "M1.5 3h13v10h-13V3Zm3 3 2 2-2 2M8.5 10h3",
  workspace: "M2 2h5v5H2V2Zm7 0h5v5H9V2ZM2 9h5v5H2V9Zm7 0h5v5H9V9Z",
};

export const SidebarIcon = ({ kind }: { kind: SidebarIconKind }) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d={sidebarIconPaths[kind]}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
  </svg>
);
