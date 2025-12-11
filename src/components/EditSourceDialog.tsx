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
import { Loader2 } from 'lucide-react';

interface EditSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentUrl: string;
  onSave: (newName: string, newUrl: string) => Promise<void>;
}

function extractFolderId(url: string): string | null {
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function EditSourceDialog({
  open,
  onOpenChange,
  currentName,
  currentUrl,
  onSave,
}: EditSourceDialogProps) {
  const [name, setName] = useState(currentName);
  const [url, setUrl] = useState(currentUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    if (open) {
      setName(currentName);
      setUrl(currentUrl);
      setUrlError('');
    }
  }, [open, currentName, currentUrl]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value && !extractFolderId(value)) {
      setUrlError('Invalid Google Drive folder URL');
    } else {
      setUrlError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    
    const folderId = extractFolderId(url);
    if (!folderId) {
      setUrlError('Invalid Google Drive folder URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(name.trim(), url.trim());
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = name !== currentName || url !== currentUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
          <DialogDescription>
            Update the name or Google Drive folder URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter source name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Google Drive Folder URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
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
              disabled={isSubmitting || !name.trim() || !url.trim() || !!urlError || !hasChanges}
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
