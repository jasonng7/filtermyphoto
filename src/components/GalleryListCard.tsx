import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Images, Heart, Check, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RenameDialog } from '@/components/RenameDialog';

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
  onRename: (newName: string) => Promise<void>;
}

export function GalleryListCard({ gallery, onClick, onRename }: GalleryListCardProps) {
  const createdDate = new Date(gallery.created_at).toLocaleDateString();
  const [renameOpen, setRenameOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-left card-elevated rounded-xl p-5 space-y-4 transition-all hover:ring-2 hover:ring-primary/50"
      >
        <div className="flex items-start justify-between">
          <button
            onClick={onClick}
            className="flex items-center gap-3 text-left flex-1"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Images className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{gallery.title}</h3>
              <p className="text-xs text-muted-foreground">Created {createdDate}</p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setRenameOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <button onClick={onClick}>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <button onClick={onClick} className="w-full">
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
        </button>
      </motion.div>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={gallery.title}
        itemType="gallery"
        onRename={onRename}
      />
    </>
  );
}
