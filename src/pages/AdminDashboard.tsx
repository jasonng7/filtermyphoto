import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AdminProfileCard } from '@/components/AdminProfileCard';
import { CreateProfileDialog } from '@/components/CreateProfileDialog';
import { CreateGalleryDialog } from '@/components/CreateGalleryDialog';
import { GalleryListCard } from '@/components/GalleryListCard';
import { 
  FolderPlus, 
  ImagePlus, 
  LogOut, 
  Loader2,
  FolderOpen,
  Images
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminProfile {
  id: string;
  name: string;
  google_folder_id: string;
  google_folder_url: string;
  created_at: string;
  display_order: number;
}

interface Gallery {
  id: string;
  title: string;
  share_token: string;
  selections_submitted: boolean;
  created_at: string;
  photo_count: number;
  liked_count: number;
  display_order: number;
  admin_profile_id: string | null;
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

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [createGalleryOpen, setCreateGalleryOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('display_order', { ascending: true });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select('id, title, share_token, selections_submitted, created_at, display_order, admin_profile_id')
        .order('display_order', { ascending: true });

      if (galleriesError) throw galleriesError;

      const galleriesWithCounts = await Promise.all(
        (galleriesData || []).map(async (gallery) => {
          const { count: photoCount } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('gallery_id', gallery.id);

          const { count: likedCount } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('gallery_id', gallery.id)
            .eq('is_liked', true);

          return {
            ...gallery,
            photo_count: photoCount || 0,
            liked_count: likedCount || 0,
          };
        })
      );

      setGalleries(galleriesWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading data',
        description: 'Could not load your profiles and galleries.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProfileCreated = () => {
    setCreateProfileOpen(false);
    fetchData();
  };

  const handleGalleryCreated = () => {
    setCreateGalleryOpen(false);
    fetchData();
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Profile deleted',
        description: 'The Google Drive profile has been removed.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error deleting profile',
        description: 'Could not delete the profile.',
        variant: 'destructive',
      });
    }
  };

  const handleEditProfile = async (profileId: string, newName: string, newUrl: string) => {
    try {
      const folderId = extractFolderId(newUrl);
      if (!folderId) throw new Error('Invalid URL');

      const { error } = await supabase
        .from('admin_profiles')
        .update({ 
          name: newName, 
          google_folder_url: newUrl,
          google_folder_id: folderId 
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Source updated',
        description: 'The Google Drive source has been updated.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error updating source',
        description: 'Could not update the source.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleEditGallery = async (galleryId: string, newName: string, newProfileId: string | null) => {
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ title: newName, admin_profile_id: newProfileId })
        .eq('id', galleryId);

      if (error) throw error;

      toast({
        title: 'Gallery updated',
        description: 'The gallery has been updated.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error updating gallery',
        description: 'Could not update the gallery.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteGallery = async (galleryId: string) => {
    try {
      // First delete all photos in the gallery
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('gallery_id', galleryId);

      if (photosError) throw photosError;

      // Then delete the gallery
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (error) throw error;

      toast({
        title: 'Gallery deleted',
        description: 'The gallery and all its photos have been removed.',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error deleting gallery',
        description: 'Could not delete the gallery.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveProfile = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= profiles.length) return;

    const updatedProfiles = [...profiles];
    [updatedProfiles[index], updatedProfiles[newIndex]] = [updatedProfiles[newIndex], updatedProfiles[index]];

    // Update display_order in database
    try {
      await Promise.all([
        supabase.from('admin_profiles').update({ display_order: index }).eq('id', updatedProfiles[index].id),
        supabase.from('admin_profiles').update({ display_order: newIndex }).eq('id', updatedProfiles[newIndex].id),
      ]);
      setProfiles(updatedProfiles.map((p, i) => ({ ...p, display_order: i })));
    } catch (error) {
      toast({
        title: 'Error reordering',
        description: 'Could not reorder the sources.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveGallery = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= galleries.length) return;

    const updatedGalleries = [...galleries];
    [updatedGalleries[index], updatedGalleries[newIndex]] = [updatedGalleries[newIndex], updatedGalleries[index]];

    try {
      await Promise.all([
        supabase.from('galleries').update({ display_order: index }).eq('id', updatedGalleries[index].id),
        supabase.from('galleries').update({ display_order: newIndex }).eq('id', updatedGalleries[newIndex].id),
      ]);
      setGalleries(updatedGalleries.map((g, i) => ({ ...g, display_order: i })));
    } catch (error) {
      toast({
        title: 'Error reordering',
        description: 'Could not reorder the galleries.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showNav={false} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your Google Drive sources and galleries
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Google Drive Profiles Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Google Drive Sources</h2>
              </div>
              <Button onClick={() => setCreateProfileOpen(true)}>
                <FolderPlus className="w-4 h-4" />
                Add Source
              </Button>
            </div>

            {profiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-elevated rounded-xl p-8 text-center"
              >
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Google Drive sources yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a Google Drive folder to start creating galleries
                </p>
                <Button onClick={() => setCreateProfileOpen(true)}>
                  <FolderPlus className="w-4 h-4" />
                  Add Your First Source
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((profile, index) => (
                  <AdminProfileCard
                    key={profile.id}
                    profile={profile}
                    onDelete={() => handleDeleteProfile(profile.id)}
                    onEdit={(newName, newUrl) => handleEditProfile(profile.id, newName, newUrl)}
                    onMoveUp={() => handleMoveProfile(index, 'up')}
                    onMoveDown={() => handleMoveProfile(index, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < profiles.length - 1}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Galleries Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Galleries</h2>
              </div>
              <Button 
                onClick={() => setCreateGalleryOpen(true)}
                disabled={profiles.length === 0}
              >
                <ImagePlus className="w-4 h-4" />
                Create Gallery
              </Button>
            </div>

            {galleries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-elevated rounded-xl p-8 text-center"
              >
                <Images className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No galleries yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {profiles.length === 0 
                    ? 'Add a Google Drive source first to create galleries'
                    : 'Create a gallery from one of your Google Drive sources'}
                </p>
                {profiles.length > 0 && (
                  <Button onClick={() => setCreateGalleryOpen(true)}>
                    <ImagePlus className="w-4 h-4" />
                    Create Your First Gallery
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleries.map((gallery, index) => (
                  <GalleryListCard
                    key={gallery.id}
                    gallery={gallery}
                    profiles={profiles}
                    onClick={() => navigate(`/admin/gallery/${gallery.id}`)}
                    onEdit={(newName, newProfileId) => handleEditGallery(gallery.id, newName, newProfileId)}
                    onDelete={() => handleDeleteGallery(gallery.id)}
                    onMoveUp={() => handleMoveGallery(index, 'up')}
                    onMoveDown={() => handleMoveGallery(index, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < galleries.length - 1}
                  />
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </main>

      <CreateProfileDialog
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
        onSuccess={handleProfileCreated}
      />

      <CreateGalleryDialog
        open={createGalleryOpen}
        onOpenChange={setCreateGalleryOpen}
        profiles={profiles}
        onSuccess={handleGalleryCreated}
      />
    </div>
  );
};

export default AdminDashboard;
