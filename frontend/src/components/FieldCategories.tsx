"use client";

import React from "react";

const CATEGORIES = [
  "All",
  "Carrots",
  "Vegetable",
  "Fruit",
  "Pumpkin",
  "Wheat",
  "Tomato",
];

interface FieldCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSeeAllClick?: () => void;
}

export function FieldCategories({
  selectedCategory,
  onSelectCategory,
  onSeeAllClick,
}: FieldCategoriesProps) {
  return (
    <div className="my-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#132b1e] tracking-tight">
          My Fields
        </h2>
        <button
          onClick={onSeeAllClick}
          className="text-xs font-semibold text-neutral-500 hover:text-[#132b1e] transition-colors"
        >
          See All
        </button>
      </div>

      {/* Scrollable Categories List */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? "bg-[#58a447] text-white shadow-cta-glow scale-102"
                  : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-[#eaf5e8] hover:text-[#132b1e]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
