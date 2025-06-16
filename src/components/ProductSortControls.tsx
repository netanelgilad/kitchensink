import React, { useState } from "react";

interface ProductSortControlsProps {
  sort: { field: string; order: "ASC" | "DESC" };
  setSort: (sort: { field: string; order: "ASC" | "DESC" }) => void;
}

const SORT_OPTIONS = [
  { label: "Newest", value: { field: "_createdDate", order: "DESC" } },
  { label: "Oldest", value: { field: "_createdDate", order: "ASC" } },
  { label: "Price: Low to High", value: { field: "price", order: "ASC" } },
  { label: "Price: High to Low", value: { field: "price", order: "DESC" } },
];

export const ProductSortControls: React.FC<ProductSortControlsProps> = ({
  sort,
  setSort,
}) => {
  const [selected, setSelected] = useState(
    SORT_OPTIONS.findIndex(
      (o) => o.value.field === sort.field && o.value.order === sort.order
    )
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    setSelected(idx);
    setSort(SORT_OPTIONS[idx].value);
  };

  return (
    <div className="flex gap-4 items-end bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
      <div>
        <label className="block text-xs text-white/70 mb-1">Sort By</label>
        <select
          className="bg-white/10 text-white rounded px-2 py-1"
          value={selected}
          onChange={handleChange}
        >
          {SORT_OPTIONS.map((option, idx) => (
            <option key={option.label} value={idx}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProductSortControls;
