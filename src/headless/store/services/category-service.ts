import { defineService, implementService } from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../../Signal";
import { categories } from "@wix/categories";

export interface CategoryServiceAPI {
  selectedCategory: Signal<string | null>;
  categories: Signal<categories.Category[]>;
}

export const CategoryServiceDefinition =
  defineService<CategoryServiceAPI>("category-service");

export interface CategoryServiceConfig {
  categories: categories.Category[];
}

export const CategoryService =
  implementService.withConfig<CategoryServiceConfig>()(
    CategoryServiceDefinition,
    ({ getService, config }) => {
      const signalsService = getService(SignalsServiceDefinition);

      const selectedCategory: Signal<string | null> = signalsService.signal(
        null as any
      );
      const categories: Signal<categories.Category[]> = signalsService.signal(
        config.categories as any
      );

      const navigateToCategory = (categoryId: string | null) => {
        selectedCategory.set(categoryId);
        
        // Update URL based on current path and category selection
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;

          // Determine the base path (example-1 or example-2)
          const isExample1 = currentPath.includes('/example-1');
          const isExample2 = currentPath.includes('/example-2');
          const basePath = isExample1 ? '/store/example-1' : isExample2 ? '/store/example-2' : '/store/example-1';

          let newPath;

          if (categoryId === null) {
            // No category selected - fallback to base path
            newPath = basePath;
          } else {
            // Find category to get its slug
            const category = config.categories.find((cat) => cat._id === categoryId);
            const categorySlug = category?.slug || categoryId;
            newPath = `${basePath}/category/${categorySlug}`;
          }

          // Clear all filters when changing categories - only navigate to the clean category URL
          window.location.href = newPath;
        }
      };

      return {
        selectedCategory,
        categories,
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

    // Sort categories to put "all-products" first, keep the rest in original order
    const allProductsCategory = fetchedCategories.find(cat => cat.slug === "all-products");
    const otherCategories = fetchedCategories.filter(cat => cat.slug !== "all-products");

    const allCategories = allProductsCategory
      ? [allProductsCategory, ...otherCategories]
      : fetchedCategories;

    return {
      categories: allCategories,
    };
  } catch (error) {
    console.warn("Failed to load categories:", error);
    return {
      categories: [],
    };
  }
}
