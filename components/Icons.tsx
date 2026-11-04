// Line icons used across the site (same drawings as the Figma "Icon/*" components).
type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const CrownIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 18 4.5 7l5 5L12 5l2.5 7 5-5L21 18Z" />
    <path d="M3 21h18" />
  </svg>
);

export const TicketIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" />
    <path d="M14 6v12" />
  </svg>
);

export const GiftIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 11h16v10H4z" />
    <path d="M3 7h18v4H3z" />
    <path d="M12 7v14" />
    <path d="M12 7C10 3 6 3 7 6c.5 1 3 1 5 1Zm0 0c2-4 6-4 5-1-.5 1-3 1-5 1Z" />
  </svg>
);

export const UsersIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16 14c3 0 5 1.8 5.5 5" />
  </svg>
);

export const ToolIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94Z" />
  </svg>
);

export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const ArrowUpRight = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
