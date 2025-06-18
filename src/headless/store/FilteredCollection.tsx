import React, { createContext, useContext, ReactNode } from "react";
import {
  FilteredCollectionServiceDefinition,
  type FilteredCollectionServiceAPI,
} from "./filtered-collection-service";
import { useServiceInstance } from "@wix/services-manager";
import { productsV3 } from "@wix/stores";

const FilteredCollectionContext = createContext<FilteredCollectionServiceAPI | null>(null);

interface FilteredCollectionProviderProps {
  children: ReactNode;
}

export const FilteredCollectionProvider: React.FC<FilteredCollectionProviderProps> = ({
  children,
}) => {
  const serviceInstance = useServiceInstance(FilteredCollectionServiceDefinition);

  return (
    <FilteredCollectionContext.Provider value={serviceInstance}>
      {children}
    </FilteredCollectionContext.Provider>
  );
};

export const useFilteredCollection = () => {
  const context = useContext(FilteredCollectionContext);
  if (!context) {
    throw new Error("useFilteredCollection must be used within a FilteredCollectionProvider");
  }
  return context;
};

// Grid component for displaying filtered products
interface FilteredGridProps {
  children: (data: {
    products: productsV3.V3Product[];
    allProducts: productsV3.V3Product[];
    isLoading: boolean;
    error: string | null;
    isEmpty: boolean;
  }) => ReactNode;
}

export const FilteredGrid: React.FC<FilteredGridProps> = ({ children }) => {
  const service = useFilteredCollection();
  
  const products = service.products.use();
  const allProducts = service.allProducts.use();
  const isLoading = service.isLoading.use();
  const error = service.error.use();
  const hasProducts = service.hasProducts.use();

  return (
    <>
      {children({
        products,
        allProducts,
        isLoading,
        error,
        isEmpty: !hasProducts,
      })}
    </>
  );
};

// Item component for individual product rendering
interface FilteredItemProps {
  product: productsV3.V3Product;
  children: (data: {
    title: string;
    image: string | null;
    price: string;
    available: boolean;
    href: string;
    description?: string;
  }) => ReactNode;
}

export const FilteredItem: React.FC<FilteredItemProps> = ({ product, children }) => {
  // Safe conversion of product data with type safety guards
  const title = String(product.name || "");
  const image = product.media?.main?.image || null;
  const price = product.actualPriceRange?.minValue?.formattedAmount || 
               product.actualPriceRange?.maxValue?.formattedAmount || 
               "$0.00";
  const available = product.inventory?.availabilityStatus === "IN_STOCK";
  const href = `/store/products/${String(product.slug || product._id || "")}`;
  const description = product.plainDescription ? String(product.plainDescription) : undefined;

  return (
    <>
      {children({
        title,
        image,
        price: String(price),
        available,
        href,
        description,
      })}
    </>
  );
};

// Load More component for pagination
interface FilteredLoadMoreProps {
  children: (data: {
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    isLoading: boolean;
    hasProducts: boolean;
    totalProducts: number;
  }) => ReactNode;
}

export const FilteredLoadMore: React.FC<FilteredLoadMoreProps> = ({ children }) => {
  const service = useFilteredCollection();
  
  const loadMore = service.loadMore;
  const refresh = service.refresh;
  const isLoading = service.isLoading.use();
  const hasProducts = service.hasProducts.use();
  const totalProducts = service.totalProducts.use();

  return (
    <>
      {children({
        loadMore,
        refresh,
        isLoading,
        hasProducts,
        totalProducts,
      })}
    </>
  );
};

// Filters component for managing filters
interface FilteredFiltersProps {
  children: (data: {
    applyFilters: (filters: {
      priceRange: { min: number; max: number };
      selectedOptions: { [optionId: string]: string[] };
    }) => void;
    clearFilters: () => void;
    currentFilters: {
      priceRange: { min: number; max: number };
      selectedOptions: { [optionId: string]: string[] };
    };
    allProducts: productsV3.V3Product[];
  }) => ReactNode;
}

export const FilteredFilters: React.FC<FilteredFiltersProps> = ({ children }) => {
  const service = useFilteredCollection();
  
  const applyFilters = service.applyFilters;
  const clearFilters = service.clearFilters;
  const currentFilters = service.currentFilters.use();
  const allProducts = service.allProducts.use();

  return (
    <>
      {children({
        applyFilters,
        clearFilters,
        currentFilters,
        allProducts,
      })}
    </>
  );
};

// Export the main collection object for easier usage
export const FilteredCollection = {
  Provider: FilteredCollectionProvider,
  Grid: FilteredGrid,
  Item: FilteredItem,
  LoadMore: FilteredLoadMore,
  Filters: FilteredFilters,
}; 