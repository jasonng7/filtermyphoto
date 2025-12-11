import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FolderOpen, Trash2, ExternalLink, Pencil, GripVertical, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { EditSourceDialog } from '@/components/EditSourceDialog';

interface AdminProfile {
  id: string;
  name: string;
  google_folder_id: string;
  google_folder_url: string;
  created_at: string;
  display_order?: number;
}

interface AdminProfileCardProps {
  profile: AdminProfile;
  thumbnails: string[];
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  onEdit: (newName: string, newUrl: string) => Promise<void>;
}

export function AdminProfileCard({ 
  profile, 
  thumbnails,
  selectionMode,
  isSelected,
  onSelect,
  onDelete, 
  onEdit,
}: AdminProfileCardProps) {
  const createdDate = new Date(profile.created_at).toLocaleDateString();
  const [editOpen, setEditOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: profile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="card-elevated rounded-xl p-5 space-y-4"
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
                <span className="text-xs">No synced photos</span>
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
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{profile.name}</h3>
              <p className="text-xs text-muted-foreground">Added {createdDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this source?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{profile.name}" from your sources. Existing galleries created from this source will not be affected.
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
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <a
            href={profile.google_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Drive
          </a>
        </div>
      </div>

      <EditSourceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentName={profile.name}
        currentUrl={profile.google_folder_url}
        onSave={onEdit}
      />
    </>
  );
}
