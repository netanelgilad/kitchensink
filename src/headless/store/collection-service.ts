import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";
import { productsV3 } from "@wix/stores";

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
}>()(CollectionServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  const initialProducts = config.initialProducts || [];

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

  // New: filter and sort signals
  const filter: Signal<Record<string, any>> = signalsService.signal({});
  const sort: Signal<{ field: string; order: "ASC" | "DESC" }> =
    signalsService.signal({ field: "name", order: "ASC" });

  // New: setters
  const setFilter = (newFilter: Record<string, any>) => {
    filter.set(newFilter);
    refresh();
  };
  const setSort = (newSort: { field: string; order: "ASC" | "DESC" }) => {
    sort.set(newSort);
    refresh();
  };

  const buildQuery = () => {
    let query = productsV3.queryProducts();
    const f = filter.get();
    // Price filtering
    if (f.minPrice) {
      query = query.ge("actualPriceRange.minValue.amount", f.minPrice);
    }
    if (f.maxPrice) {
      query = query.le("actualPriceRange.minValue.amount", f.maxPrice);
    }
    // Color filtering
    if (f.color && Array.isArray(f.color) && f.color.length > 0) {
      // @ts-expect-error: options.Color is a valid field for Wix API, but not in local types
      query = query.hasSome("options.Color", f.color);
    }
    // Size filtering
    if (f.size && Array.isArray(f.size) && f.size.length > 0) {
      // @ts-expect-error: options.Size is a valid field for Wix API, but not in local types
      query = query.hasSome("options.Size", f.size);
    }
    // Sorting
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

      const currentProducts = productsList.get();
      const productResults = await query.limit(pageSize).find();

      const newProducts = [...currentProducts, ...(productResults.items || [])];
      productsList.set(newProducts);
      totalProducts.set(newProducts.length);
      hasProducts.set(newProducts.length > 0);
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

      productsList.set(productResults.items || []);
      totalProducts.set((productResults.items || []).length);
      hasProducts.set((productResults.items || []).length > 0);
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
  };
});

export async function loadCollectionServiceConfig(
  collectionId?: string
): Promise<ServiceFactoryConfig<typeof CollectionService>> {
  try {
    let query = productsV3.queryProducts();

    const productResults = await query.limit(12).find();

    return {
      initialProducts: productResults.items || [],
      pageSize: 12,
      collectionId,
    };
  } catch (error) {
    console.warn("Failed to load initial products:", error);
    return {
      initialProducts: [],
      pageSize: 12,
      collectionId,
    };
  }
}
