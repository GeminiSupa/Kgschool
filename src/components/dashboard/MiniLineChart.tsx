import React from 'react'

export type MiniLinePoint = { xLabel: string; y: number }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function MiniLineChart({
  data,
  height = 96,
  stroke = 'rgb(99 102 241)', // indigo-500
  className = '',
}: {
  data: MiniLinePoint[]
  height?: number
  stroke?: string
  className?: string
}) {
  const width = 320
  const padding = 10
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  const ys = data.map((d) => d.y)
  const maxY = Math.max(1, ...ys)
  const minY = Math.min(0, ...ys)
  const range = Math.max(1, maxY - minY)

  const pts = data.map((d, i) => {
    const t = data.length <= 1 ? 0 : i / (data.length - 1)
    const x = padding + t * innerW
    const yNorm = (d.y - minY) / range
    const y = padding + (1 - yNorm) * innerH
    return { x, y, rawY: d.y }
  })

  const dPath =
    pts.length === 0
      ? ''
      : `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} ` +
        pts
          .slice(1)
          .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(' ')

  const areaPath =
    pts.length === 0
      ? ''
      : `${dPath} L ${pts[pts.length - 1].x.toFixed(2)} ${(height - padding).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(height - padding).toFixed(2)} Z`

  const last = pts[pts.length - 1]
  const lastValue = last ? last.rawY : 0

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-widest text-ui-soft">Trend</div>
        <div className="text-sm font-black text-foreground tabular-nums">{lastValue}</div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id="miniLineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#miniLineFill)" />
        <path d={dPath} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={clamp(idx === pts.length - 1 ? 4 : 3, 2.5, 4)}
            fill={idx === pts.length - 1 ? stroke : 'rgb(255 255 255)'}
            stroke={stroke}
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-ui-soft">
        <span>{data[0]?.xLabel ?? ''}</span>
        <span>{data[data.length - 1]?.xLabel ?? ''}</span>
      </div>
    </div>
  )
}

