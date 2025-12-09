import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderPlus } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  googleFolderUrl: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => url.includes('drive.google.com') && url.includes('folders'),
      'Please enter a valid Google Drive folder URL'
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function extractFolderId(url: string): string | null {
  // Handle various Google Drive URL formats
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function CreateProfileDialog({ open, onOpenChange, onSuccess }: CreateProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', googleFolderUrl: '' },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    const folderId = extractFolderId(data.googleFolderUrl);
    if (!folderId) {
      toast({
        title: 'Invalid URL',
        description: 'Could not extract folder ID from the URL.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('admin_profiles')
        .insert({
          user_id: user.id,
          name: data.name,
          google_folder_id: folderId,
          google_folder_url: data.googleFolderUrl,
        });

      if (error) throw error;

      toast({
        title: 'Source added!',
        description: `"${data.name}" has been added to your sources.`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error adding source',
        description: 'Could not add the Google Drive source. Please try again.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-primary" />
            Add Google Drive Source
          </DialogTitle>
          <DialogDescription>
            Add a publicly shared Google Drive folder containing your ARW files.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Source Name</Label>
            <Input
              id="name"
              placeholder="e.g., Wedding Shoots, Portrait Sessions"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleFolderUrl">Google Drive Folder URL</Label>
            <Input
              id="googleFolderUrl"
              placeholder="https://drive.google.com/drive/folders/..."
              {...form.register('googleFolderUrl')}
            />
            {form.formState.errors.googleFolderUrl && (
              <p className="text-sm text-destructive">{form.formState.errors.googleFolderUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Make sure the folder is set to "Anyone with the link can view"
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Source
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
