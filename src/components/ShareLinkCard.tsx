import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Link, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareLinkCardProps {
  shareToken: string;
  photoCount: number;
}

export function ShareLinkCard({ shareToken, photoCount }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/gallery/${shareToken}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with your client to let them select their favorites.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Link className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-lg">Gallery Ready!</h3>
          <p className="text-sm text-muted-foreground">
            {photoCount} photos ready for client review
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
        <code className="flex-1 text-sm text-foreground font-mono truncate">
          {shareUrl}
        </code>
      </div>

      <div className="flex gap-3">
        <Button
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleOpen}
        >
          <ExternalLink className="w-4 h-4" />
          Preview
        </Button>
      </div>
    </motion.div>
  );
}
