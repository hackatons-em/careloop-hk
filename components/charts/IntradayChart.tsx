"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface IntradayPoint {
  t: string; // ISO timestamp
  value: number;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** A single intraday metric over the course of a day (x = time of day). */
export function IntradayChart({
  data,
  color,
  unit,
  name,
  ariaLabel,
  height = 150,
  domain = ["auto", "auto"],
}: {
  data: IntradayPoint[];
  color: string;
  unit?: string;
  name: string;
  ariaLabel?: string;
  height?: number;
  domain?: [number | "auto", number | "auto"];
}) {
  const gid = `wgrad-${name.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div role={ariaLabel ? "img" : undefined} aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} accessibilityLayer>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={hhmm}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={32}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            labelFormatter={(l) => hhmm(String(l))}
            formatter={(v) => [`${v ?? ""}${unit ? ` ${unit}` : ""}`, name]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            connectNulls
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
