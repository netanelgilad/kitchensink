import React, { useState, useCallback } from "react";
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
import ProductFilterControls from "../../../components/ProductFilterControls";
import ProductSortControls from "../../../components/ProductSortControls";

interface StoreExample2PageProps {
  collectionServiceConfig: any;
  currentCartServiceConfig: any;
}

const ProductGridContent = ({ filter, sort }: { filter: any; sort: any }) => {
  return (
    <Collection.Grid>
      {withDocsWrapper(
        ({ products, isLoading, error, isEmpty }) => {
          // Client-side color/size filtering
          let filteredProducts = products;
          if (filter.colors && filter.colors.length > 0) {
            filteredProducts = filteredProducts.filter((product) => {
              return product.options?.some((opt: any) =>
                opt.choicesSettings?.choices?.some((choice: any) =>
                  filter.colors.includes(choice.name)
                )
              );
            });
          }
          if (filter.sizes && filter.sizes.length > 0) {
            filteredProducts = filteredProducts.filter((product) => {
              return product.options?.some((opt: any) =>
                opt.choicesSettings?.choices?.some((choice: any) =>
                  filter.sizes.includes(choice.name)
                )
              );
            });
          }
          // Client-side price sorting
          if (sort && sort.field === "price") {
            filteredProducts = [...filteredProducts].sort((a, b) => {
              const aPrice = parseFloat(
                a.actualPriceRange?.minValue?.amount ?? "0"
              );
              const bPrice = parseFloat(
                b.actualPriceRange?.minValue?.amount ?? "0"
              );
              return sort.order === "ASC" ? aPrice - bPrice : bPrice - aPrice;
            });
          }
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
              ) : filteredProducts.length === 0 ? (
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
                    We couldn't find any products to display.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
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
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                  Advanced store experience • {totalProducts} products loaded
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
  const [clientFilter, setClientFilter] = useState<any>({});

  return (
    <KitchensinkLayout>
      <StoreLayout
        currentCartServiceConfig={currentCartServiceConfig}
        servicesManager={servicesManager}
      >
        <PageDocsRegistration
          title="Advanced Store Collection"
          description="Enhanced product collection interface with advanced product interactions, wishlist functionality, and modern design patterns using Collection and CurrentCart headless components."
          docsUrl="/docs/examples/advanced-store-collection"
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Advanced Store
                </span>
              </h1>
              <p className="text-white/80 text-xl max-w-2xl mx-auto">
                Experience our next-generation e-commerce platform with enhanced
                interactions and modern design patterns
              </p>

              <Collection.Header>
                {withDocsWrapper(
                  ({ totalProducts, isLoading, hasProducts }) => (
                    <div className="mt-6">
                      {!isLoading && hasProducts && (
                        <p className="text-white/60">
                          Showing {totalProducts} product
                          {totalProducts !== 1 ? "s" : ""} with enhanced
                          features
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
                    <div className="bg-white/10 rounded-2xl shadow-lg border border-white/10 p-6">
                      <h2 className="text-lg font-bold text-white mb-4">
                        Filter by
                      </h2>
                      <ProductFilterControls
                        filter={{ ...filter, ...clientFilter }}
                        setFilter={(f) => {
                          setFilter({
                            minPrice: f.minPrice,
                            maxPrice: f.maxPrice,
                          });
                          setClientFilter(f);
                        }}
                      />
                    </div>
                  )}
                </Collection.Filter>
              </aside>
              {/* Main Content */}
              <main className="flex-1">
                <Collection.Sort>
                  {({ sort, setSort }) => (
                    <>
                      <div className="flex justify-end mb-4">
                        <ProductSortControls sort={sort} setSort={setSort} />
                      </div>
                      <ProductGridContent filter={clientFilter} sort={sort} />
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
