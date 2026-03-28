"use client";

type MoodPoint = { score: number; emotion: string; date: number };

interface Props {
  data: MoodPoint[];
}

export default function MoodSparkline({ data }: Props) {
  if (data.length < 2) return null;

  const points = data.slice(-15);
  const W = 140;
  const H = 40;
  const padX = 4;
  const padY = 4;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const coords = points.map((p, i) => ({
    x: padX + (i / (points.length - 1)) * innerW,
    y: padY + ((10 - p.score) / 9) * innerH,
    score: p.score,
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  // Color based on latest score
  const hue = (last.score / 10) * 120; // 0=red, 120=green
  const color = `hsl(${hue}, 70%, 45%)`;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 8,
        background: "#f8f6f2",
        border: "1px solid #e8e4de",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block" }}
      >
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r={2.5} fill={color} />
      </svg>
      <span style={{ fontSize: 11, color: "#6b6b6b", whiteSpace: "nowrap" }}>
        Mood {last.score}/10
      </span>
    </div>
  );
}
