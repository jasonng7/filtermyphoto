import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { PhotoGallery } from '@/components/PhotoGallery';
import { GalleryStats } from '@/components/GalleryStats';
import { GalleryFilters } from '@/components/GalleryFilters';
import { ShareLinkCard } from '@/components/ShareLinkCard';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Loader2, 
  Download, 
  FileJson, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  filename: string;
  thumbnail_url: string;
  is_liked: boolean;
  google_file_id: string;
}

interface Gallery {
  id: string;
  title: string;
  share_token: string;
  selections_submitted: boolean;
  created_at: string;
}

type FilterType = 'all' | 'liked' | 'not-liked';

const AdminGallery = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchGallery();
    }
  }, [user, id]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      // Fetch gallery
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single();

      if (galleryError) throw galleryError;
      setGallery(galleryData);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', id)
        .order('created_at', { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast({
        title: 'Error loading gallery',
        description: 'Could not load the gallery.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleToggleLike = useCallback(async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    const newIsLiked = !photo.is_liked;

    // Optimistic update
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, is_liked: newIsLiked } : p
    ));

    // Update in database
    const { error } = await supabase
      .from('photos')
      .update({ is_liked: newIsLiked })
      .eq('id', photoId);

    if (error) {
      // Revert on error
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, is_liked: !newIsLiked } : p
      ));
      toast({
        title: 'Error updating photo',
        description: 'Could not update the photo.',
        variant: 'destructive',
      });
    }
  }, [photos, toast]);

  const filteredPhotos = photos.filter(photo => {
    if (filter === 'liked') return photo.is_liked;
    if (filter === 'not-liked') return !photo.is_liked;
    return true;
  });

  // Transform photos to match PhotoGallery expected format
  const galleryPhotos = filteredPhotos.map(photo => ({
    id: photo.id,
    filename: photo.filename,
    previewUrl: photo.thumbnail_url,
    isLiked: photo.is_liked,
  }));

  const likedCount = photos.filter(p => p.is_liked).length;

  const handleExport = (format: 'json' | 'csv') => {
    const likedPhotos = photos.filter(p => p.is_liked);
    const filenames = likedPhotos.map(p => p.filename);

    let content: string;
    if (format === 'csv') {
      content = 'filename\n' + filenames.join('\n');
    } else {
      content = JSON.stringify({
        exportedAt: new Date().toISOString(),
        galleryTitle: gallery?.title,
        totalSelected: filenames.length,
        filenames,
      }, null, 2);
    }

    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-photos-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful!',
      description: `Downloaded ${likedCount} selected filenames as ${format.toUpperCase()}.`,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showNav={false} />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Gallery Not Found</h2>
            <p className="text-muted-foreground">
              This gallery doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/admin')}>Back to Dashboard</Button>
          </motion.div>
        </main>
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
          {/* Back button */}
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Share link */}
          <ShareLinkCard 
            shareToken={gallery.share_token} 
            photoCount={photos.length} 
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{gallery.title}</h1>
              <GalleryStats 
                totalPhotos={photos.length} 
                likedPhotos={likedCount}
                createdAt={new Date(gallery.created_at)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="accent" size="lg" disabled={likedCount === 0}>
                  <Download className="w-4 h-4" />
                  Export Selections ({likedCount})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Download as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filters */}
          <GalleryFilters
            filter={filter}
            onFilterChange={setFilter}
            counts={{
              all: photos.length,
              liked: likedCount,
              notLiked: photos.length - likedCount,
            }}
          />

          {/* Gallery */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {filter === 'liked' 
                  ? 'No liked photos yet'
                  : filter === 'not-liked'
                  ? 'All photos have been liked'
                  : 'No photos in this gallery'}
              </p>
            </div>
          ) : (
            <PhotoGallery 
              photos={galleryPhotos} 
              onToggleLike={handleToggleLike}
              showFilenames
            />
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminGallery;
