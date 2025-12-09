import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Photo } from '@/lib/gallery-store';

interface PhotoCardProps {
  photo: Photo;
  onToggleLike: (photoId: string) => void;
  showFilename?: boolean;
  index?: number;
}

export function PhotoCard({ photo, onToggleLike, showFilename = false, index = 0 }: PhotoCardProps) {
  return (
    <motion.div
      className="photo-card group relative aspect-[3/2] bg-card overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      layout
    >
      <img
        src={photo.previewUrl}
        alt={photo.filename}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Gradient overlay for better button visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Like button */}
      <motion.button
        className={cn(
          'absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center',
          'bg-black/40 backdrop-blur-sm border border-white/10',
          'transition-all duration-300',
          photo.isLiked ? 'bg-primary/90 border-primary' : 'hover:bg-black/60'
        )}
        onClick={() => onToggleLike(photo.id)}
        whileTap={{ scale: 0.9 }}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-all duration-300',
            photo.isLiked ? 'fill-primary-foreground text-primary-foreground animate-heart-pop' : 'text-white'
          )}
        />
      </motion.button>
      
      {/* Filename overlay */}
      {showFilename && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-xs text-white/80 font-mono truncate">{photo.filename}</p>
        </div>
      )}
      
      {/* Liked indicator border */}
      {photo.isLiked && (
        <motion.div
          className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
}
