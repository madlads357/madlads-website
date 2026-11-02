import type { ReactNode } from "react";

// Section wrapper + header, mirroring the "NN / Name" eyebrow + title pattern in Figma.
export function Section({
  id,
  tone = "paper",
  className = "",
  children,
}: {
  id?: string;
  tone?: "paper" | "surface" | "sunken";
  className?: string;
  children: ReactNode;
}) {
  const bg = { paper: "bg-paper", surface: "bg-surface", sunken: "bg-sunken" }[tone];
  return (
    <section id={id} className={`${bg} px-4 py-20 md:px-page md:py-section ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="reveal mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-[640px] flex-col gap-4">
        <p className="t-eyebrow text-accent">{eyebrow}</p>
        <h2 className="t-h2">{title}</h2>
        {text && <p className="t-body-l text-muted">{text}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
