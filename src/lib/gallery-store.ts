import { v4 as uuidv4 } from 'uuid';

export interface Photo {
  id: string;
  filename: string;
  previewUrl: string;
  isLiked: boolean;
  metadata?: {
    make?: string;
    model?: string;
    dateTime?: string;
    iso?: number;
    fNumber?: number;
    exposureTime?: number;
    focalLength?: number;
  };
}

export interface Gallery {
  id: string;
  adminToken: string;
  shareToken: string;
  photos: Photo[];
  createdAt: Date;
  title: string;
  selectionsSubmitted: boolean;
}

// In-memory store for prototype (will be replaced with Supabase)
const galleries = new Map<string, Gallery>();

export function createGallery(title: string = 'Untitled Session'): Gallery {
  const gallery: Gallery = {
    id: uuidv4(),
    adminToken: uuidv4(),
    shareToken: uuidv4().slice(0, 8),
    photos: [],
    createdAt: new Date(),
    title,
    selectionsSubmitted: false,
  };
  
  galleries.set(gallery.id, gallery);
  return gallery;
}

export function getGalleryByShareToken(shareToken: string): Gallery | undefined {
  for (const gallery of galleries.values()) {
    if (gallery.shareToken === shareToken) {
      return gallery;
    }
  }
  return undefined;
}

export function getGalleryByAdminToken(adminToken: string): Gallery | undefined {
  for (const gallery of galleries.values()) {
    if (gallery.adminToken === adminToken) {
      return gallery;
    }
  }
  return undefined;
}

export function addPhotosToGallery(galleryId: string, photos: Omit<Photo, 'id' | 'isLiked'>[]): Photo[] {
  const gallery = galleries.get(galleryId);
  if (!gallery) throw new Error('Gallery not found');
  
  const newPhotos: Photo[] = photos.map(photo => ({
    ...photo,
    id: uuidv4(),
    isLiked: false,
  }));
  
  gallery.photos.push(...newPhotos);
  return newPhotos;
}

export function togglePhotoLike(galleryId: string, photoId: string): boolean {
  const gallery = galleries.get(galleryId);
  if (!gallery) throw new Error('Gallery not found');
  
  const photo = gallery.photos.find(p => p.id === photoId);
  if (!photo) throw new Error('Photo not found');
  
  photo.isLiked = !photo.isLiked;
  return photo.isLiked;
}

export function submitSelections(galleryId: string): void {
  const gallery = galleries.get(galleryId);
  if (!gallery) throw new Error('Gallery not found');
  
  gallery.selectionsSubmitted = true;
}

export function getLikedPhotos(galleryId: string): Photo[] {
  const gallery = galleries.get(galleryId);
  if (!gallery) throw new Error('Gallery not found');
  
  return gallery.photos.filter(p => p.isLiked);
}

export function exportSelections(galleryId: string, format: 'json' | 'csv' = 'json'): string {
  const likedPhotos = getLikedPhotos(galleryId);
  const filenames = likedPhotos.map(p => p.filename);
  
  if (format === 'csv') {
    return 'filename\n' + filenames.join('\n');
  }
  
  return JSON.stringify({ 
    exportedAt: new Date().toISOString(),
    totalSelected: filenames.length,
    filenames 
  }, null, 2);
}
