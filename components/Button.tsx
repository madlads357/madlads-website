import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Mirrors the Figma "Button" component set.
const styles = {
  primary: "bg-accent text-white hover:bg-ink",
  secondary: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-white",
  inverse: "bg-white text-ink hover:bg-ink hover:text-white",
  "inverse-red": "bg-white text-ink hover:bg-accent hover:text-white",
  "inverse-outline": "border-[1.5px] border-white text-white hover:bg-white hover:text-ink",
} as const;

export type ButtonVariant = keyof typeof styles;

type Props = {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  external?: boolean;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

// A trailing arrow ("→" / "↗") slides forward on hover.
function withArrow(children: ReactNode) {
  if (typeof children !== "string") return children;
  const m = children.match(/^(.*?)\s*([→↗])$/);
  if (!m) return children;
  const move = m[2] === "→" ? "group-hover:translate-x-1" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5";
  return (
    <>
      {m[1]}
      <span aria-hidden className={`inline-block transition-transform duration-300 ease-out ${move}`}>
        {m[2]}
      </span>
    </>
  );
}

export function Button({ href, variant = "primary", children, className = "", external, ...rest }: Props) {
  const cls = `group inline-flex items-center justify-center gap-2 rounded-[4px] px-6 py-4 text-[15px] leading-none font-semibold whitespace-nowrap transition-colors duration-200 ${styles[variant]} ${className}`;
  const content = withArrow(children);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {content}
      </a>
    );
  }
  // Server routes (e.g. /api/auth/login) get a plain link: <Link> may prefetch them, which would start a login.
  if (href.startsWith("/api/")) {
    return (
      <a href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {content}
    </Link>
  );
}
