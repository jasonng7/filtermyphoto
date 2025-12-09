import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, Image } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingProgressProps {
  current: number;
  total: number;
  currentFilename: string;
  stage: 'extracting' | 'uploading' | 'complete';
}

export function ProcessingProgress({ current, total, currentFilename, stage }: ProcessingProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        {stage === 'complete' ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center"
          >
            <Check className="w-5 h-5 text-success" />
          </motion.div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {stage === 'complete' ? 'Processing Complete!' : 
             stage === 'extracting' ? 'Extracting Previews...' : 'Uploading...'}
          </h3>
          <p className="text-sm text-muted-foreground font-mono truncate max-w-md">
            {stage === 'complete' ? `${total} photos ready for review` : currentFilename}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{percentage}%</span>
          <p className="text-xs text-muted-foreground">{current} / {total}</p>
        </div>
      </div>
      
      <Progress value={percentage} className="h-2" />
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Image className="w-4 h-4" />
        <span>Processing lightweight JPEG previews from ARW files</span>
      </div>
    </motion.div>
  );
}
