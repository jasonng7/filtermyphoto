import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { PhotoGallery } from '@/components/PhotoGallery';
import { GalleryStats } from '@/components/GalleryStats';
import { Button } from '@/components/ui/button';
import { 
  getGalleryByShareToken, 
  togglePhotoLike, 
  submitSelections,
  type Gallery 
} from '@/lib/gallery-store';
import { useToast } from '@/hooks/use-toast';
import { Check, Send, AlertCircle } from 'lucide-react';

const GuestGallery = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!shareToken) {
      setLoading(false);
      return;
    }

    const foundGallery = getGalleryByShareToken(shareToken);
    if (foundGallery) {
      setGallery(foundGallery);
      setSubmitted(foundGallery.selectionsSubmitted);
    }
    setLoading(false);
  }, [shareToken]);

  const handleToggleLike = useCallback((photoId: string) => {
    if (!gallery || submitted) return;

    togglePhotoLike(gallery.id, photoId);
    
    setGallery(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        photos: prev.photos.map(p => 
          p.id === photoId ? { ...p, isLiked: !p.isLiked } : p
        ),
      };
    });
  }, [gallery, submitted]);

  const handleSubmit = useCallback(() => {
    if (!gallery) return;

    submitSelections(gallery.id);
    setSubmitted(true);
    
    toast({
      title: "Selections submitted!",
      description: "Your favorites have been sent to the photographer.",
    });
  }, [gallery, toast]);

  const likedCount = gallery?.photos.filter(p => p.isLiked).length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
          {/* Header section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{gallery.title}</h2>
              <GalleryStats 
                totalPhotos={gallery.photos.length} 
                likedPhotos={likedCount}
              />
            </div>
            
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success"
                >
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Selections Submitted</span>
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

          {/* Instructions */}
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

          {/* Gallery */}
          <PhotoGallery 
            photos={gallery.photos} 
            onToggleLike={handleToggleLike}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default GuestGallery;