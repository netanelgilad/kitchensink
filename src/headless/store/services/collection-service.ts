import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../../Signal";
import { productsV3 } from "@wix/stores";
import { FilterServiceDefinition, type Filter } from "./filter-service";
import { CategoryServiceDefinition } from "./category-service";
import { SortServiceDefinition, type SortBy } from "./sort-service";
import { URLParamsUtils } from "../utils/url-params";

const searchProducts = async (searchOptions: any) => {
  const searchParams = {
    filter: searchOptions.search?.filter,
    sort: searchOptions.search?.sort,
    ...(searchOptions.paging && { cursorPaging: searchOptions.paging })
  };

  const options = {
    fields: searchOptions.fields || []
  };

  return await productsV3.searchProducts(searchParams, options);
};

export interface CollectionServiceAPI {
  products: Signal<productsV3.V3Product[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  totalProducts: Signal<number>;
  hasProducts: Signal<boolean>;
  hasMoreProducts: Signal<boolean>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Helper to build search options with supported filters
const buildSearchOptions = (filters?: Filter, selectedCategory?: string | null, sortBy?: SortBy) => {
  const searchOptions: any = {
    search: {},
    fields: [
      'PLAIN_DESCRIPTION',
      'MEDIA_ITEMS_INFO',
      'CURRENCY',
      'THUMBNAIL',
      'URL',
      'ALL_CATEGORIES_INFO'
    ]
  };

  // Build filter conditions array
  const filterConditions: any[] = [];

  // Add category filter if selected
  if (selectedCategory) {
    filterConditions.push({
      'allCategoriesInfo.categories': {
        $matchItems: [
          {
            id: {
              $in: [selectedCategory],
            },
          },
        ],
      },
    });
  }

  // Add price range filter if provided
  if (filters?.priceRange) {
    const { min, max } = filters.priceRange;
    if (min > 0) {
      filterConditions.push({
        "actualPriceRange.minValue.amount": { "$gte": min.toString() }
      });
    }
    if (max < 999999) {
      filterConditions.push({
        "actualPriceRange.maxValue.amount": { "$lte": max.toString() }
      });
    }
  }

  // Add product options filter if provided
  if (filters?.selectedOptions && Object.keys(filters.selectedOptions).length > 0) {
    for (const [optionId, choiceIds] of Object.entries(filters.selectedOptions)) {
      if (choiceIds.length > 0) {
        filterConditions.push({
          "options.choicesSettings.choices.choiceId": {
            "$hasSome": choiceIds
          }
        });
      }
    }
  }

  // Apply filters
  if (filterConditions.length > 0) {
    if (filterConditions.length === 1) {
      // Single condition - no need for $and wrapper
      searchOptions.search.filter = filterConditions[0];
    } else {
      // Multiple conditions - use $and
      searchOptions.search.filter = {
        $and: filterConditions
      };
    }
  }

  // Add sort if provided
  if (sortBy) {
    switch (sortBy) {
      case 'name-asc':
        searchOptions.search.sort = [{ fieldName: 'name', order: 'ASC' }];
        break;
      case 'name-desc':
        searchOptions.search.sort = [{ fieldName: 'name', order: 'DESC' }];
        break;
      case 'price-asc':
        searchOptions.search.sort = [{ fieldName: 'actualPriceRange.minValue.amount', order: 'ASC' }];
        break;
      case 'price-desc':
        searchOptions.search.sort = [{ fieldName: 'actualPriceRange.minValue.amount', order: 'DESC' }];
        break;
    }
  }

  return searchOptions;
};

export const CollectionServiceDefinition =
  defineService<CollectionServiceAPI>("collection");

export const CollectionService = implementService.withConfig<{
  initialProducts?: productsV3.V3Product[];
  pageSize?: number;
  initialCursor?: string;
  initialHasMore?: boolean;
}>()(CollectionServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);
  const collectionFilters = getService(FilterServiceDefinition);
  const categoryService = getService(CategoryServiceDefinition);
  const sortService = getService(SortServiceDefinition);
  const hasMoreProducts: Signal<boolean> = signalsService.signal(
    (config.initialHasMore ?? true) as any
  );
  let nextCursor: string | undefined = config.initialCursor;

  const initialProducts = config.initialProducts || [];

  void collectionFilters.calculateAvailableOptions(initialProducts);

  const pageSize = config.pageSize || 12;
  let allProducts: productsV3.V3Product[] = initialProducts;

  const loadMore = async () => {
    // Don't load more if there are no more products available
    if (!hasMoreProducts.get()) {
      return;
    }

    try {
      isLoading.set(true);
      error.set(null);

      const filters = collectionFilters.currentFilters.get();
      const selectedCategory = categoryService.selectedCategory.get();
      const sortBy = sortService.currentSort.get();
      const searchOptions = buildSearchOptions(filters, selectedCategory, sortBy);

      // Add pagination
      searchOptions.paging = { limit: pageSize };
      if (nextCursor) {
        searchOptions.paging.cursor = nextCursor;
      }

      const currentProducts = productsList.get();
      const productResults = await searchProducts(searchOptions);

      // Update cursor for next pagination
      nextCursor = productResults.pagingMetadata?.cursors?.next || undefined;

      // Check if there are more products to load
      const hasMore = Boolean(
        nextCursor &&
          productResults.products &&
          productResults.products.length === pageSize
      );
      hasMoreProducts.set(hasMore);

      // Update allProducts with the new data
      allProducts = [...allProducts, ...(productResults.products || []
      )];

      // All filtering is handled server-side
      const newProducts = productResults.products || [];

      productsList.set([...currentProducts, ...newProducts]);
      totalProducts.set(currentProducts.length + newProducts.length);
      hasProducts.set((currentProducts.length + newProducts.length) > 0);
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to load more products"
      );
    } finally {
      isLoading.set(false);
    }
  };

  const refresh = async (setTotalProducts: boolean = true) => {
    try {
      isLoading.set(true);
      error.set(null);

      const filters = collectionFilters.currentFilters.get();
      const selectedCategory = categoryService.selectedCategory.get();
      const sortBy = sortService.currentSort.get();
      const searchOptions = buildSearchOptions(filters, selectedCategory, sortBy);

      // Add pagination
      searchOptions.paging = { limit: pageSize };

      const productResults = await searchProducts(searchOptions);

      // Reset pagination state
      nextCursor = productResults.pagingMetadata?.cursors?.next || undefined;
      const hasMore = Boolean(
        productResults.pagingMetadata?.cursors?.next &&
          productResults.products &&
          productResults.products.length === pageSize
      );
      hasMoreProducts.set(hasMore);

      // Update allProducts with the new data
      allProducts = productResults.products || [];

      // All filtering is handled server-side
      productsList.set(allProducts);
      if (setTotalProducts) {
        totalProducts.set(allProducts.length);
      }

      hasProducts.set(allProducts.length > 0);
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to refresh products"
      );
    } finally {
      isLoading.set(false);
    }
  };

  // Refresh with server-side filtering when any filters change
  collectionFilters.currentFilters.subscribe(() => {
    // All filtering (categories, price, options) is now handled server-side
    refresh(false);
  });

  categoryService.selectedCategory.subscribe(() => {
    refresh(false);
  });

  sortService.currentSort.subscribe(() => {
    refresh(false);
  });

  return {
    products: productsList,
    isLoading,
    error,
    totalProducts,
    hasProducts,
    hasMoreProducts,
    loadMore,
    refresh,
  };
});

// Helper function to parse URL parameters
function parseURLParams(
  searchParams?: URLSearchParams,
  products: productsV3.V3Product[] = []
) {
  const initialFilters: Filter = {
    priceRange: { min: 0, max: 1000 },
    selectedOptions: {},
  };
  let initialSort: SortBy = "";

  if (!searchParams) return { initialSort, initialFilters };

  const urlParams = URLParamsUtils.parseSearchParams(searchParams);

  // Parse sort parameter
  const sortMap: Record<string, SortBy> = {
    name_asc: "name-asc",
    name_desc: "name-desc",
    price_asc: "price-asc",
    price_desc: "price-desc",
  };
  initialSort = sortMap[urlParams.sort as string] || "";

  if (products.length === 0) return { initialSort, initialFilters };

  // Calculate price range from products
  let minPrice = 0,
    maxPrice = 1000;
  products.forEach((product) => {
    const min = parseFloat(product.actualPriceRange?.minValue?.amount || "0");
    const max = parseFloat(product.actualPriceRange?.maxValue?.amount || "0");
    if (min > 0) minPrice = minPrice === 0 ? min : Math.min(minPrice, min);
    if (max > 0) maxPrice = Math.max(maxPrice, max);
  });
  initialFilters.priceRange = { min: minPrice, max: maxPrice };

  // Parse price filters from URL
  if (urlParams.minPrice) {
    const min = parseFloat(urlParams.minPrice as string);
    if (!isNaN(min)) initialFilters.priceRange.min = min;
  }
  if (urlParams.maxPrice) {
    const max = parseFloat(urlParams.maxPrice as string);
    if (!isNaN(max)) initialFilters.priceRange.max = max;
  }

  // Build options map and parse option filters
  const optionsMap = new Map<
    string,
    { id: string; choices: { id: string; name: string }[] }
  >();
  products.forEach((product) => {
    product.options?.forEach((option) => {
      if (!option._id || !option.name) return;
      if (!optionsMap.has(option.name)) {
        optionsMap.set(option.name, { id: option._id, choices: [] });
      }
      const optionData = optionsMap.get(option.name)!;
      option.choicesSettings?.choices?.forEach((choice) => {
        if (
          choice.choiceId &&
          choice.name &&
          !optionData.choices.find((c) => c.id === choice.choiceId)
        ) {
          optionData.choices.push({ id: choice.choiceId, name: choice.name });
        }
      });
    });
  });

  // Parse option filters from URL
  Object.entries(urlParams).forEach(([key, value]) => {
    if (["sort", "minPrice", "maxPrice"].includes(key)) return;
    const option = optionsMap.get(key);
    if (option) {
      const values = Array.isArray(value) ? value : [value];
      const matchingChoices = option.choices.filter((choice) =>
        values.includes(choice.name)
      );
      if (matchingChoices.length > 0) {
        initialFilters.selectedOptions[option.id] = matchingChoices.map(
          (c) => c.id
        );
      }
    }
  });

  return { initialSort, initialFilters };
}

export async function loadCollectionServiceConfig(
  collectionId?: string,
  searchParams?: URLSearchParams
): Promise<
  ServiceFactoryConfig<typeof CollectionService> & {
    initialCursor?: string;
    initialHasMore?: boolean;
    initialSort?: SortBy;
    initialFilters?: Filter;
  }
> {
  try {
    const searchOptions = buildSearchOptions();
    const pageSize = 12;
    searchOptions.paging = { limit: pageSize };

    const productResults = await searchProducts(searchOptions);

    // Parse URL parameters for initial state
    const { initialSort, initialFilters } = parseURLParams(
      searchParams,
      productResults.items || []
    );

    return {
      initialProducts: productResults.products || [],
      pageSize,
      initialCursor: productResults.pagingMetadata?.cursors?.next || undefined,
      initialHasMore: Boolean(
        productResults.pagingMetadata?.cursors?.next &&
          productResults.products &&
          productResults.products.length === pageSize
      ),
      initialSort,
      initialFilters,
    };
  } catch (error) {
    console.warn("Failed to load initial products:", error);
    const { initialSort, initialFilters } = parseURLParams(searchParams);
    return {
      initialProducts: [],
      pageSize: 12,
      initialHasMore: false,
      initialSort,
      initialFilters,
    };
  }
}
