import React from 'react';
import { motion } from 'framer-motion';
import { Images, Heart, HeartOff } from 'lucide-react';

type FilterType = 'all' | 'liked' | 'not-liked';

interface GalleryFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    liked: number;
    notLiked: number;
  };
}

export function GalleryFilters({ filter, onFilterChange, counts }: GalleryFiltersProps) {
  const filters: { id: FilterType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All Photos', icon: <Images className="w-4 h-4" />, count: counts.all },
    { id: 'liked', label: 'Liked', icon: <Heart className="w-4 h-4" />, count: counts.liked },
    { id: 'not-liked', label: 'Not Liked', icon: <HeartOff className="w-4 h-4" />, count: counts.notLiked },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${filter === f.id 
              ? 'text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary'}
          `}
        >
          {filter === f.id && (
            <motion.div
              layoutId="filter-active"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            {f.icon}
            {f.label}
            <span className={`
              px-2 py-0.5 rounded-full text-xs
              ${filter === f.id 
                ? 'bg-primary-foreground/20' 
                : 'bg-muted'}
            `}>
              {f.count}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
