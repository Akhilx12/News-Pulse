"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  CartesianGrid,
} from "recharts";

function toMillis(isoString) {
  return new Date(isoString).getTime();
}

function formatDate(millis) {
  return new Date(millis).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Timeline({ clusters, onClusterClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  if (clusters.length === 0) {
    return (
      <div className="text-gray-500 py-12 text-center">
        No clusters match the current filter.
      </div>
    );
  }

  const sorted = [...clusters].sort(
    (a, b) => toMillis(a.start) - toMillis(b.start)
  );

  const globalMin = Math.min(...sorted.map((c) => toMillis(c.start)));

  const chartData = sorted.map((c) => {
    const startMs = toMillis(c.start);
    const endMs = toMillis(c.end);
    return {
      id: c.id,
      label: c.label,
      articleCount: c.articleCount,
      sources: c.sources,
      offset: startMs - globalMin,
      duration: Math.max(endMs - startMs, 1000 * 60 * 60 * 2),
      rawStart: startMs,
      rawEnd: endMs,
    };
  });

  // Reserve real space per row, AND a fixed amount at the bottom for
  // the axis itself — without this second part, the axis gets pushed
  // below the visible/scrollable chart area entirely.
  const barHeight = 26;
  const axisHeight = 40;
  const chartHeight = chartData.length * (barHeight + 6) + axisHeight;

  // vibrant palette per source (fallbacks included)
  const sourcePalette = {
    BBC: ["#ef4444", "#dc2626"], // red
    NPR: ["#06b6d4", "#0891b2"], // cyan
    Guardian: ["#10b981", "#059669"], // green
    "Al Jazeera": ["#f59e0b", "#d97706"], // amber
    default: ["#60a5fa", "#2563eb"], // blue
  };

  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 24, right: 24, bottom: 10 }}
        >
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tickFormatter={(val) => formatDate(globalMin + val)}
            height={axisHeight}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fontSize: 11 }}
          />
          <CartesianGrid horizontal={false} stroke="#f3f4f6" />
          <Tooltip
            formatter={(value, name, props) => {
              if (name === "duration") {
                return [
                  `${formatDate(props.payload.rawStart)} – ${formatDate(props.payload.rawEnd)} · ${props.payload.articleCount} article(s)`,
                  "Active",
                ];
              }
              return null;
            }}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="offset" stackId="a" fill="transparent" />
          <Bar
            dataKey="duration"
            stackId="a"
            radius={[6, 6, 6, 6]}
            onClick={(data) => onClusterClick(data.id)}
            cursor="pointer"
            minPointSize={3}
          >
            {chartData.map((entry) => {
              const primary = entry.sources && entry.sources.length > 0 ? entry.sources[0] : "default";
              const colors = sourcePalette[primary] || sourcePalette.default;
              const isHovered = hoveredId === entry.id;
              const fill = isHovered ? colors[1] : colors[0];
              return (
                <Cell
                  key={entry.id}
                  fill={fill}
                  style={{ transition: "fill 180ms" }}
                  onMouseEnter={() => setHoveredId(entry.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
            <LabelList
              dataKey="articleCount"
              position="right"
              formatter={(val) => `${val}`}
              style={{ fontSize: 12, fill: "#6b7280" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}