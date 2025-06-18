import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";
import { productsV3, collections } from "@wix/stores";
import { categories as categoriesAPI } from "@wix/categories";
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

  // Category data
  categories: Signal<any[]>;
  selectedCategory: Signal<string | null>;
  currentCategoryInfo: Signal<{ name?: string; description?: string } | null>;

  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  setFilter: (newFilter: Record<string, any>) => void;
  setSort: (newSort: { field: string; order: "ASC" | "DESC" }) => void;
  setCategory: (categoryId: string | null) => void;
  filter: Signal<Record<string, any>>;
  sort: Signal<{ field: string; order: "ASC" | "DESC" }>;
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
  categoryId?: string;
  initialFilter?: Record<string, any>;
  initialSort?: { field: string; order: "ASC" | "DESC" };
  enableURLSync?: boolean;
  initialCategories?: any[];
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

  // Category/Collection signals
  const categories: Signal<any[]> = signalsService.signal(
    (config.initialCategories || []) as any
  );
  const selectedCategory: Signal<string | null> = signalsService.signal(
    (config.categoryId || null) as any
  );
  const currentCategoryInfo: Signal<{
    name?: string;
    description?: string;
  } | null> = signalsService.signal(null as any);

  const pageSize = config.pageSize || 12;

  // Use config values for initial state to ensure server/client consistency
  const filter: Signal<Record<string, any>> = signalsService.signal(
    (config.initialFilter || {}) as any
  );
  const sort: Signal<{ field: string; order: "ASC" | "DESC" }> =
    signalsService.signal(
      (config.initialSort || { field: "_createdDate", order: "DESC" }) as any
    );

  // Apply filtering and sorting to products
  const applyFiltersAndSort = () => {
    let filteredProducts = rawProductsList.get();
    const currentFilter = filter.get();
    const currentSort = sort.get();

    // Color filtering
    if (currentFilter.color && currentFilter.color.length > 0) {
      filteredProducts = filteredProducts.filter((product) => {
        return product.options?.some((opt: any) =>
          opt.choicesSettings?.choices?.some((choice: any) =>
            currentFilter.color.includes(choice.name)
          )
        );
      });
    }

    // Size filtering
    if (currentFilter.size && currentFilter.size.length > 0) {
      filteredProducts = filteredProducts.filter((product) => {
        return product.options?.some((opt: any) =>
          opt.choicesSettings?.choices?.some((choice: any) =>
            currentFilter.size.includes(choice.name)
          )
        );
      });
    }

    // Price filtering
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

    // Availability filtering
    if (currentFilter.availability && currentFilter.availability !== "all") {
      filteredProducts = filteredProducts.filter((product) => {
        // Check inventory availability status
        // For products with variants, check if any variant is in stock
        let isInStock = false;

        if (
          product.variantsInfo?.variants &&
          product.variantsInfo.variants.length > 0
        ) {
          // Check if any variant is in stock
          isInStock = product.variantsInfo.variants.some(
            (variant) => variant.inventoryStatus?.inStock === true
          );
        } else {
          // For single variant products, check the product's inventory status
          isInStock = product.inventory?.availabilityStatus !== "OUT_OF_STOCK";
        }

        if (currentFilter.availability === "inStock") {
          return isInStock;
        } else if (currentFilter.availability === "outOfStock") {
          return !isInStock;
        }
        return true; // 'all' case
      });
    }

    // Sorting
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
    } else if (currentSort.field === "popularity") {
      // For now, we'll sort by a combination of factors or just use creation date
      // In a real implementation, you might have a popularity score
      filteredProducts = [...filteredProducts].sort((a, b) => {
        // Placeholder: sort by creation date for now
        const aDate = new Date(a._createdDate || 0).getTime();
        const bDate = new Date(b._createdDate || 0).getTime();
        return bDate - aDate; // Most recent first for "popularity"
      });
    }

    productsList.set(filteredProducts);
    totalProducts.set(filteredProducts.length);
    hasProducts.set(filteredProducts.length > 0);
  };

  // Apply filtering and sorting to current products
  applyFiltersAndSort();

  // Set up browser navigation listener for back/forward buttons
  if (typeof window !== "undefined" && config.enableURLSync) {
    const handlePopState = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const { filter: urlFilter, sort: urlSort } =
          URLParamsService.parseSearchParams(searchParams);

        // Update both filter and sort without URL sync (since we're responding to URL changes)
        filter.set(urlFilter);
        sort.set(urlSort);
        applyFiltersAndSort();
      } catch (error) {
        console.warn("Failed to handle browser navigation:", error);
      }
    };

    window.addEventListener("popstate", handlePopState);
  }

  const setFilter = (newFilter: Record<string, any>) => {
    filter.set(newFilter);

    // Update URL and preserve current sort state
    if (config.enableURLSync && typeof window !== "undefined") {
      URLParamsService.updateURL(
        newFilter as FilterParams,
        sort.get() as SortParams
      );
    }

    applyFiltersAndSort();
  };

  const setSort = (newSort: { field: string; order: "ASC" | "DESC" }) => {
    sort.set(newSort);

    // Update URL and preserve current filter state
    if (config.enableURLSync && typeof window !== "undefined") {
      URLParamsService.updateURL(
        filter.get() as FilterParams,
        newSort as SortParams
      );
    }

    applyFiltersAndSort();
  };

  const setCategory = async (categoryId: string | null) => {
    selectedCategory.set(categoryId);

    // Load category info if categoryId is provided
    if (categoryId) {
      try {
        // Use the categories API correctly
        const categoryResult = await categoriesAPI
          .queryCategories({
            treeReference: {
              appNamespace: "@wix/stores",
              treeKey: "",
            },
          })
          .eq("_id", categoryId)
          .find();
        const category = categoryResult.items?.[0];
        currentCategoryInfo.set({
          name: category?.name || undefined,
          description: category?.description || undefined,
        });
      } catch (error) {
        console.warn("Failed to load category info:", error);
        currentCategoryInfo.set(null);
      }
    } else {
      currentCategoryInfo.set(null);
    }

    // Refresh products for the new category
    refresh();
  };

  const buildQuery = () => {
    let query = productsV3.queryProducts();
    const f = filter.get();

    // Apply server-side sorting for supported fields only
    const s = sort.get();
    if (s.field === "_createdDate") {
      if (s.order === "ASC") {
        query = query.ascending("_createdDate");
      } else {
        query = query.descending("_createdDate");
      }
    }

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
    categories,
    selectedCategory,
    currentCategoryInfo,
    loadMore,
    refresh,
    setFilter,
    setSort,
    setCategory,
    filter,
    sort,
  };
});

export async function loadCollectionServiceConfig(
  categoryId?: string,
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

    // Load categories data
    let categoriesData: any[] = [];
    try {
      // Try searchCategories with sorting
      const searchResult = await categoriesAPI.searchCategories({
        treeReference: {
          appNamespace: "@wix/stores",
        },
        search: {
          sort: [
            {
              fieldName: "createdDate",
              order: "ASC",
            },
          ],
        },
      });
      categoriesData = searchResult.categories || [];
    } catch (error) {
      console.error("Failed to load categories:", error);
      categoriesData = [];
    }

    // Start with a basic query to get initial products
    let query = productsV3.queryProducts();

    // Note: Category filtering would be done client-side or via different API
    // For now, we'll get all products and filter client-side if needed

    // Only apply sorting that is known to work with the API
    if (initialSort.field === "_createdDate") {
      if (initialSort.order === "ASC") {
        query = query.ascending("_createdDate");
      } else {
        query = query.descending("_createdDate");
      }
    }

    const productResults = await query.limit(12).find();

    return {
      initialProducts: productResults.items || [],
      pageSize: 12,
      categoryId,
      initialFilter,
      initialSort,
      enableURLSync: true,
      initialCategories: categoriesData,
    };
  } catch (error) {
    console.warn("Failed to load initial products:", error);
    return {
      initialProducts: [],
      pageSize: 12,
      categoryId,
      initialFilter: {},
      initialSort: { field: "_createdDate", order: "DESC" },
      enableURLSync: true,
      initialCategories: [],
    };
  }
}
