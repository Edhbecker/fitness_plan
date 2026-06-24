"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

export type TrainingChartItem = {
  week: string;
  planned: number;
  performed: number;
  intensity: number;
  adherence: number;
};

export function TrainingChart({ data }: { data: TrainingChartItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!mounted) return <div className="h-[285px] w-full animate-pulse rounded-xl bg-[#f3f7f5]" />;

  return (
    <div className="h-[285px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="performed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f6b60" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#0f6b60" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e9efed" vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "#70827d", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#70827d", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 14, border: "1px solid #dbe5e1", fontSize: 12 }}
            formatter={(value) => `${Number(value).toLocaleString("pt-BR")} kg`}
          />
          <Area type="monotone" dataKey="performed" stroke="#0f6b60" strokeWidth={2.5} fill="url(#performed)" />
          <Line type="monotone" dataKey="planned" stroke="#ef8b3b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
