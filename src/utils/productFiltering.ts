import { productsV3 } from "@wix/stores";

// 🚨 CRITICAL FILTERING PATTERN - exactly as specified in the recipe
export const filterProductsByCategory = (
  products: productsV3.V3Product[], 
  selectedCategoryId: string | null
): productsV3.V3Product[] => {
  if (!selectedCategoryId || selectedCategoryId === 'all') return products;
  
  return products.filter(product => 
    // Check allCategoriesInfo first (from ALL_CATEGORIES_INFO field)
    product.allCategoriesInfo?.categories?.some((cat: any) => cat._id === selectedCategoryId)
  );
};

// Helper function to get products with proper fields for category filtering
export const getProductsQueryWithCategoryInfo = () => {
  return productsV3.queryProducts({
    fields: [
      'DESCRIPTION',
      'MEDIA_ITEMS_INFO',
      'VARIANT_OPTION_CHOICE_NAMES', 
      'CURRENCY',
      'URL',
      'ALL_CATEGORIES_INFO'  // Critical for category filtering
    ]
  });
}; 