"use client";

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export default function PriceRangeSlider({ min, max, value, onChange }: Props) {
  const [low, high] = value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm text-neutral-mid">
        <span>${low.toLocaleString("es-AR")}</span>
        <span>${high.toLocaleString("es-AR")}</span>
      </div>
      <div className="relative h-6">
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
          className="absolute w-full accent-marca-400"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
          className="absolute w-full accent-marca-400"
        />
      </div>
    </div>
  );
}
