import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { PhotoGallery } from '@/components/PhotoGallery';
import { GalleryStats } from '@/components/GalleryStats';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, Send, AlertCircle, Loader2, Pencil } from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  thumbnail_url: string;
  is_liked: boolean;
}

interface Gallery {
  id: string;
  title: string;
  selections_submitted: boolean;
  created_at: string;
}

const GuestGallery = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!shareToken) {
      setLoading(false);
      return;
    }
    fetchGallery();
  }, [shareToken]);

  const fetchGallery = async () => {
    try {
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (galleryError) throw galleryError;
      
      if (!galleryData) {
        setLoading(false);
        return;
      }

      setGallery(galleryData);
      setSubmitted(galleryData.selections_submitted);

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryData.id)
        .order('created_at', { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
    setLoading(false);
  };

  const handleToggleLike = useCallback(async (photoId: string) => {
    if (submitted) return;

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
    }
  }, [photos, submitted]);

  const handleSubmit = useCallback(async () => {
    if (!gallery) return;

    const { error } = await supabase
      .from('galleries')
      .update({ selections_submitted: true })
      .eq('id', gallery.id);

    if (error) {
      toast({
        title: 'Error submitting',
        description: 'Could not submit your selections.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitted(true);
    toast({
      title: 'Selections submitted!',
      description: 'Your favorites have been sent to the photographer.',
    });
  }, [gallery, toast]);

  const handleEditSelection = useCallback(async () => {
    if (!gallery) return;

    const { error } = await supabase
      .from('galleries')
      .update({ selections_submitted: false })
      .eq('id', gallery.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not enable editing.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitted(false);
    toast({
      title: 'Editing enabled',
      description: 'You can now update your selections.',
    });
  }, [gallery, toast]);

  const galleryPhotos = photos.map(photo => ({
    id: photo.id,
    filename: photo.filename,
    previewUrl: photo.thumbnail_url,
    isLiked: photo.is_liked,
  }));

  const likedCount = photos.filter(p => p.is_liked).length;

  if (loading) {
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
              This gallery link may have expired or doesn't exist.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{gallery.title}</h2>
              <GalleryStats 
                totalPhotos={photos.length} 
                likedPhotos={likedCount}
              />
            </div>
            
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Selections Submitted</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditSelection}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="submit">
                  <Button 
                    variant="accent" 
                    size="lg" 
                    onClick={handleSubmit}
                    disabled={likedCount === 0}
                  >
                    <Send className="w-4 h-4" />
                    Submit {likedCount} Selection{likedCount !== 1 ? 's' : ''}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-primary/10 border border-primary/20"
            >
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Tap the heart icon</span> on your favorite photos to select them. 
                When you're done, click "Submit Selections" to send your choices to the photographer.
              </p>
            </motion.div>
          )}

          {likedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-accent/10 border border-accent/20"
            >
              <p className="text-sm font-medium text-foreground mb-3">
                Your Selections ({likedCount})
              </p>
              <div className="flex flex-wrap gap-2">
                {photos.filter(p => p.is_liked).map(photo => (
                  <div 
                    key={photo.id} 
                    className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-primary"
                  >
                    <img 
                      src={photo.thumbnail_url} 
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <PhotoGallery 
            photos={galleryPhotos} 
            onToggleLike={handleToggleLike}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default GuestGallery;
