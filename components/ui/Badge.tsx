const variants = {
  draft: "bg-ds-elevated text-gray-400",
  sent: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  viewed: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  signed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  declined: "bg-red-500/10 text-red-400 border border-red-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  cancelled: "bg-ds-elevated text-gray-500",
};
type BadgeVariant = keyof typeof variants;
export function Badge({ variant, label }: { variant: BadgeVariant; label: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
