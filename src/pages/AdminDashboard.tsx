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
}

interface Gallery {
  id: string;
  title: string;
  share_token: string;
  selections_submitted: boolean;
  created_at: string;
  photo_count: number;
  liked_count: number;
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
      // Fetch admin profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch galleries with photo counts
      const { data: galleriesData, error: galleriesError } = await supabase
        .from('galleries')
        .select(`
          id,
          title,
          share_token,
          selections_submitted,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (galleriesError) throw galleriesError;

      // Fetch photo counts for each gallery
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
                {profiles.map((profile) => (
                  <AdminProfileCard
                    key={profile.id}
                    profile={profile}
                    onDelete={() => handleDeleteProfile(profile.id)}
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
                {galleries.map((gallery) => (
                  <GalleryListCard
                    key={gallery.id}
                    gallery={gallery}
                    onClick={() => navigate(`/admin/gallery/${gallery.id}`)}
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
