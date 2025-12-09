import React from 'react';
import { motion } from 'framer-motion';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/lib/gallery-store';

interface PhotoGalleryProps {
  photos: Photo[];
  onToggleLike: (photoId: string) => void;
  showFilenames?: boolean;
}

export function PhotoGallery({ photos, onToggleLike, showFilenames = false }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No photos to display</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onToggleLike={onToggleLike}
          showFilename={showFilenames}
          index={index}
        />
      ))}
    </motion.div>
  );
}
