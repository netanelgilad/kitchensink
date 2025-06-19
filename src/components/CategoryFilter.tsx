import React, { useState, useEffect } from 'react';
import { categories } from '@wix/categories';

// Use the Wix SDK category type directly
type Category = categories.Category;

interface CategoryFilterProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  className?: string;
}

export default function CategoryFilter({ 
  onCategorySelect, 
  selectedCategory, 
  className = "" 
}: CategoryFilterProps) {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🚨 CRITICAL API PATTERN - exactly as specified in the recipe
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const categoriesResponse = await categories.queryCategories({
        treeReference: {
          appNamespace: '@wix/stores',
          treeKey: null
        }
      }).eq('visible', true).find();
      
      const fetchedCategories = categoriesResponse.items || [];
      
      // Filter out "All Products" category as per recipe instructions
      const filteredCategories = fetchedCategories.filter(
        cat => cat.name?.toLowerCase() !== 'all products'
      );
      
      setCategoriesList(filteredCategories);
    } catch (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      setError('Failed to load categories');
      setCategoriesList([]); // Continue without categories - graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className={`${className} flex justify-center py-4`}>
        <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-red-400 text-center py-4`}>
        {error}
      </div>
    );
  }

  if (categoriesList.length === 0) {
    return null; // No categories to show
  }

  return (
    <div className={`${className} bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6`}>
      <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
        Shop by Category
      </h3>
      
      {/* Category Navigation - Horizontal scrollable for mobile */}
      <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
        {/* All Products button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg transform scale-105'
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
          }`}
        >
          All Products
        </button>
        
        {/* Category buttons */}
        {categoriesList.map((category) => (
          <button
            key={category._id}
            onClick={() => onCategorySelect(category._id || null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              selectedCategory === category._id
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg transform scale-105'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Active category indicator */}
      {selectedCategory && (
        <div className="mt-3 text-sm text-white/60">
          Showing products in: {' '}
          <span className="text-teal-400 font-medium">
            {categoriesList.find(cat => cat._id === selectedCategory)?.name || 'Selected Category'}
          </span>
        </div>
      )}
    </div>
  );
} 