import React from 'react';
import { motion } from 'framer-motion';
import { Images, Heart, Check, ChevronRight } from 'lucide-react';

interface Gallery {
  id: string;
  title: string;
  share_token: string;
  selections_submitted: boolean;
  created_at: string;
  photo_count: number;
  liked_count: number;
}

interface GalleryListCardProps {
  gallery: Gallery;
  onClick: () => void;
}

export function GalleryListCard({ gallery, onClick }: GalleryListCardProps) {
  const createdDate = new Date(gallery.created_at).toLocaleDateString();

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left card-elevated rounded-xl p-5 space-y-4 transition-all hover:ring-2 hover:ring-primary/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Images className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{gallery.title}</h3>
            <p className="text-xs text-muted-foreground">Created {createdDate}</p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Images className="w-4 h-4" />
          <span>{gallery.photo_count} photos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4" />
          <span>{gallery.liked_count} liked</span>
        </div>
        {gallery.selections_submitted && (
          <div className="flex items-center gap-1.5 text-success">
            <Check className="w-4 h-4" />
            <span>Submitted</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}
