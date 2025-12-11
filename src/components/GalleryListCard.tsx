import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Images, Heart, Check, ChevronRight, Pencil, Trash2, Link2, GripVertical, AlertTriangle, FolderOpen, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  thumbnails: string[];
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
  onEdit: (newName: string, newProfileId: string | null) => Promise<void>;
  onDelete: () => void;
}

export function GalleryListCard({ 
  gallery, 
  profiles,
  thumbnails,
  selectionMode,
  isSelected,
  onSelect,
  onClick, 
  onEdit, 
  onDelete,
}: GalleryListCardProps) {
  const createdDate = new Date(gallery.created_at).toLocaleDateString();
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();

  // Find connected source
  const connectedSource = gallery.admin_profile_id 
    ? profiles.find(p => p.id === gallery.admin_profile_id) 
    : null;
  const hasNoSource = !gallery.admin_profile_id || !connectedSource;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gallery.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
      <div
        ref={setNodeRef}
        style={style}
        className="w-full text-left card-elevated rounded-xl p-5 space-y-4 transition-all hover:ring-2 hover:ring-primary/50"
      >
        {/* Thumbnail Preview */}
        <div className="relative h-24 rounded-lg overflow-hidden bg-muted/30">
          {thumbnails.length > 0 ? (
            <div className="flex h-full">
              {thumbnails.slice(0, 4).map((url, index) => (
                <div 
                  key={index} 
                  className="flex-1 h-full"
                  style={{ minWidth: `${100 / Math.min(thumbnails.length, 4)}%` }}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ImageOff className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <span className="text-xs">No photos yet</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {selectionMode ? (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              >
                <GripVertical className="w-5 h-5" />
              </button>
            )}
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
          </div>

          <div className="flex items-center gap-1">
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
          
          {/* Source indicator */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            {hasNoSource ? (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">No source - select one to sync</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FolderOpen className="w-4 h-4" />
                <span className="text-xs">{connectedSource?.name}</span>
              </div>
            )}
          </div>
        </button>
      </div>

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
