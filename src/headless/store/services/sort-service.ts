import { defineService, implementService } from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../../Signal";
import { URLParamsService } from "./url-params-service";

export type SortBy = "" | "name-asc" | "name-desc" | "price-asc" | "price-desc";

export interface SortServiceAPI {
  currentSort: Signal<SortBy>;
  setSortBy: (sortBy: SortBy) => Promise<void>;
}

export const SortServiceDefinition = defineService<SortServiceAPI>("sort");

export const defaultSort: SortBy = "";

export const SortService = implementService.withConfig<{
  initialSort?: SortBy;
}>()(SortServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  const currentSort: Signal<SortBy> = signalsService.signal(
    (config.initialSort || defaultSort) as any
  );

  const setSortBy = async (sortBy: SortBy) => {
    currentSort.set(sortBy);

    // Update URL with sort parameter
    try {
      const currentParams = URLParamsService.getURLParams();

      // Convert SortBy to URL format (like Wix site)
      let sortParam = "";
      switch (sortBy) {
        case "name-asc":
          sortParam = "name_asc";
          break;
        case "name-desc":
          sortParam = "name_desc";
          break;
        case "price-asc":
          sortParam = "price_asc";
          break;
        case "price-desc":
          sortParam = "price_desc";
          break;
        case "":
          sortParam = "newest"; // Default like Wix site
          break;
        default:
          sortParam = "newest";
      }

      const urlParams = { ...currentParams };
      if (sortParam && sortParam !== "newest") {
        urlParams.sort = sortParam;
      } else {
        delete urlParams.sort; // Remove default sort from URL
      }

      URLParamsService.updateURL(urlParams);
    } catch (error) {
      console.warn("Failed to update URL with sort parameter:", error);
    }
  };

  return {
    currentSort,
    setSortBy,
  };
});
