import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const PROJECT_STATUS = {
  planning: { label: "Planning", cls: "text-zinc-300 bg-white/5 border-white/10" },
  active: { label: "Active", cls: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" },
  on_hold: { label: "On Hold", cls: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  completed: { label: "Completed", cls: "text-[#0088FF] bg-[#0088FF]/10 border-[#0088FF]/20" },
};

export const TASK_STATUS = {
  todo: { label: "To Do", cls: "text-zinc-300 bg-white/5 border-white/10" },
  in_progress: { label: "In Progress", cls: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  done: { label: "Done", cls: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" },
};

export const INVOICE_STATUS = {
  draft: { label: "Draft", cls: "text-zinc-400 bg-white/5 border-white/10" },
  sent: { label: "Sent", cls: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  paid: { label: "Paid", cls: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" },
};

export const PRIORITY = {
  low: { label: "Low", cls: "text-zinc-400 bg-white/5" },
  medium: { label: "Medium", cls: "text-[#0088FF] bg-[#0088FF]/10" },
  high: { label: "High", cls: "text-[#EF4444] bg-[#EF4444]/10" },
};

export function Badge({ map, value, testId }) {
  const item = map[value] || { label: value, cls: "text-zinc-400 bg-white/5 border-white/10" };
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium border rounded-sm whitespace-nowrap",
        item.cls
      )}
    >
      {item.label}
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, sub, accent, testId }) {
  return (
    <div
      data-testid={testId}
      className="bg-[#0E0E0E] border border-white/10 p-6 rounded-sm hover:border-white/20 transition-colors duration-200"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs tracking-[0.15em] uppercase text-zinc-500 font-semibold">{label}</p>
        {Icon && (
          <Icon className={cn("h-4 w-4", accent || "text-zinc-600")} strokeWidth={1.75} />
        )}
      </div>
      <p className="mt-4 text-4xl font-display font-light tracking-tighter text-white">{value}</p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
    </div>
  );
}

export function Progress({ value, className }) {
  return (
    <div className={cn("h-1.5 w-full bg-white/10 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-white rounded-full transition-all duration-500"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="h-14 w-14 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center mb-5">
          <Icon className="h-6 w-6 text-zinc-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-display font-medium text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-zinc-500 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/50" />
    </div>
  );
}

export function initials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AvatarBubble({ name, src, size = "h-7 w-7" }) {
  return src ? (
    <img
      src={src}
      alt={name}
      className={cn(size, "rounded-full object-cover border border-white/10")}
    />
  ) : (
    <div
      className={cn(
        size,
        "rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-zinc-300"
      )}
    >
      {initials(name)}
    </div>
  );
}

export function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
