"use client";

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

export default function PriceRangeSlider({ min, max, value, onChange }: Props) {
  const [low, high] = value;
  // Every product shares one price (or there are none): the control has
  // nothing to divide, so show the value and disable it rather than render
  // a slider whose thumbs cannot move.
  const inerte = max <= min;
  const span = inerte ? 1 : max - min;
  const pct = (n: number) => ((n - min) / span) * 100;

  return (
    <div className="w-full sm:max-w-xs">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-tinta">Precio</span>
        <span className="font-display text-sm font-semibold tabular-nums text-marca-700">
          {inerte ? money(min) : `${money(low)} – ${money(high)}`}
        </span>
      </div>

      <div className="relative h-11">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-linea" />
        {!inerte && (
          <div
            className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-marca-400"
            style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
          />
        )}

        <input
          type="range"
          className="rango"
          min={min}
          max={max}
          step={1}
          value={low}
          disabled={inerte}
          aria-label="Precio mínimo"
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
        />
        <input
          type="range"
          className="rango"
          min={min}
          max={max}
          step={1}
          value={high}
          disabled={inerte}
          aria-label="Precio máximo"
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
        />
      </div>
    </div>
  );
}
