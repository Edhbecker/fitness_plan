"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";

export type BodyChartItem = {
  date: string;
  weight: number;
  fat: number | null;
  lean: number | null;
  waist: number | null;
};

export function BodyChart({ data }: { data: BodyChartItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!mounted) return <div className="h-[250px] w-full animate-pulse rounded-xl bg-[#f3f7f5]" />;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
          <CartesianGrid stroke="#e9efed" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#70827d", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#70827d", fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #dbe5e1", fontSize: 12 }} />
          <Line type="monotone" dataKey="weight" name="Peso" stroke="#0f6b60" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="fat" name="% gordura" stroke="#ef8b3b" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
