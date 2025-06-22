import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../../Signal";
import { productsV3 } from "@wix/stores";

const searchProducts = async (searchOptions: any) => {
  const searchParams = {
    filter: searchOptions.search?.filter,
    sort: searchOptions.search?.sort,
    ...(searchOptions.cursorPaging && { cursorPaging: searchOptions.cursorPaging })
  };

  const options = {
    fields: searchOptions.fields || []
  };

  return await productsV3.searchProducts(searchParams, options);
};

export interface CatalogPriceRange {
  minPrice: number;
  maxPrice: number;
}

export interface CatalogPriceRangeServiceAPI {
  catalogPriceRange: Signal<CatalogPriceRange | null>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  loadCatalogPriceRange: (categoryId?: string) => Promise<void>;
}

export const CatalogPriceRangeServiceDefinition =
  defineService<CatalogPriceRangeServiceAPI>("catalogPriceRange");

export const CatalogPriceRangeService = implementService.withConfig<{}>()(
  CatalogPriceRangeServiceDefinition,
  ({ getService, config }) => {
    const signalsService = getService(SignalsServiceDefinition);

    // Signal declarations
    const catalogPriceRange: Signal<CatalogPriceRange | null> = signalsService.signal(null as any);
    const isLoading: Signal<boolean> = signalsService.signal(false as any);
    const error: Signal<string | null> = signalsService.signal(null as any);

    /**
     * Load the catalog-wide price range using multiple queries
     * This fetches min/max prices from ALL products in the catalog
     * Uses sorting to get the cheapest and most expensive products
     */
    const loadCatalogPriceRange = async (categoryId?: string): Promise<void> => {
      isLoading.set(true);
      error.set(null);

      try {
        // Build search options using the same format as the working search
        const buildCatalogSearchOptions = (sortField: string, sortOrder: 'ASC' | 'DESC') => {
          const searchOptions: any = {
            search: {
              sort: [{ fieldName: sortField, order: sortOrder }]
            },
            cursorPaging: { limit: 1 },
            fields: [
              "PLAIN_DESCRIPTION",
              "MEDIA_ITEMS_INFO", 
              "CURRENCY",
              "THUMBNAIL",
              "URL",
              "ALL_CATEGORIES_INFO"
            ]
          };

          // Add category filter if specified (using the correct $matchItems format)
          if (categoryId && categoryId !== 'all-products') {
            searchOptions.search.filter = {
              "allCategoriesInfo.categories": {
                $matchItems: [
                  {
                    id: {
                      $in: [categoryId],
                    },
                  },
                ],
              },
            };
          }

          return searchOptions;
        };

        // Query for the cheapest product (sort by price ascending)
        const minPriceQuery = await searchProducts(
          buildCatalogSearchOptions('actualPriceRange.minValue.amount', 'ASC')
        );

        // Query for the most expensive product (sort by price descending) 
        const maxPriceQuery = await searchProducts(
          buildCatalogSearchOptions('actualPriceRange.maxValue.amount', 'DESC')
        );

        let minPrice = 0;
        let maxPrice = 0;

        // Extract min price from cheapest product
        if (minPriceQuery.products && minPriceQuery.products.length > 0) {
          const cheapestProduct = minPriceQuery.products[0];
          minPrice = parseFloat(cheapestProduct.actualPriceRange?.minValue?.amount || '0');
        }

        // Extract max price from most expensive product
        if (maxPriceQuery.products && maxPriceQuery.products.length > 0) {
          const expensiveProduct = maxPriceQuery.products[0];
          maxPrice = parseFloat(expensiveProduct.actualPriceRange?.maxValue?.amount || '0');
        }

        // Only set price range if we found valid products with prices
        if (minPrice > 0 || maxPrice > 0) {
          catalogPriceRange.set({
            minPrice,
            maxPrice
          });
        } else {
          // No products found or no valid prices - don't show the filter
          catalogPriceRange.set(null);
        }

      } catch (err) {
        console.error('Failed to load catalog price range:', err);
        error.set(err instanceof Error ? err.message : 'Failed to load price range');
        
        // Don't set fallback values - let the component handle the error state
        catalogPriceRange.set(null);
      } finally {
        isLoading.set(false);
      }
    };

    return {
      catalogPriceRange,
      isLoading,
      error,
      loadCatalogPriceRange,
    };
  }
);

export async function loadCatalogPriceRangeServiceConfig(): Promise<
  ServiceFactoryConfig<typeof CatalogPriceRangeService>
> {
  return {};
} 