import React from "react";
import { type Filter } from "../headless/store/filter-service";

interface SortDropdownProps {
  sortBy: Filter['sortBy'];
  onSortChange: (sortBy: Filter['sortBy']) => void;
  className?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  sortBy,
  onSortChange,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-white/80 text-sm whitespace-nowrap">Sort by:</span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as Filter['sortBy'])}
        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[160px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 8px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '16px',
        }}
      >
        <option value="name-asc" className="bg-gray-800 text-white">Name (A-Z)</option>
        <option value="name-desc" className="bg-gray-800 text-white">Name (Z-A)</option>
        <option value="price-asc" className="bg-gray-800 text-white">Price (Low to High)</option>
        <option value="price-desc" className="bg-gray-800 text-white">Price (High to Low)</option>
      </select>
    </div>
  );
};

export default SortDropdown; 