import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";
import { productsV3 } from "@wix/stores";
import {
  URLParamsService,
  type FilterParams,
  type SortParams,
} from "./url-params-service";

export interface CollectionServiceAPI {
  products: Signal<productsV3.V3Product[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  totalProducts: Signal<number>;
  hasProducts: Signal<boolean>;

  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  setFilter: (newFilter: Record<string, any>) => void;
  setSort: (newSort: { field: string; order: "ASC" | "DESC" }) => void;
  filter: Signal<Record<string, any>>;
  sort: Signal<{ field: string; order: "ASC" | "DESC" }>;
  syncWithCurrentURL: () => void;
}

export const CollectionServiceDefinition =
  defineService<CollectionServiceAPI>("collection");

// Allowed sort and filter fields for productsV3.queryProducts
const ALLOWED_SORT_FIELDS = ["_createdDate"];
const ALLOWED_FILTER_FIELDS = [
  "actualPriceRange.minValue.amount",
  "options.choicesSettings.choices.name",
];

export const CollectionService = implementService.withConfig<{
  initialProducts?: productsV3.V3Product[];
  pageSize?: number;
  collectionId?: string;
  initialFilter?: Record<string, any>;
  initialSort?: { field: string; order: "ASC" | "DESC" };
  enableURLSync?: boolean;
}>()(CollectionServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  const initialProducts = config.initialProducts || [];

  // Store raw products from API
  const rawProductsList: Signal<productsV3.V3Product[]> = signalsService.signal(
    initialProducts as any
  );

  // Computed filtered and sorted products
  const productsList: Signal<productsV3.V3Product[]> = signalsService.signal(
    initialProducts as any
  );

  const isLoading: Signal<boolean> = signalsService.signal(false as any);
  const error: Signal<string | null> = signalsService.signal(null as any);
  const totalProducts: Signal<number> = signalsService.signal(
    initialProducts.length as any
  );
  const hasProducts: Signal<boolean> = signalsService.signal(
    (initialProducts.length > 0) as any
  );

  const pageSize = config.pageSize || 12;

  // Use config values for initial state to ensure server/client consistency
  const filter: Signal<Record<string, any>> = signalsService.signal(
    (config.initialFilter || {}) as any
  );
  const sort: Signal<{ field: string; order: "ASC" | "DESC" }> =
    signalsService.signal(
      (config.initialSort || { field: "_createdDate", order: "DESC" }) as any
    );

  // Apply client-side filtering and sorting
  const applyFiltersAndSort = () => {
    let filteredProducts = rawProductsList.get();
    const currentFilter = filter.get();
    const currentSort = sort.get();

    // Client-side color filtering
    if (currentFilter.color && currentFilter.color.length > 0) {
      filteredProducts = filteredProducts.filter((product) => {
        return product.options?.some((opt: any) =>
          opt.choicesSettings?.choices?.some((choice: any) =>
            currentFilter.color.includes(choice.name)
          )
        );
      });
    }

    // Client-side size filtering
    if (currentFilter.size && currentFilter.size.length > 0) {
      filteredProducts = filteredProducts.filter((product) => {
        return product.options?.some((opt: any) =>
          opt.choicesSettings?.choices?.some((choice: any) =>
            currentFilter.size.includes(choice.name)
          )
        );
      });
    }

    // Client-side price filtering
    if (
      typeof currentFilter.minPrice === "number" ||
      typeof currentFilter.maxPrice === "number"
    ) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = parseFloat(
          product.actualPriceRange?.minValue?.amount ?? "0"
        );
        if (
          typeof currentFilter.minPrice === "number" &&
          price < currentFilter.minPrice
        )
          return false;
        if (
          typeof currentFilter.maxPrice === "number" &&
          price > currentFilter.maxPrice
        )
          return false;
        return true;
      });
    }

    // Client-side sorting
    if (currentSort.field === "price") {
      filteredProducts = [...filteredProducts].sort((a, b) => {
        const aPrice = parseFloat(a.actualPriceRange?.minValue?.amount ?? "0");
        const bPrice = parseFloat(b.actualPriceRange?.minValue?.amount ?? "0");
        return currentSort.order === "ASC" ? aPrice - bPrice : bPrice - aPrice;
      });
    } else if (currentSort.field === "_createdDate") {
      filteredProducts = [...filteredProducts].sort((a, b) => {
        const aDate = new Date(a._createdDate || 0).getTime();
        const bDate = new Date(b._createdDate || 0).getTime();
        return currentSort.order === "ASC" ? aDate - bDate : bDate - aDate;
      });
    }

    productsList.set(filteredProducts);
    totalProducts.set(filteredProducts.length);
    hasProducts.set(filteredProducts.length > 0);
  };

  // Apply filtering and sorting to current products
  applyFiltersAndSort();

  // Set up browser navigation listener on client-side
  if (typeof window !== "undefined" && config.enableURLSync) {
    const handlePopState = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const { filter: urlFilter, sort: urlSort } =
          URLParamsService.parseSearchParams(searchParams);
        filter.set(urlFilter);
        sort.set(urlSort);
        applyFiltersAndSort();
      } catch (error) {
        console.warn("Failed to handle browser navigation:", error);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Clean up listener when service is destroyed
    // Note: This is a simplified cleanup - in a real implementation you'd want
    // to track this in the service lifecycle
  }

  // Expose a method to sync with current URL (to be called after hydration)
  const syncWithCurrentURL = () => {
    if (typeof window !== "undefined" && config.enableURLSync) {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const { filter: urlFilter, sort: urlSort } =
          URLParamsService.parseSearchParams(searchParams);
        filter.set(urlFilter);
        sort.set(urlSort);
        applyFiltersAndSort();
      } catch (error) {
        console.warn("Failed to sync with current URL:", error);
      }
    }
  };

  // New: setters with URL sync
  const setFilter = (newFilter: Record<string, any>) => {
    filter.set(newFilter);

    // Update URL if enabled
    if (config.enableURLSync && typeof window !== "undefined") {
      URLParamsService.updateURL(
        newFilter as FilterParams,
        sort.get() as SortParams
      );
    }

    // Apply filtering and sorting to current products
    applyFiltersAndSort();
  };

  const setSort = (newSort: { field: string; order: "ASC" | "DESC" }) => {
    sort.set(newSort);

    // Update URL if enabled
    if (config.enableURLSync && typeof window !== "undefined") {
      URLParamsService.updateURL(
        filter.get() as FilterParams,
        newSort as SortParams
      );
    }

    // Apply filtering and sorting to current products
    applyFiltersAndSort();
  };

  const buildQuery = () => {
    let query = productsV3.queryProducts();
    const f = filter.get();

    // Note: Price and option filtering will be handled client-side to avoid API limitations
    // Only use server-side filtering for fields that are known to work

    // Sorting - only use fields that are supported by the API
    const s = sort.get();
    if (s.field === "_createdDate") {
      if (s.order === "ASC") {
        query = query.ascending("_createdDate");
      } else {
        query = query.descending("_createdDate");
      }
    }
    // Note: Price sorting will be handled client-side

    return query;
  };

  const loadMore = async () => {
    try {
      isLoading.set(true);
      error.set(null);

      let query = buildQuery();

      const currentProducts = rawProductsList.get();
      const productResults = await query.limit(pageSize).find();

      const newProducts = [...currentProducts, ...(productResults.items || [])];
      rawProductsList.set(newProducts);

      // Apply filtering and sorting to the updated raw products
      applyFiltersAndSort();
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to load more products"
      );
    } finally {
      isLoading.set(false);
    }
  };

  const refresh = async () => {
    try {
      isLoading.set(true);
      error.set(null);

      let query = buildQuery();

      const productResults = await query.limit(pageSize).find();

      rawProductsList.set(productResults.items || []);

      // Apply filtering and sorting to the refreshed raw products
      applyFiltersAndSort();
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to refresh products"
      );
    } finally {
      isLoading.set(false);
    }
  };

  return {
    products: productsList,
    isLoading,
    error,
    totalProducts,
    hasProducts,
    loadMore,
    refresh,
    setFilter,
    setSort,
    filter,
    sort,
    syncWithCurrentURL,
  };
});

export async function loadCollectionServiceConfig(
  collectionId?: string,
  searchParams?: URLSearchParams
): Promise<ServiceFactoryConfig<typeof CollectionService>> {
  try {
    // Parse URL search parameters for initial filter and sort
    let initialFilter: Record<string, any> = {};
    let initialSort: { field: string; order: "ASC" | "DESC" } = {
      field: "_createdDate",
      order: "DESC",
    };

    if (searchParams) {
      const parsed = URLParamsService.parseSearchParams(searchParams);
      initialFilter = parsed.filter;
      initialSort = parsed.sort;
    }

    // Start with a basic query to get initial products
    let query = productsV3.queryProducts();

    // Only apply sorting that is known to work with the API
    if (initialSort.field === "_createdDate") {
      if (initialSort.order === "ASC") {
        query = query.ascending("_createdDate");
      } else {
        query = query.descending("_createdDate");
      }
    }
    // Note: All filtering will be handled client-side to avoid API limitations

    const productResults = await query.limit(12).find();

    return {
      initialProducts: productResults.items || [],
      pageSize: 12,
      collectionId,
      initialFilter,
      initialSort,
      enableURLSync: true,
    };
  } catch (error) {
    console.warn("Failed to load initial products:", error);
    return {
      initialProducts: [],
      pageSize: 12,
      collectionId,
      initialFilter: {},
      initialSort: { field: "_createdDate", order: "DESC" },
      enableURLSync: true,
    };
  }
}
