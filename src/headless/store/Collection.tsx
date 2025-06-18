import type { ServiceAPI } from "@wix/services-definitions";
import { useService } from "@wix/services-manager-react";
import { CollectionServiceDefinition } from "./collection-service";
import { productsV3 } from "@wix/stores";
import { useState, useEffect } from "react";
import type { Signal, ReadOnlySignal } from "../Signal";

/**
 * Props for Grid headless component
 */
export interface GridProps {
  /** Render prop function that receives product grid data */
  children: (props: GridRenderProps) => React.ReactNode;
}

/**
 * Render props for Grid component
 */
export interface GridRenderProps {
  /** Array of products */
  products: productsV3.V3Product[];
  /** Whether products are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are no products */
  isEmpty: boolean;
  /** Total number of products */
  totalProducts: number;
  /** Whether collection has products */
  hasProducts: boolean;
}

/**
 * Headless component for product grid
 */
export const Grid = (props: GridProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  // Use useSignal hook to subscribe to signal changes
  const products = useSignal(service?.products) || [];
  const isLoading = useSignal(service?.isLoading) || false;
  const error = useSignal(service?.error) || null;
  const totalProducts = useSignal(service?.totalProducts) || 0;
  const hasProducts = useSignal(service?.hasProducts) || false;

  // Debug logging to help identify service issues
  if (!service) {
    console.error("CollectionService is undefined");
    return props.children({
      products: [],
      isLoading: false,
      error: "Service not available",
      isEmpty: true,
      totalProducts: 0,
      hasProducts: false,
    });
  }

  return props.children({
    products,
    isLoading,
    error,
    isEmpty: !hasProducts && !isLoading,
    totalProducts,
    hasProducts,
  });
};

/**
 * Props for Item headless component
 */
export interface ItemProps {
  /** Product data */
  product: productsV3.V3Product;
  /** Render prop function that receives product item data */
  children: (props: ItemRenderProps) => React.ReactNode;
}

/**
 * Render props for Item component
 */
export interface ItemRenderProps {
  /** Product ID */
  id: string;
  /** Product title */
  title: string;
  /** Product slug for URL */
  slug: string;
  /** Main product image URL */
  image: string | null;
  /** Product price */
  price: string;
  /** Product description */
  description: string;
  /** Whether product is available */
  available: boolean;
  /** Product URL */
  href: string;
}

/**
 * Headless component for individual product item
 */
export const Item = (props: ItemProps) => {
  const { product } = props;

  // Use actual v3 API structure based on real data
  // Images are in media.main.image, not media.itemsInfo.items
  const image = product?.media?.main?.image || null;

  // Create formatted price since formattedAmount is not available
  const rawAmount = product.actualPriceRange?.minValue?.amount;
  const price = rawAmount ? `$${rawAmount}` : "$0.00";

  const available = product.inventory?.availabilityStatus === "IN_STOCK";
  const description =
    typeof product.description === "string" ? product.description : "";

  return props.children({
    id: product._id || "",
    title: product.name || "",
    slug: product.slug || "",
    image,
    price,
    description,
    available,
    href: `/store/products/${product.slug}`,
  });
};

/**
 * Props for LoadMore headless component
 */
export interface LoadMoreProps {
  /** Render prop function that receives load more data */
  children: (props: LoadMoreRenderProps) => React.ReactNode;
}

/**
 * Render props for LoadMore component
 */
export interface LoadMoreRenderProps {
  /** Function to load more products */
  loadMore: () => Promise<void>;
  /** Function to refresh products */
  refresh: () => Promise<void>;
  /** Whether load more is currently loading */
  isLoading: boolean;
  /** Whether there are products */
  hasProducts: boolean;
  /** Total number of products currently loaded */
  totalProducts: number;
}

/**
 * Headless component for load more products functionality
 * Note: V3 API uses simplified loading without traditional pagination
 */
export const LoadMore = (props: LoadMoreProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  // Use useSignal hook to subscribe to signal changes
  const isLoading = useSignal(service?.isLoading) || false;
  const hasProducts = useSignal(service?.hasProducts) || false;
  const totalProducts = useSignal(service?.totalProducts) || 0;

  // Error handling for undefined service
  if (!service) {
    console.error("CollectionService is undefined in LoadMore");
    return props.children({
      loadMore: async () => {},
      refresh: async () => {},
      isLoading: false,
      hasProducts: false,
      totalProducts: 0,
    });
  }

  return props.children({
    loadMore: service.loadMore || (async () => {}),
    refresh: service.refresh || (async () => {}),
    isLoading,
    hasProducts,
    totalProducts,
  });
};

/**
 * Props for Header headless component
 */
export interface HeaderProps {
  /** Render prop function that receives collection header data */
  children: (props: HeaderRenderProps) => React.ReactNode;
}

/**
 * Render props for Header component
 */
export interface HeaderRenderProps {
  /** Total number of products */
  totalProducts: number;
  /** Whether collection is loading */
  isLoading: boolean;
  /** Whether collection has products */
  hasProducts: boolean;
}

/**
 * Headless component for collection header with product count
 */
export const Header = (props: HeaderProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  // Use useSignal hook to subscribe to signal changes
  const totalProducts = useSignal(service?.totalProducts) || 0;
  const isLoading = useSignal(service?.isLoading) || false;
  const hasProducts = useSignal(service?.hasProducts) || false;

  // Error handling for undefined service
  if (!service) {
    console.error("CollectionService is undefined in Header");
    return props.children({
      totalProducts: 0,
      isLoading: false,
      hasProducts: false,
    });
  }

  return props.children({
    totalProducts,
    isLoading,
    hasProducts,
  });
};

/**
 * Props for Actions headless component
 */
export interface ActionsProps {
  /** Render prop function that receives collection actions data */
  children: (props: ActionsRenderProps) => React.ReactNode;
}

/**
 * Render props for Actions component
 */
export interface ActionsRenderProps {
  /** Function to refresh the collection */
  refresh: () => Promise<void>;
  /** Function to load more products */
  loadMore: () => Promise<void>;
  /** Whether actions are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Headless component for collection actions (refresh, load more)
 * Replaces traditional pagination for V3 API
 */
export const Actions = (props: ActionsProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  // Use useSignal hook to subscribe to signal changes
  const isLoading = useSignal(service?.isLoading) || false;
  const error = useSignal(service?.error) || null;

  // Error handling for undefined service
  if (!service) {
    console.error("CollectionService is undefined in Actions");
    return props.children({
      refresh: async () => {},
      loadMore: async () => {},
      isLoading: false,
      error: "Service not available",
    });
  }

  return props.children({
    refresh: service.refresh || (async () => {}),
    loadMore: service.loadMore || (async () => {}),
    isLoading,
    error,
  });
};

/**
 * Render props for Filter component
 */
export interface FilterRenderProps {
  /** Current filter state */
  filter: Record<string, any>;
  /** Function to set entire filter object */
  setFilter: (filter: Record<string, any>) => void;
}

/**
 * Props for Filter headless component
 */
export interface FilterProps {
  /** Render prop function that receives filter data and actions */
  children: (props: FilterRenderProps) => React.ReactNode;
}

/**
 * Headless component for filter controls
 */
export const Filter = (props: FilterProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  // Use useSignal hook to subscribe to signal changes
  const filter = useSignal(service?.filter) || {};

  if (!service) {
    console.error("CollectionService is undefined in Filter");
    return props.children({
      filter: {},
      setFilter: () => {},
    });
  }

  return props.children({
    filter,
    setFilter: service.setFilter || (() => {}),
  });
};

/**
 * Render props for Sort component
 */
export interface SortRenderProps {
  /** Current sort state */
  sort: { field: string; order: "ASC" | "DESC" };
  /** Function to set sort */
  setSort: (sort: { field: string; order: "ASC" | "DESC" }) => void;
}

/**
 * Props for Sort headless component
 */
export interface SortProps {
  /** Render prop function that receives sort data and actions */
  children: (props: SortRenderProps) => React.ReactNode;
}

/**
 * Headless component for sort controls
 */
export const Sort = (props: SortProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  // Use useSignal hook to subscribe to signal changes
  const sort = useSignal(service?.sort) || {
    field: "_createdDate",
    order: "DESC",
  };

  if (!service) {
    console.error("CollectionService is undefined in Sort");
    return props.children({
      sort: { field: "_createdDate", order: "DESC" },
      setSort: () => {},
    });
  }

  return props.children({
    sort,
    setSort: service.setSort || (() => {}),
  });
};

/**
 * Render props for Categories component
 */
export interface CategoriesRenderProps {
  /** Available categories */
  categories: any[];
  /** Currently selected category ID */
  selectedCategory: string | null;
  /** Function to set the selected category */
  setCategory: (categoryId: string | null) => void;
  /** Loading state for categories */
  isLoading: boolean;
}

/**
 * Props for Categories headless component
 */
export interface CategoriesProps {
  /** Render prop function that receives categories data and actions */
  children: (props: CategoriesRenderProps) => React.ReactNode;
}

/**
 * Headless component for category navigation
 */
export const Categories = (props: CategoriesProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  const categories = useSignal(service?.categories) || [];
  const selectedCategory = useSignal(service?.selectedCategory) || null;
  const isLoading = useSignal(service?.isLoading) || false;

  if (!service) {
    console.error("CollectionService is undefined in Categories");
    return props.children({
      categories: [],
      selectedCategory: null,
      setCategory: () => {},
      isLoading: false,
    });
  }

  return props.children({
    categories,
    selectedCategory,
    setCategory: service.setCategory || (() => {}),
    isLoading,
  });
};

/**
 * Render props for CollectionHeader component
 */
export interface CollectionHeaderRenderProps {
  /** Current category information */
  categoryInfo: { name?: string; description?: string } | null;
  /** Selected category ID */
  selectedCategory: string | null;
}

/**
 * Props for CollectionHeader headless component
 */
export interface CollectionHeaderProps {
  /** Render prop function that receives category header data */
  children: (props: CollectionHeaderRenderProps) => React.ReactNode;
}

/**
 * Headless component for category header information
 */
export const CollectionHeader = (props: CollectionHeaderProps) => {
  const service = useService(CollectionServiceDefinition) as ServiceAPI<
    typeof CollectionServiceDefinition
  >;

  const categoryInfo = useSignal(service?.currentCategoryInfo) || null;
  const selectedCategory = useSignal(service?.selectedCategory) || null;

  if (!service) {
    console.error("CollectionService is undefined in CollectionHeader");
    return props.children({
      categoryInfo: null,
      selectedCategory: null,
    });
  }

  return props.children({
    categoryInfo,
    selectedCategory,
  });
};

// Hook to subscribe to signal changes and trigger React re-renders
function useSignal<T>(
  signal: Signal<T> | ReadOnlySignal<T> | undefined
): T | undefined {
  const [value, setValue] = useState<T | undefined>(() => signal?.get());

  useEffect(() => {
    if (!signal) return;

    // Set initial value
    setValue(signal.get());

    // Subscribe to changes
    const unsubscribe = signal.subscribe((newValue: T) => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [signal]);

  return value;
}

// Namespace export for clean API
export const Collection = {
  Grid,
  Item,
  LoadMore,
  Header,
  Actions,
  Filter,
  Sort,
  Categories,
  CollectionHeader,
} as const;
