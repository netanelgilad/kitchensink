import { defineService, implementService } from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../../Signal";
import { categories } from "@wix/categories";

export interface CategoryServiceAPI {
  selectedCategory: Signal<string | null>;
  categories: Signal<categories.Category[]>;
  navigateToCategory: (categoryId: string | null) => void;
}

export const CategoryServiceDefinition =
  defineService<CategoryServiceAPI>("category-service");

export interface CategoryServiceConfig {
  categories: categories.Category[];
  initialCategoryId?: string | null;
}

export const CategoryService =
  implementService.withConfig<CategoryServiceConfig>()(
    CategoryServiceDefinition,
    ({ getService, config }) => {
      const signalsService = getService(SignalsServiceDefinition);

      const selectedCategory: Signal<string | null> = signalsService.signal(
        (config.initialCategoryId || null) as any
      );
      const categories: Signal<categories.Category[]> = signalsService.signal(
        config.categories as any
      );

      const navigateToCategory = (categoryId: string | null) => {
        selectedCategory.set(categoryId);
        
        // Update URL based on current path and category selection
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const searchParams = new URLSearchParams(window.location.search);
          
          // Determine the base path (example-1 or example-2)
          const isExample1 = currentPath.includes('/example-1');
          const isExample2 = currentPath.includes('/example-2');
          const basePath = isExample1 ? '/store/example-1' : isExample2 ? '/store/example-2' : '/store/example-1';
          
          let newPath;
          
          if (categoryId === null) {
            // Navigate to "All Products" - use dedicated all-products route
            newPath = `${basePath}/category/all-products`;
          } else {
            // Find category to get its slug
            const category = config.categories.find((cat) => cat._id === categoryId);
            const categorySlug = category?.slug || categoryId;
            newPath = `${basePath}/category/${categorySlug}`;
          }
          
          // Preserve existing query parameters
          const queryString = searchParams.toString();
          const fullUrl = queryString ? `${newPath}?${queryString}` : newPath;
          
          // Navigate to the new URL
          window.location.href = fullUrl;
        }
      };

      return {
        selectedCategory,
        categories,
        navigateToCategory,
      };
    }
  );

export async function loadCategoriesConfig() {
  try {
    const categoriesResponse = await categories
      .queryCategories({
        treeReference: {
          appNamespace: "@wix/stores",
          treeKey: null,
        },
      })
      .eq("visible", true)
      .find();

    const fetchedCategories = categoriesResponse.items || [];

    // Filter out "All Products" category as per recipe instructions
    const filteredCategories = fetchedCategories.filter(
      (cat) => cat.name?.toLowerCase() !== "all products"
    );

    return {
      categories: filteredCategories,
    };
  } catch (error) {
    console.warn("Failed to load categories:", error);
    return {
      categories: [],
    };
  }
}
