import React, { useState, useEffect } from 'react';
import { categories } from '@wix/categories';
import { Category } from '../headless/store/Category';
import SortDropdown from './SortDropdown';
import { type Filter } from '../headless/store/filter-service';

// Use the Wix SDK category type directly
type Category = categories.Category;

interface CategoryPickerProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  categories: categories.Category[];
  className?: string;
  sortBy?: Filter['sortBy'];
  onSortChange?: (sortBy: Filter['sortBy']) => void;
}

function CategoryPicker({ 
  onCategorySelect, 
  selectedCategory,
  categories,
  className = "",
  sortBy,
  onSortChange
}: CategoryPickerProps) {
  if (categories.length === 0) {
    return null; // No categories to show
  }

  return (
    <div className={`${className} bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
          Shop by Category
        </h3>
        {sortBy && onSortChange && (
          <SortDropdown
            sortBy={sortBy}
            onSortChange={onSortChange}
            className="ml-4"
          />
        )}
      </div>
      
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
        {categories.map((category) => (
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
            {categories.find(cat => cat._id === selectedCategory)?.name || 'Selected Category'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CategoryPickerWithContext({
  className,
  sortBy,
  onSortChange
}: {
  className?: string;
  sortBy?: Filter['sortBy'];
  onSortChange?: (sortBy: Filter['sortBy']) => void;
}) {
  return (<Category.Provider>
    <Category.List>
      {({ categories, selectedCategory, setSelectedCategory }) => (
        <CategoryPicker 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onCategorySelect={setSelectedCategory} 
          className={className}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      )}
    </Category.List>
  </Category.Provider>);
}