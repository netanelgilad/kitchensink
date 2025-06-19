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
  hasMoreProducts: Signal<boolean>;

  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const CollectionServiceDefinition =
  defineService<CollectionServiceAPI>("collection");

export const CollectionService = implementService.withConfig<{
  initialProducts?: productsV3.V3Product[];
  pageSize?: number;
  collectionId?: string;
  initialCursor?: string;
  initialHasMore?: boolean;
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
  const hasMoreProducts: Signal<boolean> = signalsService.signal((config.initialHasMore ?? true) as any);

  const pageSize = config.pageSize || 12;
  let nextCursor: string | undefined = config.initialCursor;

  const loadMore = async () => {
    // Don't load more if there are no more products available
    if (!hasMoreProducts.get()) {
      return;
    }

    try {
      isLoading.set(true);
      error.set(null);

      let query = productsV3.queryProducts({
        fields: [
          'DESCRIPTION',
          'MEDIA_ITEMS_INFO',
          'VARIANT_OPTION_CHOICE_NAMES', 
          'CURRENCY',
          'URL',
          'ALL_CATEGORIES_INFO'  // Critical for category filtering
        ]
      });

      // Apply cursor pagination if we have a next cursor
      if (nextCursor) {
        query = query.skipTo(nextCursor);
      }

      const currentProducts = productsList.get();
      const productResults = await query.limit(pageSize).find();

      // Update cursor for next pagination
      nextCursor = productResults.cursors?.next || undefined;
      
      // Check if there are more products to load
      const hasMore = Boolean(nextCursor && productResults.items && productResults.items.length === pageSize);
      hasMoreProducts.set(hasMore);

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

      let query = productsV3.queryProducts({
        fields: [
          'DESCRIPTION',
          'MEDIA_ITEMS_INFO',
          'VARIANT_OPTION_CHOICE_NAMES', 
          'CURRENCY',
          'URL',
          'ALL_CATEGORIES_INFO'  // Critical for category filtering
        ]
      });

      const productResults = await query.limit(pageSize).find();

      // Reset pagination state
      nextCursor = productResults.cursors?.next || undefined;
      const hasMore = Boolean(productResults.cursors?.next && productResults.items && productResults.items.length === pageSize);
      hasMoreProducts.set(hasMore);

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
    hasMoreProducts,
    loadMore,
    refresh,
  };
});

export async function loadCollectionServiceConfig(
  collectionId?: string
): Promise<ServiceFactoryConfig<typeof CollectionService> & { initialCursor?: string; initialHasMore?: boolean }> {
  try {
    // Query products with ALL_CATEGORIES_INFO field as required for category filtering
    let query = productsV3.queryProducts({
      fields: [
        'DESCRIPTION',
        'MEDIA_ITEMS_INFO',
        'VARIANT_OPTION_CHOICE_NAMES', 
        'CURRENCY',
        'URL',
        'ALL_CATEGORIES_INFO'  // Critical for category filtering
      ]
    });

    const productResults = await query.limit(12).find();

    return {
      initialProducts: productResults.items || [],
      pageSize: 12,
      collectionId,
      initialCursor: productResults.cursors?.next || undefined,
      initialHasMore: Boolean(productResults.cursors?.next && productResults.items && productResults.items.length === 12),
    };
  } catch (error) {
    console.warn("Failed to load initial products:", error);
    return {
      initialProducts: [],
      pageSize: 12,
      collectionId,
      initialHasMore: false,
    };
  }
}
