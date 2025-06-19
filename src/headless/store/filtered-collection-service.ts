import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal, ReadOnlySignal } from "../Signal";
import { productsV3 } from "@wix/stores";
import { CollectionService, CollectionServiceDefinition } from "./collection-service";

export interface FilteredCollectionServiceAPI {
  products: Signal<productsV3.V3Product[]>;
  allProducts: Signal<productsV3.V3Product[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  totalProducts: ReadOnlySignal<number>;
  hasProducts: ReadOnlySignal<boolean>;
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
  const collectionService = getService(CollectionServiceDefinition);

  const filteredProducts: Signal<productsV3.V3Product[]> = signalsService.signal(
    [] as any
  );
  const currentFilters: Signal<{
    priceRange: { min: number; max: number };
    selectedOptions: { [optionId: string]: string[] };
  }> = signalsService.signal({
    priceRange: { min: 0, max: 1000 },
    selectedOptions: {},
  } as any);

  // Derived signals based on filtered products
  const totalProducts: ReadOnlySignal<number> = signalsService.computed(() => 
    filteredProducts.get().length
  );
  const hasProducts: ReadOnlySignal<boolean> = signalsService.computed(() => 
    filteredProducts.get().length > 0
  );

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
    const allProducts = collectionService.products.get();
    const filtered = allProducts.filter((product) =>
      matchesFilters(product, filters)
    );
    filteredProducts.set(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    const initialFilters = {
      priceRange: { min: 0, max: 1000 },
      selectedOptions: {},
    };
    currentFilters.set(initialFilters);
    const allProducts = collectionService.products.get();
    filteredProducts.set(allProducts);
  };

  // Watch for changes in the collection service's products and re-apply filters
  signalsService.effect(() => {
    const allProducts = collectionService.products.get();
    const filters = currentFilters.get();
    const filtered = allProducts.filter((product) =>
      matchesFilters(product, filters)
    );
    filteredProducts.set(filtered);
  });

  // Delegate loading operations to the collection service
  const loadMore = async () => {
    await collectionService.loadMore();
    // The effect above will automatically re-apply filters to the new products
  };

  const refresh = async () => {
    await collectionService.refresh();
    // The effect above will automatically re-apply filters to the refreshed products
  };

  // Initialize filtered products with all products
  const allProducts = collectionService.products.get();
  filteredProducts.set(allProducts);

  return {
    products: filteredProducts,
    allProducts: collectionService.products,
    isLoading: collectionService.isLoading,
    error: collectionService.error,
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
  // Delegate to collection service config loading
  return {
    initialProducts: [],
    pageSize: 12,
    collectionId,
  };
} 