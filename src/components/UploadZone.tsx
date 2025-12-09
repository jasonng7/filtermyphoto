import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, FileWarning, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  acceptedFiles?: string;
}

export function UploadZone({ onFilesSelected, isProcessing, acceptedFiles = '.arw,.ARW' }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.toLowerCase().endsWith('.arw')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  return (
    <motion.div
      className={cn(
        'upload-zone flex flex-col items-center justify-center p-12 min-h-[320px] cursor-pointer',
        isDragging && 'active',
        isProcessing && 'pointer-events-none opacity-60'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <input
        type="file"
        accept={acceptedFiles}
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Image className="w-10 h-10 text-primary" />
              </div>
              <p className="text-xl font-semibold text-primary">Drop your ARW files here</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">
                Upload Sony ARW Files
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Drag and drop your RAW files here, or click to browse.
                <br />
                <span className="text-primary font-medium">
                  Only embedded previews are uploaded — not full 50MB files!
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </motion.div>
  );
}
