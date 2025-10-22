import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import type { Review } from '@/types';

interface LinkedReview {
  id: string;
  customer_salutation: string;
  customer_lastname: string;
  city: string;
}

interface ReviewImagePair {
  reviewId: string;
  reviewInfo: LinkedReview;
  beforeImage: string | null;
  afterImage: string | null;
  created_at: string;
}

const Images = () => {
  const navigate = useNavigate();
  const [reviewPairs, setReviewPairs] = useState<ReviewImagePair[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; type: string; reviewInfo: LinkedReview } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Lade alle Bewertungen mit Bildern aus der Datenbank
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, customer_salutation, customer_lastname, city, before_image_url, after_image_url, created_at')
      .order('created_at', { ascending: false });
    
    if (!reviewsData) {
      setLoading(false);
      return;
    }
    
    // Gruppiere Bilder nach Review (nur Reviews mit mindestens einem Bild)
    const pairs: ReviewImagePair[] = reviewsData
      .filter(review => review.before_image_url || review.after_image_url)
      .map(review => ({
        reviewId: review.id,
        reviewInfo: {
          id: review.id,
          customer_salutation: review.customer_salutation,
          customer_lastname: review.customer_lastname,
          city: review.city
        },
        beforeImage: review.before_image_url,
        afterImage: review.after_image_url,
        created_at: review.created_at
      }));
    
    setReviewPairs(pairs);
    setLoading(false);
  };

  // Filter anwenden
  const filteredPairs = reviewPairs.filter(pair => {
    // Typ-Filter
    if (typeFilter === 'before' && !pair.beforeImage) return false;
    if (typeFilter === 'after' && !pair.afterImage) return false;
    
    // Suche (in Review-Info)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesCustomer = pair.reviewInfo.customer_lastname.toLowerCase().includes(searchLower);
      const matchesCity = pair.reviewInfo.city.toLowerCase().includes(searchLower);
      if (!matchesCustomer && !matchesCity) return false;
    }
    
    return true;
  });

  // Statistiken berechnen
  const stats = {
    total: reviewPairs.length,
    before: reviewPairs.filter(p => p.beforeImage).length,
    after: reviewPairs.filter(p => p.afterImage).length,
  };

  // Pagination (gilt für Review-Paare, nicht einzelne Bilder)
  const totalPages = Math.ceil(filteredPairs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPairs = filteredPairs.slice(startIndex, endIndex);

  // Bei Filter-Änderung auf Seite 1 zurück
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchQuery]);

  // Lightbox
  const openLightbox = (url: string, type: string, reviewInfo: LinkedReview) => {
    setLightboxImage({ url, type, reviewInfo });
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  // Helper-Funktionen
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE');
  }

  return (
    <>
      <Helmet>
        <title>Bilderverwaltung | Der Kamindoktor Admin</title>
        <meta name="description" content="Verwaltung aller Vorher- und Nachher-Bilder" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
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
      
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          <option value="all">Alle Bilder</option>
          <option value="before">Nur Vorher-Bilder</option>
          <option value="after">Nur Nachher-Bilder</option>
        </select>
        
        <input
          type="text"
          placeholder="Suche nach Kunde oder Stadt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        />
      </div>
      
      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-orange-500">
            {stats.total}
          </div>
          <div className="text-sm text-gray-400">Bewertungen mit Bildern</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-500">
            {stats.before}
          </div>
          <div className="text-sm text-gray-400">Mit Vorher-Bild</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-500">
            {stats.after}
          </div>
          <div className="text-sm text-gray-400">Mit Nachher-Bild</div>
        </div>
      </div>
      
      {/* Pagination Info */}
      {!loading && filteredPairs.length > 0 && (
        <div className="mb-4 text-center text-gray-400">
          Seite {currentPage} von {totalPages} ({filteredPairs.length} Bewertungen)
        </div>
      )}

      {/* Bild-Galerie (Paarweise) */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Lade Bilder...</p>
        </div>
      ) : filteredPairs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl">Keine Bilder gefunden</p>
        </div>
      ) : (
        <>
        <div className="space-y-6 mb-8">
          {paginatedPairs.map((pair) => (
            <div key={pair.reviewId} className="bg-gray-800 rounded-lg p-4">
              {/* Review-Info Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">
                    {pair.reviewInfo.customer_salutation} {pair.reviewInfo.customer_lastname}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {pair.reviewInfo.city} • {formatDate(pair.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/reviews/${pair.reviewId}/edit`)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Bewertung bearbeiten
                </button>
              </div>

              {/* Bilder nebeneinander */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vorher-Bild */}
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="relative aspect-video">
                    {pair.beforeImage ? (
                      <img
                        src={pair.beforeImage}
                        alt={`Vorher - ${pair.reviewInfo.customer_lastname}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(pair.beforeImage!, 'before', pair.reviewInfo)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📷</div>
                          <div className="text-sm">Kein Vorher-Bild</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 rounded text-xs font-semibold">
                      Vorher
                    </div>
                  </div>
                </div>

                {/* Nachher-Bild */}
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="relative aspect-video">
                    {pair.afterImage ? (
                      <img
                        src={pair.afterImage}
                        alt={`Nachher - ${pair.reviewInfo.customer_lastname}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(pair.afterImage!, 'after', pair.reviewInfo)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📷</div>
                          <div className="text-sm">Kein Nachher-Bild</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 rounded text-xs font-semibold">
                      Nachher
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              ← Vorherige
            </button>
            
            <span className="text-gray-400">
              Seite {currentPage} von {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Nächste →
            </button>
          </div>
        )}
        </>
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
              src={lightboxImage.url}
              alt={`${lightboxImage.type === 'before' ? 'Vorher' : 'Nachher'} - ${lightboxImage.reviewInfo.customer_lastname}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Info-Bar unten */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
              <div className="text-white font-semibold">
                {lightboxImage.reviewInfo.customer_salutation} {lightboxImage.reviewInfo.customer_lastname}
              </div>
              <div className="text-gray-400 text-sm">
                {lightboxImage.reviewInfo.city} • 
                {lightboxImage.type === 'before' ? ' Vorher-Bild' : ' Nachher-Bild'}
              </div>
              <div className="text-blue-400 text-sm mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeLightbox();
                    navigate(`/admin/reviews/${lightboxImage.reviewInfo.id}/edit`);
                  }}
                  className="hover:text-blue-300 transition-colors underline"
                >
                  → Bewertung bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Images;
