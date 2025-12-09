import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { UploadZone } from '@/components/UploadZone';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { ShareLinkCard } from '@/components/ShareLinkCard';
import { PhotoGallery } from '@/components/PhotoGallery';
import { GalleryStats } from '@/components/GalleryStats';
import { ExportButton } from '@/components/ExportButton';
import { extractBatchPreviews, type ExtractedPhoto } from '@/lib/arw-extractor';
import { 
  createGallery, 
  addPhotosToGallery, 
  togglePhotoLike,
  type Gallery,
  type Photo 
} from '@/lib/gallery-store';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type Stage = 'idle' | 'extracting' | 'complete';

const Index = () => {
  const [stage, setStage] = useState<Stage>('idle');
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, filename: '' });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setStage('extracting');
    setProgress({ current: 0, total: files.length, filename: '' });

    try {
      // Create a new gallery
      const newGallery = createGallery(`Photo Session - ${new Date().toLocaleDateString()}`);

      // Extract previews with progress tracking
      const extractedPhotos = await extractBatchPreviews(files, (current, total, filename) => {
        setProgress({ current, total, filename });
      });

      // Add photos to gallery
      const photos = extractedPhotos.map(ep => ({
        filename: ep.filename,
        previewUrl: ep.previewUrl,
        metadata: ep.metadata,
      }));

      addPhotosToGallery(newGallery.id, photos);

      // Update state
      setGallery({
        ...newGallery,
        photos: newGallery.photos,
      });
      setStage('complete');
    } catch (error) {
      console.error('Failed to process files:', error);
      setStage('idle');
    }
  }, []);

  const handleToggleLike = useCallback((photoId: string) => {
    if (!gallery) return;

    togglePhotoLike(gallery.id, photoId);
    
    // Update local state
    setGallery(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        photos: prev.photos.map(p => 
          p.id === photoId ? { ...p, isLiked: !p.isLiked } : p
        ),
      };
    });
  }, [gallery]);

  const handleStartNew = useCallback(() => {
    setStage('idle');
    setGallery(null);
    setProgress({ current: 0, total: 0, filename: '' });
  }, []);

  const likedCount = gallery?.photos.filter(p => p.isLiked).length ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.h2 
                  className="text-4xl font-bold text-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Cull Your Sony RAW Files
                </motion.h2>
                <motion.p 
                  className="text-lg text-muted-foreground max-w-md mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Upload ARW files, share with clients, and export selected filenames — 
                  <span className="text-primary font-medium"> without uploading 50MB files</span>.
                </motion.p>
              </div>
              
              <UploadZone 
                onFilesSelected={handleFilesSelected} 
                isProcessing={false} 
              />
              
              <motion.div 
                className="grid grid-cols-3 gap-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { step: '1', label: 'Drop ARW files', desc: 'Extract previews locally' },
                  { step: '2', label: 'Share link', desc: 'Let clients pick favorites' },
                  { step: '3', label: 'Export list', desc: 'Get selected filenames' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/50">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center mx-auto mb-2">
                      {item.step}
                    </div>
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {stage === 'extracting' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <ProcessingProgress
                current={progress.current}
                total={progress.total}
                currentFilename={progress.filename}
                stage="extracting"
              />
            </motion.div>
          )}

          {stage === 'complete' && gallery && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="max-w-2xl mx-auto">
                <ShareLinkCard 
                  shareToken={gallery.shareToken} 
                  photoCount={gallery.photos.length} 
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">{gallery.title}</h2>
                  <GalleryStats 
                    totalPhotos={gallery.photos.length} 
                    likedPhotos={likedCount}
                    createdAt={gallery.createdAt}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleStartNew}>
                    <RefreshCw className="w-4 h-4" />
                    New Session
                  </Button>
                  <ExportButton galleryId={gallery.id} likedCount={likedCount} />
                </div>
              </div>

              <PhotoGallery 
                photos={gallery.photos} 
                onToggleLike={handleToggleLike}
                showFilenames
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;