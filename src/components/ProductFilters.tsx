import React, { useState, useEffect, useCallback } from "react";
import { productsV3 } from "@wix/stores";

interface ProductFiltersProps {
  onFiltersChange: (filters: {
    priceRange: { min: number; max: number };
    selectedOptions: { [optionId: string]: string[] };
  }) => void;
  products: productsV3.V3Product[];
  className?: string;
}

interface ProductOption {
  id: string;
  name: string;
  choices: { id: string; name: string }[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFiltersChange,
  products,
  className = "",
}) => {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedOptions, setSelectedOptions] = useState<{
    [optionId: string]: string[];
  }>({});
  const [availableOptions, setAvailableOptions] = useState<ProductOption[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract price range and options from products
  useEffect(() => {
    if (!products || products.length === 0) return;

    // Calculate price range
    let minPrice = Infinity;
    let maxPrice = 0;

    // Extract all unique options
    const optionsMap = new Map<string, ProductOption>();

    products.forEach((product) => {
      // Calculate price range
      if (product.actualPriceRange?.minValue?.amount) {
        const min = parseFloat(product.actualPriceRange.minValue.amount);
        minPrice = Math.min(minPrice, min);
      }
      if (product.actualPriceRange?.maxValue?.amount) {
        const max = parseFloat(product.actualPriceRange.maxValue.amount);
        maxPrice = Math.max(maxPrice, max);
      }

      // Extract options
      if (product.options) {
        product.options.forEach((option) => {
          if (!option._id || !option.name) return;

          if (!optionsMap.has(option._id)) {
            optionsMap.set(option._id, {
              id: option._id,
              name: option.name,
              choices: [],
            });
          }

          const optionData = optionsMap.get(option._id)!;

          // Add choices
          if (option.choicesSettings?.choices) {
            option.choicesSettings.choices.forEach((choice) => {
              if (
                choice.choiceId &&
                choice.name &&
                !optionData.choices.find((c) => c.id === choice.choiceId)
              ) {
                optionData.choices.push({
                  id: choice.choiceId,
                  name: choice.name,
                });
              }
            });
          }
        });
      }
    });

    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === 0) maxPrice = 1000;

    setPriceRange({ min: minPrice, max: maxPrice });
    setTempPriceRange({ min: minPrice, max: maxPrice });
    setAvailableOptions(Array.from(optionsMap.values()));
  }, [products]);

  // Handle price range change
  const handlePriceRangeChange = useCallback(
    (newRange: { min: number; max: number }) => {
      setTempPriceRange(newRange);
    },
    []
  );

  // Handle price range commit (when user releases slider)
  const handlePriceRangeCommit = useCallback(() => {
    onFiltersChange({
      priceRange: tempPriceRange,
      selectedOptions,
    });
  }, [tempPriceRange, selectedOptions, onFiltersChange]);

  // Handle option selection
  const handleOptionChange = useCallback(
    (optionId: string, choiceId: string, checked: boolean) => {
      setSelectedOptions((prev) => {
        const newOptions = { ...prev };
        if (!newOptions[optionId]) {
          newOptions[optionId] = [];
        }

        if (checked) {
          if (!newOptions[optionId].includes(choiceId)) {
            newOptions[optionId] = [...newOptions[optionId], choiceId];
          }
        } else {
          newOptions[optionId] = newOptions[optionId].filter(
            (id) => id !== choiceId
          );
          if (newOptions[optionId].length === 0) {
            delete newOptions[optionId];
          }
        }

        // Trigger filter change
        onFiltersChange({
          priceRange: tempPriceRange,
          selectedOptions: newOptions,
        });

        return newOptions;
      });
    },
    [tempPriceRange, onFiltersChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const initialRange = { min: priceRange.min, max: priceRange.max };
    setTempPriceRange(initialRange);
    setSelectedOptions({});
    onFiltersChange({
      priceRange: initialRange,
      selectedOptions: {},
    });
  }, [priceRange, onFiltersChange]);

  const hasActiveFilters =
    tempPriceRange.min !== priceRange.min ||
    tempPriceRange.max !== priceRange.max ||
    Object.keys(selectedOptions).length > 0;

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden text-white/60 hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={`space-y-6 ${isExpanded ? "block" : "hidden lg:block"}`}>
        {/* Price Range Filter */}
        <div>
          <h4 className="text-white font-medium mb-4">Price Range</h4>
          <div className="space-y-4">
            {/* Price Range Display */}
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>${String(tempPriceRange.min)}</span>
              <span>${String(tempPriceRange.max)}</span>
            </div>

            {/* Dual Range Slider */}
            <div className="relative h-6">
              <div className="absolute top-2 left-0 right-0 h-2 bg-white/20 rounded-full">
                <div
                  className="absolute h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  style={{
                    left: `${
                      ((tempPriceRange.min - priceRange.min) /
                        (priceRange.max - priceRange.min)) *
                      100
                    }%`,
                    width: `${
                      ((tempPriceRange.max - tempPriceRange.min) /
                        (priceRange.max - priceRange.min)) *
                      100
                    }%`,
                  }}
                />
              </div>

              {/* Min Range Input */}
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={tempPriceRange.min}
                onChange={(e) =>
                  handlePriceRangeChange({
                    ...tempPriceRange,
                    min: Math.min(Number(e.target.value), tempPriceRange.max),
                  })
                }
                onMouseUp={handlePriceRangeCommit}
                onTouchEnd={handlePriceRangeCommit}
                className="absolute top-0 left-0 w-full h-6 bg-transparent appearance-none cursor-pointer range-slider range-slider-min"
                style={{ zIndex: tempPriceRange.min > priceRange.min + (priceRange.max - priceRange.min) * 0.5 ? 2 : 1 }}
              />

              {/* Max Range Input */}
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={tempPriceRange.max}
                onChange={(e) =>
                  handlePriceRangeChange({
                    ...tempPriceRange,
                    max: Math.max(Number(e.target.value), tempPriceRange.min),
                  })
                }
                onMouseUp={handlePriceRangeCommit}
                onTouchEnd={handlePriceRangeCommit}
                className="absolute top-0 left-0 w-full h-6 bg-transparent appearance-none cursor-pointer range-slider range-slider-max"
                style={{ zIndex: tempPriceRange.max < priceRange.min + (priceRange.max - priceRange.min) * 0.5 ? 2 : 1 }}
              />
            </div>

            {/* Manual Price Input */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-white/60 mb-1">Min</label>
                <input
                  type="number"
                  value={tempPriceRange.min}
                  onChange={(e) => {
                    const value = Math.max(
                      priceRange.min,
                      Math.min(Number(e.target.value), tempPriceRange.max)
                    );
                    setTempPriceRange({ ...tempPriceRange, min: value });
                  }}
                  onBlur={handlePriceRangeCommit}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/60 mb-1">Max</label>
                <input
                  type="number"
                  value={tempPriceRange.max}
                  onChange={(e) => {
                    const value = Math.min(
                      priceRange.max,
                      Math.max(Number(e.target.value), tempPriceRange.min)
                    );
                    setTempPriceRange({ ...tempPriceRange, max: value });
                  }}
                  onBlur={handlePriceRangeCommit}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Options Filters */}
        {availableOptions.map((option) => (
          <div key={option.id}>
            <h4 className="text-white font-medium mb-3">{String(option.name)}</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {option.choices.map((choice) => (
                <label
                  key={choice.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions[option.id]?.includes(choice.id) || false}
                    onChange={(e) =>
                      handleOptionChange(option.id, choice.id, e.target.checked)
                    }
                    className="w-4 h-4 bg-white/10 border border-white/30 rounded text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-white/80 group-hover:text-white transition-colors text-sm">
                    {String(choice.name)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {availableOptions.length === 0 && (
          <div className="text-center py-4 text-white/60">
            <p>No filter options available</p>
          </div>
        )}
      </div>

      <style>{`
        .range-slider {
          pointer-events: none;
        }
        
        .range-slider::-webkit-slider-thumb {
          pointer-events: all;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .range-slider::-moz-range-thumb {
          pointer-events: all;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: none;
        }

        .range-slider::-webkit-slider-track {
          background: transparent;
          border: none;
        }

        .range-slider::-moz-range-track {
          background: transparent;
          border: none;
        }

        /* Different colors for min and max sliders */
        .range-slider-min::-webkit-slider-thumb {
          background: linear-gradient(45deg, #10b981, #3b82f6);
        }
        
        .range-slider-min::-moz-range-thumb {
          background: linear-gradient(45deg, #10b981, #3b82f6);
        }
        
        .range-slider-max::-webkit-slider-thumb {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
        }
        
        .range-slider-max::-moz-range-thumb {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
        }
      `}</style>
    </div>
  );
};

export default ProductFilters; 