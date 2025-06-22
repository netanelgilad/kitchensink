import React, { useState, useEffect } from "react";
import { categories } from "@wix/categories";
import { Category } from "../headless/store/components/Category";

// Use the Wix SDK category type directly
type Category = categories.Category;

interface CategoryPickerProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  categories: categories.Category[];
  className?: string;
}

function CategoryPicker({
  onCategorySelect,
  selectedCategory,
  categories,
  className = "",
}: CategoryPickerProps) {
  if (categories.length === 0) {
    return null; // No categories to show
  }

  // Determine the current store example from the URL
  const getCurrentStoreExample = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/store/example-1')) return 'example-1';
      if (path.includes('/store/example-2')) return 'example-2';
    }
    return 'example-1'; // fallback
  };

  // Navigate to category URL
  const navigateToCategory = (categorySlug: string | null) => {
    if (typeof window !== 'undefined') {
      const storeExample = getCurrentStoreExample();
      const baseUrl = `/store/${storeExample}/category`;
      const targetUrl = categorySlug ? `${baseUrl}/${categorySlug}` : `${baseUrl}/all-products`;
      
      // Preserve current query parameters
      const currentParams = new URLSearchParams(window.location.search);
      const queryString = currentParams.toString();
      const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
      
      window.location.href = finalUrl;
    }
  };

  // Create a slug from category name for URL
  const createCategorySlug = (categoryName: string) => {
    return categoryName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .trim();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
          Shop by Category
        </h3>
      </div>

      {/* Category Navigation - Horizontal scrollable for mobile */}
      <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
        {/* All Products button */}
        <button
          onClick={() => navigateToCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            selectedCategory === null
              ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg transform scale-105"
              : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
          }`}
        >
          All Products
        </button>

        {/* Category buttons */}
        {categories.map((category) => {
          const categorySlug = category.slug || createCategorySlug(category.name || '');
          return (
            <button
              key={category._id}
              onClick={() => navigateToCategory(categorySlug)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedCategory === category._id
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg transform scale-105"
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CategoryPickerWithContext({
  className,
}: {
  className?: string;
}) {
  return (
    <Category.Provider>
      <Category.List>
        {({ categories, selectedCategory, navigateToCategory }) => (
          <CategoryPicker
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={navigateToCategory}
            className={className}
          />
        )}
      </Category.List>
    </Category.Provider>
  );
}
