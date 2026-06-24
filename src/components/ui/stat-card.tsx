import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "green" | "orange" | "blue";
}) {
  const tones = {
    green: "bg-[#e7f3ef] text-primary",
    orange: "bg-[#fff0e3] text-[#c86720]",
    blue: "bg-[#e8f0f6] text-[#326883]",
  };
  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <p className="text-xs font-bold text-muted">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-[11px] text-muted">{detail}</p>
      </div>
      <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </span>
    </div>
  );
}
