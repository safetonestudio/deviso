"use client";

import Link from "next/link";

interface WaitlistButtonProps {
  className?: string;
  label?: string;
  plan?: "free" | "solo" | "pro";
}

export function WaitlistButton({
  className,
  label = "Commencer gratuitement",
  plan = "free",
}: WaitlistButtonProps) {
  const href = plan === "free" ? "/signup" : `/signup?plan=${plan}`;
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
