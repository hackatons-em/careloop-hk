"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFormat } from "@/lib/useFormat";

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
}

export interface RefLineDef {
  y: number;
  label: string;
  color?: string;
}

export interface ChartRow {
  date: string;
  [key: string]: number | string | null;
}

interface TrendChartProps {
  data: ChartRow[];
  series: SeriesDef[];
  unit?: string;
  height?: number;
  refLines?: RefLineDef[];
  domain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
  yTickFormatter?: (value: number) => string;
  step?: boolean;
  /** Screen-reader description of the chart (e.g. "Weight over the last 7 days"). */
  ariaLabel?: string;
}

export function TrendChart({
  data,
  series,
  unit,
  height = 190,
  refLines = [],
  domain = ["auto", "auto"],
  yTickFormatter,
  step = false,
  ariaLabel,
}: TrendChartProps) {
  const { formatDay } = useFormat();
  return (
    <div role={ariaLabel ? "img" : undefined} aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
        accessibilityLayer
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          domain={domain}
          tickFormatter={yTickFormatter}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={yTickFormatter ? 64 : 36}
        />
        <Tooltip
          labelFormatter={(label) => formatDay(String(label))}
          formatter={(value, name) => [
            `${value ?? ""}${unit ? ` ${unit}` : ""}`,
            String(name),
          ]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 12,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
          }}
        />
        {refLines.map((r) => (
          <ReferenceLine
            key={r.label}
            y={r.y}
            stroke={r.color ?? "var(--muted-foreground)"}
            strokeDasharray="4 4"
            label={{
              value: r.label,
              position: "insideTopLeft",
              fontSize: 10,
              fill: r.color ?? "var(--muted-foreground)",
            }}
          />
        ))}
        {series.map((s) => (
          <Area
            key={s.key}
            type={step ? "stepAfter" : "monotone"}
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            connectNulls
            dot={{ r: 2, fill: s.color }}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
