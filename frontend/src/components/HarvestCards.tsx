"use client";

import React, { useState } from "react";
import { Bookmark, ArrowUpRight } from "lucide-react";

interface WorkflowCard {
  id: string;
  title: string;
  description: string;
  cropCategory: string;
  imageUrl: string;
  statusBadge?: string;
}

const CARDS: WorkflowCard[] = [
  {
    id: "1",
    title: "Optimize Pumpkin Harvest",
    description: "Implement efficient workflows with our automated system.",
    cropCategory: "Pumpkin",
    imageUrl:
      "https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&w=600&q=80",
    statusBadge: "Ready to Harvest",
  },
  {
    id: "2",
    title: "Healthy Wheat Field",
    description: "Real-time grain health monitoring and moisture checks.",
    cropCategory: "Wheat",
    imageUrl:
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
    statusBadge: "Growth Stage: 80%",
  },
  {
    id: "3",
    title: "Tomato Blight Prevention",
    description: "High humidity alert! Follow preventative biological care.",
    cropCategory: "Vegetable",
    imageUrl:
      "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80",
    statusBadge: "Risk Radar: Active",
  },
];

interface HarvestCardsProps {
  onCardClick?: (card: WorkflowCard) => void;
}

export function HarvestCards({ onCardClick }: HarvestCardsProps) {
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({
    "1": true,
  });

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-1 px-1">
      {CARDS.map((card) => (
        <div
          key={card.id}
          onClick={() => onCardClick?.(card)}
          className="group relative flex-none w-[260px] sm:w-[280px] rounded-3xl bg-white p-3 shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          {/* Image Container with bookmark */}
          <div className="relative h-36 sm:h-40 w-full rounded-2xl overflow-hidden bg-neutral-100">
            {/* Image */}
            <img
              src={card.imageUrl}
              alt={card.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Status pill badge on top left */}
            {card.statusBadge && (
              <div className="absolute top-2.5 left-2.5 rounded-full bg-[#132b1e]/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-white border border-white/10">
                {card.statusBadge}
              </div>
            )}

            {/* Bookmark button */}
            <button
              onClick={(e) => toggleBookmark(e, card.id)}
              className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
              aria-label="Bookmark"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  bookmarked[card.id]
                    ? "fill-[#6ecb5a] text-[#6ecb5a]"
                    : "text-white"
                }`}
              />
            </button>
          </div>

          {/* Card Body */}
          <div className="mt-3 px-1 pb-1">
            <div className="flex items-start justify-between gap-1">
              <h3 className="text-sm sm:text-base font-bold text-[#132b1e] tracking-tight group-hover:text-[#58a447] transition-colors line-clamp-1">
                {card.title}
              </h3>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-[#58a447] transition-colors shrink-0 mt-0.5" />
            </div>
            <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
