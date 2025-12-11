import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AdminProfileCard } from '@/components/AdminProfileCard';
import { CreateProfileDialog } from '@/components/CreateProfileDialog';
import { CreateGalleryDialog } from '@/components/CreateGalleryDialog';
import { GalleryListCard } from '@/components/GalleryListCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FolderPlus, 
  ImagePlus, 
  LogOut, 
  Loader2,
  FolderOpen,
  Images,
  Trash2
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
  const [profileThumbnails, setProfileThumbnails] = useState<Record<string, string[]>>({});
  const [galleryThumbnails, setGalleryThumbnails] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [createGalleryOpen, setCreateGalleryOpen] = useState(false);
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      // Fetch thumbnails for each profile (from any gallery linked to it)
      const profThumbnails: Record<string, string[]> = {};
      for (const profile of profilesData || []) {
        const linkedGalleries = galleriesData?.filter(g => g.admin_profile_id === profile.id) || [];
        if (linkedGalleries.length > 0) {
          const galleryIds = linkedGalleries.map(g => g.id);
          const { data: photos } = await supabase
            .from('photos')
            .select('thumbnail_url')
            .in('gallery_id', galleryIds)
            .limit(4);
          profThumbnails[profile.id] = photos?.map(p => p.thumbnail_url) || [];
        } else {
          profThumbnails[profile.id] = [];
        }
      }
      setProfileThumbnails(profThumbnails);

      // Fetch thumbnails for each gallery
      const galThumbnails: Record<string, string[]> = {};
      for (const gallery of galleriesData || []) {
        const { data: photos } = await supabase
          .from('photos')
          .select('thumbnail_url')
          .eq('gallery_id', gallery.id)
          .limit(4);
        galThumbnails[gallery.id] = photos?.map(p => p.thumbnail_url) || [];
      }
      setGalleryThumbnails(galThumbnails);

      // Clear selections and exit selection mode after refresh
      setSelectedProfiles(new Set());
      setSelectedGalleries(new Set());
      setSelectionMode(false);
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

  const handleBulkDelete = async () => {
    try {
      // Delete selected profiles
      if (selectedProfiles.size > 0) {
        const profileIds = Array.from(selectedProfiles);
        const { error } = await supabase
          .from('admin_profiles')
          .delete()
          .in('id', profileIds);
        if (error) throw error;
      }

      // Delete selected galleries and their photos
      if (selectedGalleries.size > 0) {
        const galleryIds = Array.from(selectedGalleries);
        for (const id of galleryIds) {
          await supabase.from('photos').delete().eq('gallery_id', id);
        }
        const { error } = await supabase
          .from('galleries')
          .delete()
          .in('id', galleryIds);
        if (error) throw error;
      }

      const deletedCount = selectedProfiles.size + selectedGalleries.size;
      toast({
        title: 'Items deleted',
        description: `${deletedCount} item(s) have been removed.`,
      });
      setBulkDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error deleting items',
        description: 'Could not delete the selected items.',
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
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('gallery_id', galleryId);

      if (photosError) throw photosError;

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

  const handleProfileDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = profiles.findIndex((p) => p.id === active.id);
    const newIndex = profiles.findIndex((p) => p.id === over.id);

    const newProfiles = arrayMove(profiles, oldIndex, newIndex);
    setProfiles(newProfiles);

    // Update display_order in database
    try {
      await Promise.all(
        newProfiles.map((profile, index) =>
          supabase.from('admin_profiles').update({ display_order: index }).eq('id', profile.id)
        )
      );
    } catch (error) {
      toast({
        title: 'Error reordering',
        description: 'Could not save the new order.',
        variant: 'destructive',
      });
      fetchData();
    }
  };

  const handleGalleryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = galleries.findIndex((g) => g.id === active.id);
    const newIndex = galleries.findIndex((g) => g.id === over.id);

    const newGalleries = arrayMove(galleries, oldIndex, newIndex);
    setGalleries(newGalleries);

    // Update display_order in database
    try {
      await Promise.all(
        newGalleries.map((gallery, index) =>
          supabase.from('galleries').update({ display_order: index }).eq('id', gallery.id)
        )
      );
    } catch (error) {
      toast({
        title: 'Error reordering',
        description: 'Could not save the new order.',
        variant: 'destructive',
      });
      fetchData();
    }
  };

  const toggleProfileSelection = (id: string, selected: boolean) => {
    setSelectedProfiles((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const toggleGallerySelection = (id: string, selected: boolean) => {
    setSelectedGalleries((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedProfiles(new Set());
    setSelectedGalleries(new Set());
  };

  const totalSelected = selectedProfiles.size + selectedGalleries.size;

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
            <div className="flex items-center gap-2">
              {selectionMode ? (
                <>
                  {totalSelected > 0 && (
                    <Button 
                      variant="destructive"
                      onClick={() => setBulkDeleteOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete {totalSelected}
                    </Button>
                  )}
                  <Button variant="outline" onClick={exitSelectionMode}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {(profiles.length > 0 || galleries.length > 0) && (
                    <Button variant="outline" onClick={() => setSelectionMode(true)}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Google Drive Profiles Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Google Drive Sources</h2>
                {selectionMode && selectedProfiles.size > 0 && (
                  <span className="text-sm text-muted-foreground">({selectedProfiles.size} selected)</span>
                )}
              </div>
              {!selectionMode && (
                <Button onClick={() => setCreateProfileOpen(true)}>
                  <FolderPlus className="w-4 h-4" />
                  Add Source
                </Button>
              )}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleProfileDragEnd}
              >
                <SortableContext items={profiles.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => (
                      <AdminProfileCard
                        key={profile.id}
                        profile={profile}
                        thumbnails={profileThumbnails[profile.id] || []}
                        selectionMode={selectionMode}
                        isSelected={selectedProfiles.has(profile.id)}
                        onSelect={(selected) => toggleProfileSelection(profile.id, selected)}
                        onDelete={() => handleDeleteProfile(profile.id)}
                        onEdit={(newName, newUrl) => handleEditProfile(profile.id, newName, newUrl)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          {/* Galleries Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Galleries</h2>
                {selectionMode && selectedGalleries.size > 0 && (
                  <span className="text-sm text-muted-foreground">({selectedGalleries.size} selected)</span>
                )}
              </div>
              {!selectionMode && (
                <Button 
                  onClick={() => setCreateGalleryOpen(true)}
                  disabled={profiles.length === 0}
                >
                  <ImagePlus className="w-4 h-4" />
                  Create Gallery
                </Button>
              )}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleGalleryDragEnd}
              >
                <SortableContext items={galleries.map((g) => g.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleries.map((gallery) => (
                      <GalleryListCard
                        key={gallery.id}
                        gallery={gallery}
                        profiles={profiles}
                        thumbnails={galleryThumbnails[gallery.id] || []}
                        selectionMode={selectionMode}
                        isSelected={selectedGalleries.has(gallery.id)}
                        onSelect={(selected) => toggleGallerySelection(gallery.id, selected)}
                        onClick={() => navigate(`/admin/gallery/${gallery.id}`)}
                        onEdit={(newName, newProfileId) => handleEditGallery(gallery.id, newName, newProfileId)}
                        onDelete={() => handleDeleteGallery(gallery.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {totalSelected} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProfiles.size > 0 && selectedGalleries.size > 0 ? (
                <>
                  This will delete {selectedProfiles.size} source(s) and {selectedGalleries.size} gallery(ies) with all their photos.
                  This action cannot be undone.
                </>
              ) : selectedProfiles.size > 0 ? (
                <>
                  This will remove {selectedProfiles.size} Google Drive source(s). 
                  Existing galleries created from these sources will not be affected.
                </>
              ) : (
                <>
                  This will permanently delete {selectedGalleries.size} gallery(ies) and all their photos.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {totalSelected}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
