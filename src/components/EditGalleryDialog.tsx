import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AdminProfile {
  id: string;
  name: string;
}

interface EditGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentProfileId: string | null;
  profiles: AdminProfile[];
  onSave: (newName: string, newProfileId: string | null) => Promise<void>;
}

export function EditGalleryDialog({
  open,
  onOpenChange,
  currentName,
  currentProfileId,
  profiles,
  onSave,
}: EditGalleryDialogProps) {
  const [name, setName] = useState(currentName);
  const [profileId, setProfileId] = useState<string | null>(currentProfileId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setProfileId(currentProfileId);
    }
  }, [open, currentName, currentProfileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(name.trim(), profileId);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = name !== currentName || profileId !== currentProfileId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Gallery</DialogTitle>
          <DialogDescription>
            Update the gallery name or change the Google Drive source.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Gallery Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter gallery name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Google Drive Source</Label>
              <Select
                value={profileId || 'none'}
                onValueChange={(value) => setProfileId(value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No source</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !hasChanges}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
