import React from 'react';
import { motion } from 'framer-motion';
import { Image, Heart, Clock } from 'lucide-react';

interface GalleryStatsProps {
  totalPhotos: number;
  likedPhotos: number;
  createdAt?: Date;
}

export function GalleryStats({ totalPhotos, likedPhotos, createdAt }: GalleryStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-4"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
        <Image className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{totalPhotos} Photos</span>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
        <Heart className="w-4 h-4 text-primary fill-primary" />
        <span className="text-sm font-medium text-primary">{likedPhotos} Selected</span>
      </div>
      
      {createdAt && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {createdAt.toLocaleDateString()}
          </span>
        </div>
      )}
    </motion.div>
  );
}
