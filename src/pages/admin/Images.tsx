import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Review } from '@/types';

interface LinkedReview {
  id: string;
  customer_salutation: string;
  customer_lastname: string;
  city: string;
}

interface StorageImage {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
  type: 'before' | 'after';
  folder: string;
  publicUrl: string;
  isUsed: boolean;
  linkedReview: LinkedReview | null;
  size: number;
}

const Images = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<StorageImage[]>([]);
  const [reviews, setReviews] = useState<LinkedReview[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<StorageImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // 1. Lade alle Bewertungen (um Verwendung zu prüfen)
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, customer_salutation, customer_lastname, city, before_image_url, after_image_url');
    
    setReviews((reviewsData as LinkedReview[]) || []);
    
    // 2. Lade Bilder aus Storage
    const { data: beforeFiles } = await supabase.storage
      .from('review-images')
      .list('before', { limit: 1000 });
    
    const { data: afterFiles } = await supabase.storage
      .from('review-images')
      .list('after', { limit: 1000 });
    
    // 3. Kombiniere und reichere Daten an
    const allImages = [
      ...(beforeFiles || []).map(f => ({ ...f, type: 'before' as const, folder: 'before' })),
      ...(afterFiles || []).map(f => ({ ...f, type: 'after' as const, folder: 'after' }))
    ];
    
    // 4. Prüfe für jedes Bild ob es verwendet wird
    const enrichedImages = allImages.map(img => {
      const { data: { publicUrl } } = supabase.storage
        .from('review-images')
        .getPublicUrl(`${img.folder}/${img.name}`);
      
      // Prüfe ob URL in irgendeiner Review vorkommt
      const linkedReview = reviewsData?.find(r => 
        r.before_image_url?.includes(img.name) || 
        r.after_image_url?.includes(img.name)
      );
      
      return {
        ...img,
        publicUrl,
        isUsed: !!linkedReview,
        linkedReview: linkedReview ? {
          id: linkedReview.id,
          customer_salutation: linkedReview.customer_salutation,
          customer_lastname: linkedReview.customer_lastname,
          city: linkedReview.city
        } : null,
        size: img.metadata?.size || 0
      };
    });
    
    setImages(enrichedImages);
    setLoading(false);
  };

  // Filter anwenden
  const filteredImages = images.filter(img => {
    // Typ-Filter
    if (typeFilter === 'before' && img.type !== 'before') return false;
    if (typeFilter === 'after' && img.type !== 'after') return false;
    
    // Verwendung-Filter
    if (usageFilter === 'used' && !img.isUsed) return false;
    if (usageFilter === 'unused' && img.isUsed) return false;
    
    // Suche
    if (searchQuery && !img.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Statistiken berechnen
  const stats = {
    total: images.length,
    used: images.filter(i => i.isUsed).length,
    unused: images.filter(i => !i.isUsed).length,
    totalSize: images.reduce((sum, i) => sum + (i.size || 0), 0)
  };

  const unusedCount = stats.unused;

  // Nicht verwendete Bilder löschen
  const handleDeleteUnused = async () => {
    const unusedImages = images.filter(i => !i.isUsed);
    
    if (unusedImages.length === 0) {
      toast({
        title: 'Keine nicht verwendeten Bilder vorhanden',
        variant: 'default'
      });
      return;
    }
    
    const confirmed = confirm(
      `Möchten Sie wirklich ${unusedImages.length} nicht verwendete Bilder löschen? Dies kann nicht rückgängig gemacht werden.`
    );
    
    if (!confirmed) return;
    
    let deleted = 0;
    
    for (const img of unusedImages) {
      const { error } = await supabase.storage
        .from('review-images')
        .remove([`${img.folder}/${img.name}`]);
      
      if (!error) deleted++;
    }
    
    toast({
      title: `${deleted} Bilder erfolgreich gelöscht`,
      variant: 'default'
    });
    loadData();
  };

  // Einzelnes Bild löschen
  const handleDeleteImage = async (image: StorageImage) => {
    if (image.isUsed) {
      const confirmed = confirm(
        'Dieses Bild wird in einer Bewertung verwendet. Wirklich löschen? Die Bewertung verliert dann das Bild.'
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm('Bild wirklich löschen?');
      if (!confirmed) return;
    }
    
    const { error } = await supabase.storage
      .from('review-images')
      .remove([`${image.folder}/${image.name}`]);
    
    if (!error) {
      toast({
        title: 'Bild gelöscht',
        variant: 'default'
      });
      loadData();
    } else {
      toast({
        title: 'Löschen fehlgeschlagen',
        variant: 'destructive'
      });
    }
  };

  // Lightbox
  const openLightbox = (image: StorageImage) => {
    setLightboxImage(image);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  // Helper-Funktionen
  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          ← Zurück zum Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-white mb-2">
          Bilderverwaltung
        </h1>
        <p className="text-gray-400">
          Verwaltung aller Vorher- und Nachher-Bilder
        </p>
      </div>
      
      <div className="border-t border-gray-800 mb-6"></div>
      
      {/* Aktionen & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Linke Seite: Filter */}
        <div className="flex flex-wrap gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">Alle Bilder</option>
            <option value="before">Nur Vorher-Bilder</option>
            <option value="after">Nur Nachher-Bilder</option>
          </select>
          
          <select
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">Alle Status</option>
            <option value="used">Verwendet</option>
            <option value="unused">Nicht verwendet</option>
          </select>
          
          <input
            type="text"
            placeholder="Suche nach Dateiname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
        </div>
        
        {/* Rechte Seite: Aktionen */}
        <div className="flex gap-4">
          <button
            onClick={handleDeleteUnused}
            disabled={unusedCount === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Nicht verwendete löschen ({unusedCount})
          </button>
        </div>
      </div>
      
      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-orange-500">
            {stats.total}
          </div>
          <div className="text-sm text-gray-400">Bilder gesamt</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-500">
            {stats.used}
          </div>
          <div className="text-sm text-gray-400">Verwendet</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-500">
            {stats.unused}
          </div>
          <div className="text-sm text-gray-400">Nicht verwendet</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-500">
            {formatBytes(stats.totalSize)}
          </div>
          <div className="text-sm text-gray-400">Speicher belegt</div>
        </div>
      </div>
      
      {/* Bild-Galerie */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Lade Bilder...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl">Keine Bilder gefunden</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <div key={image.name} className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Bild-Vorschau */}
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={image.publicUrl}
                  alt={image.name}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openLightbox(image)}
                  loading="lazy"
                />
                
                {/* Badge: Vorher/Nachher */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${
                  image.type === 'before' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {image.type === 'before' ? 'Vorher' : 'Nachher'}
                </div>
                
                {/* Badge: Verwendet Status */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                  image.isUsed ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {image.isUsed ? '✓ Verwendet' : '✗ Frei'}
                </div>
              </div>
              
              {/* Info & Aktionen */}
              <div className="p-3">
                <div className="text-xs text-gray-400 truncate mb-2" title={image.name}>
                  {image.name}
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {formatBytes(image.size)} • {formatDate(image.created_at)}
                </div>
                
                {/* Verknüpfte Bewertung (falls verwendet) */}
                {image.linkedReview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/reviews/${image.linkedReview.id}/edit`);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 mb-2 truncate w-full text-left transition-colors underline"
                  >
                    → {image.linkedReview.customer_salutation} {image.linkedReview.customer_lastname}, {image.linkedReview.city}
                  </button>
                )}
                
                {/* Aktionen */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openLightbox(image)}
                    className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    Ansehen
                  </button>
                  
                  <button
                    onClick={() => handleDeleteImage(image)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            {/* Schließen-Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-colors"
            >
              ×
            </button>
            
            {/* Bild */}
            <img
              src={lightboxImage.publicUrl}
              alt={lightboxImage.name}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Info-Bar unten */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
              <div className="text-white font-semibold">{lightboxImage.name}</div>
              <div className="text-gray-400 text-sm">
                {formatBytes(lightboxImage.size)} • 
                {lightboxImage.type === 'before' ? ' Vorher-Bild' : ' Nachher-Bild'} • 
                {lightboxImage.isUsed ? ' Verwendet' : ' Nicht verwendet'}
              </div>
              {lightboxImage.linkedReview && (
                <div className="text-blue-400 text-sm mt-1">
                  Verknüpft mit: 
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeLightbox();
                      navigate(`/admin/reviews/${lightboxImage.linkedReview.id}/edit`);
                    }}
                    className="ml-1 hover:text-blue-300 transition-colors underline"
                  >
                    {lightboxImage.linkedReview.customer_salutation} {lightboxImage.linkedReview.customer_lastname}, {lightboxImage.linkedReview.city}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Images;
