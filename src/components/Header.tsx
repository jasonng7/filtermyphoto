import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Aperture } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow">
            <Aperture className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">PhotoCull</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">RAW Preview Selector</p>
          </div>
        </Link>
        
        {showNav && (
          <nav className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              New Session
            </Link>
          </nav>
        )}
      </div>
    </motion.header>
  );
}
