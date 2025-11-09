import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronRightCircle } from "lucide-react";

type BulletProps = {
  title: React.ReactNode;
  desc?: React.ReactNode;
  /** Optional custom icon (defaults to ChevronRightCircle) */
  icon?: React.ReactNode;
  /** For internal routes (react-router) */
  to?: string;
  /** For external links */
  href?: string;
  /** Visual size */
  size?: "sm" | "md";
  /** Extra classes */
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descClassName?: string;
};

/** Simple list wrapper with consistent spacing */
export function BulletList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={["space-y-5", className].filter(Boolean).join(" ")}>{children}</ul>;
}

/** Single bullet item */
export function Bullet({
  title,
  desc,
  icon,
  to,
  href,
  size = "md",
  className,
  iconClassName,
  titleClassName,
  descClassName,
}: BulletProps) {
  const Icon =
    icon ??
    (<ChevronRightCircle className={["mt-0.5 h-5 w-5 shrink-0", iconClassName].filter(Boolean).join(" ")} />);

  const titleEl = (() => {
    if (to) {
      return (
        <Link to={to} className={["font-semibold hover:underline", titleClassName].filter(Boolean).join(" ")}>
          {title}
        </Link>
      );
    }
    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={["font-semibold hover:underline", titleClassName].filter(Boolean).join(" ")}
        >
          {title}
        </a>
      );
    }
    return <div className={["font-semibold", titleClassName].filter(Boolean).join(" ")}>{title}</div>;
  })();

  const spacing = size === "sm" ? "gap-2" : "gap-3";
  const textSize = size === "sm" ? "text-[13px]" : "text-sm";

  return (
    <li className={["flex", spacing, className].filter(Boolean).join(" ")}>
      {React.isValidElement(icon) ? icon : Icon}
      <div>
        {titleEl}
        {desc ? (
          <p className={[textSize, "text-muted-foreground", descClassName].filter(Boolean).join(" ")}>{desc}</p>
        ) : null}
      </div>
    </li>
  );
}
