export type DayPoint = { label: string; value: number };

function niceMax(max: number) {
  if (max === 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const snap = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return snap * pow;
}

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`
    : `Rp${n.toLocaleString("id-ID")}`;

const GRID = "rgba(255,255,255,.08)";
const TXT = "rgba(255,255,255,.45)";

const W = 640, H = 170, pad = 30, pb = 18, top = pad;

function xAt(i: number, n: number) {
  return pad + i * ((W - pad * 2) / (n - 1 || 1));
}

function yAt(v: number, max: number) {
  return H - pb - ((H - pb - pad) * v) / max;
}

function xTickLabels({ points }: { points: DayPoint[] }) {
  const n = points.length;
  const every = Math.max(1, Math.ceil(n / 8));
  return (
    <g fontSize="9" fill={TXT}>
      {points.map((p, i) =>
        i % every === 0 || i === n - 1 ? (
          <text key={i} x={xAt(i, n)} y={H - 5} textAnchor="middle">
            {p.label}
          </text>
        ) : null
      )}
    </g>
  );
}

function gridlines(max: number) {
  return (
    <g stroke={GRID}>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad} x2={W - pad} y1={yAt(max * t, max)} y2={yAt(max * t, max)} />
      ))}
    </g>
  );
}

export function AreaChart({ points, money = false }: { points: DayPoint[]; money?: boolean }) {
  if (!points.length) points = [{ label: "", value: 0 }];
  const max = niceMax(Math.max(...points.map((p) => p.value), 1) * 1.05);
  const n = points.length;
  const pts = points.map((p, i) => `${xAt(i, n)},${yAt(p.value, max)}`).join(" ");
  const area = `${pad},${H - pb} ${pts} ${xAt(n - 1, n)},${H - pb}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {gridlines(max)}
      {money && (
        <text x={pad} y={top - 6} fontSize="10" fill={TXT}>
          max {compact(max)}
        </text>
      )}
      <polygon points={area} fill="rgba(0,255,136,.12)" />
      <polyline points={pts} fill="none" stroke="#00FF88" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {xTickLabels({ points })}
    </svg>
  );
}

export function BarsChart({ points, money = false }: { points: DayPoint[]; money?: boolean }) {
  if (!points.length) points = [{ label: "", value: 0 }];
  const max = niceMax(Math.max(...points.map((p) => p.value), 1) * 1.05);
  const n = points.length;
  const step = (W - pad * 2) / n;
  const bw = Math.max(2, Math.min(22, step * 0.6));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {gridlines(max)}
      {money && (
        <text x={pad} y={top - 6} fontSize="10" fill={TXT}>
          max {compact(max)}
        </text>
      )}
      {points.map((p, i) => {
        const h = ((H - pb - pad) * p.value) / max;
        return (
          <rect
            key={i}
            x={pad + i * step + (step - bw) / 2}
            y={H - pb - Math.max(h, p.value ? 2 : 1)}
            width={bw}
            height={Math.max(h, p.value ? 2 : 1)}
            rx="2"
            fill={p.value ? "#00FF88" : "rgba(255,255,255,.08)"}
          />
        );
      })}
      {xTickLabels({ points })}
    </svg>
  );
}

export function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-white/45">
        <span>{label}</span>
        <span>
          {value.toLocaleString("id-ID")} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}