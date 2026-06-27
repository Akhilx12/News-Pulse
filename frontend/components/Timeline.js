"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
          />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fontSize: 11 }}
          />
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
            radius={[4, 4, 4, 4]}
            onClick={(data) => onClusterClick(data.id)}
            cursor="pointer"
            minPointSize={3}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill={`hsl(220, 70%, ${Math.max(75 - entry.articleCount * 2, 35)}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}