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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const gallerySchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  profileId: z.string().min(1, 'Please select a source'),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

interface AdminProfile {
  id: string;
  name: string;
  google_folder_id: string;
  google_folder_url: string;
}

interface CreateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: AdminProfile[];
  onSuccess: () => void;
}

export function CreateGalleryDialog({ open, onOpenChange, profiles, onSuccess }: CreateGalleryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [syncError, setSyncError] = useState<string | null>(null);

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: { title: '', profileId: '' },
  });

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleSubmit = async (data: GalleryFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setSyncError(null);

    const selectedProfile = profiles.find(p => p.id === data.profileId);
    if (!selectedProfile) return;

    try {
      // Create gallery first
      const shareToken = generateShareToken();
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .insert({
          user_id: user.id,
          admin_profile_id: selectedProfile.id,
          title: data.title,
          share_token: shareToken,
        })
        .select()
        .single();

      if (galleryError) throw galleryError;

      // Sync photos from Google Drive
      const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-google-drive', {
        body: {
          folderId: selectedProfile.google_folder_id,
          galleryId: galleryData.id,
        },
      });

      if (syncError) {
        setSyncError('Failed to sync photos from Google Drive. Make sure the folder is publicly shared.');
        // Delete the gallery if sync failed
        await supabase.from('galleries').delete().eq('id', galleryData.id);
        setIsSubmitting(false);
        return;
      }

      if (syncData?.error) {
        setSyncError(syncData.error);
        await supabase.from('galleries').delete().eq('id', galleryData.id);
        setIsSubmitting(false);
        return;
      }

      toast({
        title: 'Gallery created!',
        description: `"${data.title}" has been created with ${syncData?.photoCount || 0} photos.`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating gallery:', error);
      toast({
        title: 'Error creating gallery',
        description: 'Could not create the gallery. Please try again.',
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
            <ImagePlus className="w-5 h-5 text-primary" />
            Create Gallery
          </DialogTitle>
          <DialogDescription>
            Create a new gallery from a Google Drive source. Photos will be synced automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Gallery Title</Label>
            <Input
              id="title"
              placeholder="e.g., Smith Wedding - June 2024"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileId">Google Drive Source</Label>
            <Select
              onValueChange={(value) => form.setValue('profileId', value)}
              defaultValue={form.getValues('profileId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.profileId && (
              <p className="text-sm text-destructive">{form.formState.errors.profileId.message}</p>
            )}
          </div>

          {isSubmitting && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Syncing photos from Google Drive...</p>
              <Progress value={syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : undefined} />
            </div>
          )}

          {syncError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{syncError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Gallery
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
