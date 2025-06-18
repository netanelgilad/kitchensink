// URL parameter service for collection filtering and sorting
export interface FilterParams {
  color?: string[];
  size?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface SortParams {
  field: string;
  order: "ASC" | "DESC";
}

export class URLParamsService {
  /**
   * Parse URL search parameters into filter and sort objects
   */
  static parseSearchParams(searchParams: URLSearchParams): {
    filter: FilterParams;
    sort: SortParams;
  } {
    const filter: FilterParams = {};
    const sort: SortParams = { field: "_createdDate", order: "DESC" };

    // Parse sort parameter
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      switch (sortParam.toLowerCase()) {
        case "newest":
          sort.field = "_createdDate";
          sort.order = "DESC";
          break;
        case "oldest":
          sort.field = "_createdDate";
          sort.order = "ASC";
          break;
        case "price_asc":
          sort.field = "price";
          sort.order = "ASC";
          break;
        case "price_desc":
          sort.field = "price";
          sort.order = "DESC";
          break;
      }
    }

    // Parse filter parameters
    const colorParam = searchParams.get("Color") || searchParams.get("color");
    if (colorParam) {
      filter.color = colorParam
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }

    const sizeParam = searchParams.get("Size") || searchParams.get("size");
    if (sizeParam) {
      filter.size = sizeParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const minPriceParam = searchParams.get("minPrice");
    if (minPriceParam && !isNaN(parseFloat(minPriceParam))) {
      filter.minPrice = parseFloat(minPriceParam);
    }

    const maxPriceParam = searchParams.get("maxPrice");
    if (maxPriceParam && !isNaN(parseFloat(maxPriceParam))) {
      filter.maxPrice = parseFloat(maxPriceParam);
    }

    return { filter, sort };
  }

  /**
   * Convert filter and sort objects to URL search parameters
   */
  static buildSearchParams(
    filter: FilterParams,
    sort: SortParams
  ): URLSearchParams {
    const params = new URLSearchParams();

    // Add sort parameter
    if (sort.field === "_createdDate") {
      if (sort.order === "DESC") {
        params.set("sort", "newest");
      } else {
        params.set("sort", "oldest");
      }
    } else if (sort.field === "price") {
      if (sort.order === "ASC") {
        params.set("sort", "price_asc");
      } else {
        params.set("sort", "price_desc");
      }
    }

    // Add filter parameters
    if (filter.color && filter.color.length > 0) {
      params.set("Color", filter.color.join(","));
    }

    if (filter.size && filter.size.length > 0) {
      params.set("Size", filter.size.join(","));
    }

    if (typeof filter.minPrice === "number") {
      params.set("minPrice", filter.minPrice.toString());
    }

    if (typeof filter.maxPrice === "number") {
      params.set("maxPrice", filter.maxPrice.toString());
    }

    return params;
  }

  /**
   * Update the current URL with new filter and sort parameters
   */
  static updateURL(
    filter: FilterParams,
    sort: SortParams,
    pathname: string = window.location.pathname
  ) {
    const params = this.buildSearchParams(filter, sort);
    const newURL = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    // Use history.replaceState to avoid adding to browser history for every filter change
    window.history.replaceState({}, "", newURL);
  }

  /**
   * Get current URL search parameters
   */
  static getCurrentSearchParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }
}
