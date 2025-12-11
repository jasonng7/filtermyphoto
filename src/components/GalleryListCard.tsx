import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Images, Heart, Check, ChevronRight, Pencil, Trash2, Link2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditGalleryDialog } from '@/components/EditGalleryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface AdminProfile {
  id: string;
  name: string;
}

interface Gallery {
  id: string;
  title: string;
  share_token: string;
  selections_submitted: boolean;
  created_at: string;
  photo_count: number;
  liked_count: number;
  display_order?: number;
  admin_profile_id?: string | null;
}

interface GalleryListCardProps {
  gallery: Gallery;
  profiles: AdminProfile[];
  onClick: () => void;
  onEdit: (newName: string, newProfileId: string | null) => Promise<void>;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function GalleryListCard({ 
  gallery, 
  profiles,
  onClick, 
  onEdit, 
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: GalleryListCardProps) {
  const createdDate = new Date(gallery.created_at).toLocaleDateString();
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/gallery/${gallery.share_token}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: 'Client gallery link copied to clipboard.',
    });
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(shareUrl, '_blank');
  };

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
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
                disabled={!canMoveUp}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
                disabled={!canMoveDown}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={handleCopyLink}
                    onDoubleClick={handleOpenLink}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to copy, double-click to open</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this gallery?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{gallery.title}" and all its photos. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

      <EditGalleryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentName={gallery.title}
        currentProfileId={gallery.admin_profile_id || null}
        profiles={profiles}
        onSave={onEdit}
      />
    </>
  );
}
