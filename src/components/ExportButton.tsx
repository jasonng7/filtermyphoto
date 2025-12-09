import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportSelections } from '@/lib/gallery-store';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  galleryId: string;
  likedCount: number;
}

export function ExportButton({ galleryId, likedCount }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = (format: 'json' | 'csv') => {
    try {
      const content = exportSelections(galleryId, format);
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
        title: "Export successful!",
        description: `Downloaded ${likedCount} selected filenames as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export selections. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
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
  );
}
