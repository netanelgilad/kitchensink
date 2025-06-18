import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";
import { productsV3 } from "@wix/stores";

export interface FilteredCollectionServiceAPI {
  products: Signal<productsV3.V3Product[]>;
  allProducts: Signal<productsV3.V3Product[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  totalProducts: Signal<number>;
  hasProducts: Signal<boolean>;
  currentFilters: Signal<{
    priceRange: { min: number; max: number };
    selectedOptions: { [optionId: string]: string[] };
  }>;

  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  applyFilters: (filters: {
    priceRange: { min: number; max: number };
    selectedOptions: { [optionId: string]: string[] };
  }) => void;
  clearFilters: () => void;
}

export const FilteredCollectionServiceDefinition =
  defineService<FilteredCollectionServiceAPI>("filtered-collection");

export const FilteredCollectionService = implementService.withConfig<{
  initialProducts?: productsV3.V3Product[];
  pageSize?: number;
  collectionId?: string;
}>()(FilteredCollectionServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  const initialProducts = config.initialProducts || [];

  const allProductsList: Signal<productsV3.V3Product[]> = signalsService.signal(
    initialProducts as any
  );
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
  const currentFilters: Signal<{
    priceRange: { min: number; max: number };
    selectedOptions: { [optionId: string]: string[] };
  }> = signalsService.signal({
    priceRange: { min: 0, max: 1000 },
    selectedOptions: {},
  } as any);

  const pageSize = config.pageSize || 12;

  // Helper function to check if a product matches the current filters
  const matchesFilters = (
    product: productsV3.V3Product,
    filters: {
      priceRange: { min: number; max: number };
      selectedOptions: { [optionId: string]: string[] };
    }
  ): boolean => {
    // Check price range
    const productPrice =
      product.actualPriceRange?.minValue?.amount ||
      product.actualPriceRange?.maxValue?.amount;

    if (productPrice) {
      const price = parseFloat(productPrice);
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }
    }

    // Check product options
    if (Object.keys(filters.selectedOptions).length > 0) {
      for (const [optionId, choiceIds] of Object.entries(
        filters.selectedOptions
      )) {
        if (choiceIds.length === 0) continue;

        const productOption = product.options?.find((opt) => opt._id === optionId);
        if (!productOption) return false;

        const productChoices =
          productOption.choicesSettings?.choices?.map((c) => c.choiceId) || [];
        const hasMatchingChoice = choiceIds.some((choiceId) =>
          productChoices.includes(choiceId)
        );

        if (!hasMatchingChoice) return false;
      }
    }

    return true;
  };

  // Apply filters to the product list
  const applyFilters = (filters: {
    priceRange: { min: number; max: number };
    selectedOptions: { [optionId: string]: string[] };
  }) => {
    currentFilters.set(filters);
    const allProds = allProductsList.get();
    const filteredProducts = allProds.filter((product) =>
      matchesFilters(product, filters)
    );

    productsList.set(filteredProducts);
    totalProducts.set(filteredProducts.length);
    hasProducts.set(filteredProducts.length > 0);
  };

  // Clear all filters
  const clearFilters = () => {
    const initialFilters = {
      priceRange: { min: 0, max: 1000 },
      selectedOptions: {},
    };
    currentFilters.set(initialFilters);
    const allProds = allProductsList.get();
    productsList.set(allProds);
    totalProducts.set(allProds.length);
    hasProducts.set(allProds.length > 0);
  };

  const loadMore = async () => {
    try {
      isLoading.set(true);
      error.set(null);

      let query = productsV3.queryProducts();

      const currentProducts = allProductsList.get();
      const productResults = await query.limit(pageSize).find();
      const newProducts = [...currentProducts, ...(productResults.items || [])];
      
      allProductsList.set(newProducts);
      
      // Apply current filters to the new products
      const filters = currentFilters.get();
      applyFilters(filters);
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

      let query = productsV3.queryProducts();

      const productResults = await query.limit(pageSize).find();

      allProductsList.set(productResults.items || []);
      
      // Apply current filters
      const filters = currentFilters.get();
      applyFilters(filters);
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
    allProducts: allProductsList,
    isLoading,
    error,
    totalProducts,
    hasProducts,
    currentFilters,
    loadMore,
    refresh,
    applyFilters,
    clearFilters,
  };
});

export async function loadFilteredCollectionServiceConfig(
  collectionId?: string
): Promise<ServiceFactoryConfig<typeof FilteredCollectionService>> {
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