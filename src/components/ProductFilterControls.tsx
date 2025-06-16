import React, { useRef, useEffect } from "react";

interface ProductFilterControlsProps {
  filter: Record<string, any>;
  setFilter: (filter: Record<string, any>) => void;
}

const COLOR_OPTIONS = ["Red", "Blue", "Green", "Black", "White"];
const SIZE_OPTIONS = [
  "100ml",
  "150ml",
  "250ml",
  "500ml",
  "Large",
  "Medium",
  "Small",
  "X-Large",
];

const PRICE_MIN = 0;
const PRICE_MAX = 1000;
const STEP = 1;
const DEBOUNCE_DELAY = 300;

export const ProductFilterControls: React.FC<ProductFilterControlsProps> = ({
  filter,
  setFilter,
}) => {
  const color: string[] = filter.color || [];
  const size: string[] = filter.size || [];
  const minPrice =
    typeof filter.minPrice === "number" ? filter.minPrice : PRICE_MIN;
  const maxPrice =
    typeof filter.maxPrice === "number" ? filter.maxPrice : PRICE_MAX;

  // Debounce logic for price filter
  const priceDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPriceRef = useRef<{ minPrice: number; maxPrice: number } | null>(
    null
  );

  // Call this to debounce setFilter for price
  const debounceSetPrice = (newMin: number, newMax: number) => {
    pendingPriceRef.current = { minPrice: newMin, maxPrice: newMax };
    if (priceDebounceRef.current) {
      clearTimeout(priceDebounceRef.current);
    }
    priceDebounceRef.current = setTimeout(() => {
      setFilter({
        ...filter,
        minPrice: pendingPriceRef.current!.minPrice,
        maxPrice: pendingPriceRef.current!.maxPrice,
      });
      priceDebounceRef.current = null;
    }, DEBOUNCE_DELAY);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
    };
  }, []);

  // Handlers for the custom slider
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxPrice - STEP);
    debounceSetPrice(value, maxPrice);
  };
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minPrice + STEP);
    debounceSetPrice(minPrice, value);
  };
  const handleColorChange = (c: string) => {
    setFilter({
      ...filter,
      color: color.includes(c) ? color.filter((v) => v !== c) : [...color, c],
    });
  };
  const handleSizeChange = (s: string) => {
    setFilter({
      ...filter,
      size: size.includes(s) ? size.filter((v) => v !== s) : [...size, s],
    });
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 flex flex-col gap-8 border border-white/10 shadow-lg">
      {/* Price Range */}
      <div>
        <h3 className="text-base font-semibold text-white mb-2 tracking-wide">
          Price
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-white/80 text-sm mb-1">
            <span>Min: ${minPrice}</span>
            <span>Max: ${maxPrice}</span>
          </div>
          <div className="relative h-8 flex items-center">
            {/* Min slider */}
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={STEP}
              value={minPrice}
              onChange={handleMinPriceChange}
              className="absolute w-full pointer-events-auto accent-cyan-500 h-2 bg-transparent z-10"
              style={{ zIndex: minPrice < maxPrice ? 20 : 10 }}
            />
            {/* Max slider */}
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={STEP}
              value={maxPrice}
              onChange={handleMaxPriceChange}
              className="absolute w-full pointer-events-auto accent-cyan-500 h-2 bg-transparent z-0"
              style={{ zIndex: maxPrice > minPrice ? 20 : 10 }}
            />
            {/* Track background */}
            <div className="absolute w-full h-2 bg-white/20 rounded-full" />
            {/* Selected range highlight */}
            <div
              className="absolute h-2 bg-cyan-500 rounded-full"
              style={{
                left: `${
                  ((minPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
                }%`,
                width: `${
                  ((maxPrice - minPrice) / (PRICE_MAX - PRICE_MIN)) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-base font-semibold text-white mb-2 tracking-wide">
          Color
        </h3>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={`px-4 py-1 rounded-full border text-sm font-medium transition-all
                ${
                  color.includes(c)
                    ? "bg-cyan-500 border-cyan-500 text-white shadow"
                    : "bg-white/10 border-white/20 text-white/80 hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-300"
                }
              `}
              onClick={() => handleColorChange(c)}
              aria-pressed={color.includes(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-base font-semibold text-white mb-2 tracking-wide">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`px-4 py-1 rounded-full border text-sm font-medium transition-all
                ${
                  size.includes(s)
                    ? "bg-cyan-500 border-cyan-500 text-white shadow"
                    : "bg-white/10 border-white/20 text-white/80 hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-300"
                }
              `}
              onClick={() => handleSizeChange(s)}
              aria-pressed={size.includes(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilterControls;
