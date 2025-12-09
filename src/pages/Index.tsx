import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Camera, Share2, Download, LogIn } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <motion.div 
            className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Camera className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.h1 
            className="text-5xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Photo Culling Made{' '}
            <span className="text-gradient">Simple</span>
          </motion.h1>

          <motion.p 
            className="text-xl text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Share your photos with clients directly from Google Drive. 
            Let them pick their favorites, and export the selected filenames.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
              <LogIn className="w-5 h-5" />
              Get Started
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { 
                icon: <Camera className="w-6 h-6" />, 
                title: 'Connect Google Drive', 
                desc: 'Link your folders containing photos' 
              },
              { 
                icon: <Share2 className="w-6 h-6" />, 
                title: 'Share with Clients', 
                desc: 'Send a link — no login required for them' 
              },
              { 
                icon: <Download className="w-6 h-6" />, 
                title: 'Export Selections', 
                desc: 'Get a list of favorited filenames' 
              },
            ].map((item, i) => (
              <div key={i} className="card-elevated p-6 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
