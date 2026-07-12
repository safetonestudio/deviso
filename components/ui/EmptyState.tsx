import { LucideIcon } from "lucide-react";
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-ds-surface border border-ds-border border-dashed rounded-xl py-20 text-center">
      <div className="w-12 h-12 bg-ds-elevated rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon size={24} className="text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}
