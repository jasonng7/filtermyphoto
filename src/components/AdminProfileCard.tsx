import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Trash2, ExternalLink, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onDelete: () => void;
  onEdit: (newName: string, newUrl: string) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function AdminProfileCard({ 
  profile, 
  onDelete, 
  onEdit,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: AdminProfileCardProps) {
  const createdDate = new Date(profile.created_at).toLocaleDateString();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated rounded-xl p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{profile.name}</h3>
              <p className="text-xs text-muted-foreground">Added {createdDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onMoveUp}
                disabled={!canMoveUp}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onMoveDown}
                disabled={!canMoveDown}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
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
      </motion.div>

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
