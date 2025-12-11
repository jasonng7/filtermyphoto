import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Photo } from '@/lib/gallery-store';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface PhotoCardProps {
  photo: Photo;
  onToggleLike: (photoId: string) => void;
  showFilename?: boolean;
  index?: number;
}

export function PhotoCard({ photo, onToggleLike, showFilename = false, index = 0 }: PhotoCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Get full-size URL by replacing w1000 with w2000
  const fullSizeUrl = photo.previewUrl.replace(/sz=w\d+/, 'sz=w2000');

  return (
    <>
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
        
        {/* Expand button */}
        <motion.button
          className={cn(
            'absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm border border-white/10',
            'transition-all duration-300 hover:bg-black/60',
            'opacity-0 group-hover:opacity-100'
          )}
          onClick={() => setPreviewOpen(true)}
          whileTap={{ scale: 0.9 }}
        >
          <Maximize2 className="w-5 h-5 text-white" />
        </motion.button>
        
        {/* Like button */}
        <button
          className={cn(
            'absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center',
            'bg-black/40 backdrop-blur-sm border border-white/10',
            photo.isLiked ? 'bg-primary/90 border-primary' : 'hover:bg-black/60'
          )}
          onClick={() => onToggleLike(photo.id)}
        >
          <Heart
            className={cn(
              'w-5 h-5',
              photo.isLiked ? 'fill-primary-foreground text-primary-foreground' : 'text-white'
            )}
          />
        </button>
        
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

      {/* Full-size preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-white/10 overflow-hidden">
          <DialogTitle className="sr-only">{photo.filename}</DialogTitle>
          
          {/* Close button */}
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Like button in preview */}
          <button
            className={cn(
              'absolute top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center',
              'bg-black/60 backdrop-blur-sm border border-white/20',
              photo.isLiked ? 'bg-primary/90 border-primary' : 'hover:bg-black/80'
            )}
            onClick={() => onToggleLike(photo.id)}
          >
            <Heart
              className={cn(
                'w-5 h-5',
                photo.isLiked ? 'fill-primary-foreground text-primary-foreground' : 'text-white'
              )}
            />
          </button>
          
          {/* Image container */}
          <div className="flex items-center justify-center w-full h-[85vh]">
            <img
              src={fullSizeUrl}
              alt={photo.filename}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {/* Filename */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm text-white/80 font-mono text-center">{photo.filename}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
