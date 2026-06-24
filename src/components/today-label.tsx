"use client";

export function TodayLabel() {
  const value = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const label = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <p
      suppressHydrationWarning
      className="text-xs font-bold uppercase tracking-[0.18em] text-accent"
    >
      {label}
    </p>
  );
}
