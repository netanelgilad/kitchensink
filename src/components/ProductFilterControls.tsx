import React, { useState } from "react";

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

export const ProductFilterControls: React.FC<ProductFilterControlsProps> = ({
  filter,
  setFilter,
}) => {
  const [minPrice, setMinPrice] = useState(filter.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice || "");
  const [colors, setColors] = useState<string[]>(filter.colors || []);
  const [sizes, setSizes] = useState<string[]>(filter.sizes || []);

  const handleColorChange = (color: string) => {
    setColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };
  const handleSizeChange = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const applyFilters = () => {
    setFilter({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      colors,
      sizes,
    });
  };

  return (
    <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-4">
      <div>
        <label className="block text-white/80 mb-1">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-24 px-2 py-1 rounded bg-white/10 text-white"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-white/60">-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-24 px-2 py-1 rounded bg-white/10 text-white"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-white/80 mb-1">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <label
              key={color}
              className="flex items-center gap-1 text-white/70"
            >
              <input
                type="checkbox"
                checked={colors.includes(color)}
                onChange={() => handleColorChange(color)}
                className="accent-cyan-500"
              />
              {color}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-white/80 mb-1">Size</label>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <label key={size} className="flex items-center gap-1 text-white/70">
              <input
                type="checkbox"
                checked={sizes.includes(size)}
                onChange={() => handleSizeChange(size)}
                className="accent-cyan-500"
              />
              {size}
            </label>
          ))}
        </div>
      </div>
      <button
        className="mt-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all"
        onClick={applyFilters}
      >
        Apply Filters
      </button>
    </div>
  );
};

export default ProductFilterControls;
