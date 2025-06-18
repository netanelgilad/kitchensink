import React, { useState, useCallback, useEffect } from "react";
import {
  createServicesManager,
  createServicesMap,
} from "@wix/services-manager";
import { KitchensinkLayout } from "../../../layouts/KitchensinkLayout";
import { StoreLayout } from "../../../layouts/StoreLayout";
import {
  withDocsWrapper,
  PageDocsRegistration,
} from "../../../components/DocsMode";
import {
  CollectionServiceDefinition,
  CollectionService,
} from "../../../headless/store/collection-service";
import {
  CurrentCartServiceDefinition,
  CurrentCartService,
} from "../../../headless/store/current-cart-service";
import { Collection } from "../../../headless/store/Collection";
import WixMediaImage from "../../../headless/media/Image";

interface StoreExample2PageProps {
  collectionServiceConfig: any;
  currentCartServiceConfig: any;
}

const ProductGridContent = () => {
  return (
    <Collection.Grid>
      {withDocsWrapper(
        ({ products, isLoading, error, isEmpty }) => {
          return (
            <div className="min-h-screen">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              {isLoading && products.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-xl p-4 animate-pulse"
                    >
                      <div className="aspect-square bg-white/10 rounded-lg mb-4"></div>
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-12 h-12 text-white/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    No Products Found
                  </h2>
                  <p className="text-white/70">
                    Try adjusting your filters or search criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Collection.Item key={product._id} product={product}>
                      {withDocsWrapper(
                        ({
                          title,
                          image,
                          price,
                          available,
                          href,
                          description,
                        }) => (
                          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 group">
                            <div className="aspect-square bg-white/10 rounded-lg mb-4 overflow-hidden relative">
                              {image ? (
                                <WixMediaImage
                                  media={{ image: image }}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg
                                    className="w-12 h-12 text-white/40"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}

                              <div className="absolute top-2 left-2">
                                <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                  New
                                </span>
                              </div>
                            </div>

                            <h3 className="text-white font-semibold mb-2 line-clamp-2">
                              {title}
                            </h3>

                            {description && (
                              <p className="text-white/60 text-sm mb-3 line-clamp-2">
                                {description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xl font-bold text-white">
                                {price}
                              </span>
                              <div className="flex items-center gap-2">
                                {available ? (
                                  <span className="text-green-400 text-sm flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="text-red-400 text-sm flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <a
                                href={href.replace(
                                  "/store/products/",
                                  "/store/example-2/"
                                )}
                                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                              >
                                View Product
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </a>
                            </div>
                          </div>
                        ),
                        "Collection.Item",
                        "/docs/components/collection#item"
                      )}
                    </Collection.Item>
                  ))}
                </div>
              )}
            </div>
          );
        },
        "Collection.Grid",
        "/docs/components/collection#grid"
      )}
    </Collection.Grid>
  );
};

const LoadMoreSection = () => {
  return (
    <Collection.LoadMore>
      {withDocsWrapper(
        ({ loadMore, refresh, isLoading, hasProducts, totalProducts }) => (
          <>
            {hasProducts && totalProducts > 0 && (
              <div className="text-center mt-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      "Load More Products"
                    )}
                  </button>

                  <button
                    onClick={refresh}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Refresh Products
                  </button>
                </div>

                <p className="text-white/60 text-sm mt-4">
                  Advanced store experience with URL sync • {totalProducts}{" "}
                  products loaded
                </p>
              </div>
            )}
          </>
        ),
        "Collection.LoadMore",
        "/docs/components/collection#loadmore"
      )}
    </Collection.LoadMore>
  );
};

// Local FilterSidebar component with URL sync
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

function FilterSidebar({
  filter,
  setFilter,
}: {
  filter: any;
  setFilter: (f: any) => void;
}) {
  const color: string[] = filter.color || [];
  const size: string[] = filter.size || [];
  const [localMin, setLocalMin] = React.useState(
    typeof filter.minPrice === "number" ? filter.minPrice : PRICE_MIN
  );
  const [localMax, setLocalMax] = React.useState(
    typeof filter.maxPrice === "number" ? filter.maxPrice : PRICE_MAX
  );
  React.useEffect(() => {
    setLocalMin(
      typeof filter.minPrice === "number" ? filter.minPrice : PRICE_MIN
    );
    setLocalMax(
      typeof filter.maxPrice === "number" ? filter.maxPrice : PRICE_MAX
    );
  }, [filter.minPrice, filter.maxPrice]);
  const priceDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      setFilter({
        ...filter,
        minPrice: localMin,
        maxPrice: localMax,
      });
    }, DEBOUNCE_DELAY);
    return () => {
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMin, localMax]);
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMax - STEP);
    setLocalMin(value);
  };
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMin + STEP);
    setLocalMax(value);
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

  const clearAllFilters = () => {
    setFilter({});
  };

  return (
    <div className="bg-white/10 rounded-2xl shadow-lg border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Filter by</h2>
        <button
          onClick={clearAllFilters}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-white mb-2 tracking-wide">
          Price
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-white/80 text-sm mb-1">
            <span>Min: ${localMin}</span>
            <span>Max: ${localMax}</span>
          </div>
          <div className="relative h-8 flex items-center">
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={STEP}
              value={localMin}
              onChange={handleMinPriceChange}
              className="absolute w-full pointer-events-auto accent-cyan-500 h-2 bg-transparent z-10"
              style={{ zIndex: localMin < localMax ? 20 : 10 }}
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={STEP}
              value={localMax}
              onChange={handleMaxPriceChange}
              className="absolute w-full pointer-events-auto accent-cyan-500 h-2 bg-transparent z-0"
              style={{ zIndex: localMax > localMin ? 20 : 10 }}
            />
            <div className="absolute w-full h-2 bg-white/20 rounded-full" />
            <div
              className="absolute h-2 bg-cyan-500 rounded-full"
              style={{
                left: `${
                  ((localMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
                }%`,
                width: `${
                  ((localMax - localMin) / (PRICE_MAX - PRICE_MIN)) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
      {/* Color */}
      <div className="border-t border-white/10 pt-5 mb-6">
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
      {/* Size */}
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
}

// Local SortDropdown component with URL sync
const SORT_OPTIONS = [
  { label: "Newest", value: { field: "_createdDate", order: "DESC" } },
  { label: "Oldest", value: { field: "_createdDate", order: "ASC" } },
  { label: "Price: Low to High", value: { field: "price", order: "ASC" } },
  { label: "Price: High to Low", value: { field: "price", order: "DESC" } },
];
function SortDropdown({
  sort,
  setSort,
}: {
  sort: any;
  setSort: (s: any) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/70 text-sm">Sort by:</span>
      <select
        className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
        value={JSON.stringify(sort)}
        onChange={(e) => setSort(JSON.parse(e.target.value))}
      >
        {SORT_OPTIONS.map((opt) => (
          <option
            key={opt.label}
            value={JSON.stringify(opt.value)}
            className="bg-slate-800"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function StoreExample2Page({
  collectionServiceConfig,
  currentCartServiceConfig,
}: StoreExample2PageProps) {
  const servicesManager = createServicesManager(
    createServicesMap()
      .addService(
        CollectionServiceDefinition,
        CollectionService,
        collectionServiceConfig
      )
      .addService(
        CurrentCartServiceDefinition,
        CurrentCartService,
        currentCartServiceConfig
      )
  );

  return (
    <KitchensinkLayout>
      <StoreLayout
        currentCartServiceConfig={currentCartServiceConfig}
        servicesManager={servicesManager}
      >
        <PageDocsRegistration
          title="Store Collection with URL Parameters"
          description="Enhanced product collection interface with URL parameter synchronization for filters and sorting. Perfect for SEO and shareable product links."
          docsUrl="/docs/examples/store-collection-url-params"
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Store with URL Sync
                </span>
              </h1>
              <p className="text-white/80 text-xl max-w-2xl mx-auto">
                Experience our e-commerce platform where all filters and sorting
                sync with the URL for easy sharing and SEO benefits
              </p>

              <Collection.Header>
                {withDocsWrapper(
                  ({ totalProducts, isLoading, hasProducts }) => (
                    <div className="mt-6">
                      {!isLoading && hasProducts && (
                        <p className="text-white/60">
                          Showing {totalProducts} product
                          {totalProducts !== 1 ? "s" : ""} with URL
                          synchronization
                        </p>
                      )}
                    </div>
                  ),
                  "Collection.Header",
                  "/docs/components/collection#header"
                )}
              </Collection.Header>
            </div>
            {/* Main layout: sidebar + content */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar Filters */}
              <aside className="md:w-64 w-full mb-8 md:mb-0">
                <Collection.Filter>
                  {({ filter, setFilter }) => (
                    <FilterSidebar filter={filter} setFilter={setFilter} />
                  )}
                </Collection.Filter>
              </aside>
              {/* Main Content */}
              <main className="flex-1">
                <Collection.Sort>
                  {({ sort, setSort }) => (
                    <>
                      <div className="flex justify-end mb-4">
                        <SortDropdown sort={sort} setSort={setSort} />
                      </div>
                      <ProductGridContent />
                      <LoadMoreSection />
                    </>
                  )}
                </Collection.Sort>
              </main>
            </div>
          </div>
        </div>
      </StoreLayout>
    </KitchensinkLayout>
  );
}
