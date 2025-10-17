import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { renderFlames } from "@/lib/renderFlames";
import { ArrowLeft, MapPin, Calendar, Image as ImageIcon } from "lucide-react";

interface Review {
  id: string;
  slug: string;
  customer_salutation: string;
  customer_firstname: string;
  customer_lastname: string;
  city: string;
  postal_code: string;
  product_category: string;
  installation_date: string;
  customer_comment: string | null;
  rating_consultation: number;
  rating_installation_quality: number;
  rating_service: number;
  rating_aesthetics: number;
  rating_fire_safety?: number | null;
  rating_heating_performance?: number | null;
  average_rating: number;
  is_published: boolean;
}

interface ReviewImage {
  id: string;
  review_id: string;
  image_url: string;
  caption?: string | null;
  display_order: number;
  image_type?: string; // 'before', 'after', 'normal'
}

interface SimilarReview {
  id: string;
  slug: string;
  customer_salutation: string;
  customer_lastname: string;
  city: string;
  product_category: string;
  average_rating: number;
  installation_date: string;
}

const ReviewDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [beforeImages, setBeforeImages] = useState<ReviewImage[]>([]);
  const [afterImages, setAfterImages] = useState<ReviewImage[]>([]);
  const [normalImages, setNormalImages] = useState<ReviewImage[]>([]);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState<Array<{before: ReviewImage, after: ReviewImage}>>([]);
  const [similarReviews, setSimilarReviews] = useState<SimilarReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxType, setLightboxType] = useState<'normal' | 'beforeAfter'>('normal');
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [beforeAfterIndex, setBeforeAfterIndex] = useState(0);
  const [beforeAfterView, setBeforeAfterView] = useState<'before' | 'after' | 'both'>('both');

  useEffect(() => {
    const fetchReview = async () => {
      if (!slug) return;

      setLoading(true);
      
      // Fetch main review
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (reviewError || !reviewData) {
        setError(true);
        setLoading(false);
        return;
      }

      setReview(reviewData);

      // Fetch all images
      const { data: allImagesData } = await supabase
        .from('review_images')
        .select('*')
        .eq('review_id', reviewData.id)
        .order('created_at', { ascending: true });

      if (allImagesData) {
        setImages(allImagesData);
        
        // Filter nach Typ
        const before = allImagesData.filter(img => img.image_type === 'before');
        const after = allImagesData.filter(img => img.image_type === 'after');
        const normal = allImagesData.filter(img => img.image_type === 'normal' || !img.image_type);
        
        setBeforeImages(before);
        setAfterImages(after);
        setNormalImages(normal);
        
        // Erstelle Vorher-/Nachher-Paare
        const pairs = before.map((beforeImg, index) => ({
          before: beforeImg,
          after: after[index]
        })).filter(pair => pair.after !== undefined);
        
        setBeforeAfterPairs(pairs);
        
        console.log('Debug - Bilder geladen:', {
          total: allImagesData.length,
          before: before.length,
          after: after.length,
          normal: normal.length,
          pairs: pairs.length
        });
      }

      // Fetch similar reviews (same category)
      const { data: similarData } = await supabase
        .from('reviews')
        .select('id, slug, customer_salutation, customer_lastname, city, product_category, average_rating, installation_date')
        .eq('product_category', reviewData.product_category)
        .eq('is_published', true)
        .neq('id', reviewData.id)
        .order('installation_date', { ascending: false })
        .limit(3);

      if (similarData) {
        setSimilarReviews(similarData);
      }

      setLoading(false);
    };

    fetchReview();
  }, [slug]);

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Normale Bildergalerie öffnen
  const openNormalLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxType('normal');
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Vorher-/Nachher-Lightbox öffnen
  const openBeforeAfterLightbox = (pairIndex: number) => {
    setBeforeAfterIndex(pairIndex);
    setBeforeAfterView('both');
    setLightboxType('beforeAfter');
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Navigation für Vorher-/Nachher-Paare
  const nextBeforeAfterPair = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBeforeAfterIndex((prev) => (prev + 1) % beforeAfterPairs.length);
  };

  const prevBeforeAfterPair = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBeforeAfterIndex((prev) => (prev - 1 + beforeAfterPairs.length) % beforeAfterPairs.length);
  };

  // View-Toggle
  const toggleView = (view: 'before' | 'after' | 'both') => {
    setBeforeAfterView(view);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (lightboxType === 'normal') {
        if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % normalImages.length);
        if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + normalImages.length) % normalImages.length);
      } else if (lightboxType === 'beforeAfter') {
        if (e.key === 'ArrowRight') setBeforeAfterIndex((prev) => (prev + 1) % beforeAfterPairs.length);
        if (e.key === 'ArrowLeft') setBeforeAfterIndex((prev) => (prev - 1 + beforeAfterPairs.length) % beforeAfterPairs.length);
        if (e.key === '1') setBeforeAfterView('before');
        if (e.key === '2') setBeforeAfterView('both');
        if (e.key === '3') setBeforeAfterView('after');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxType, normalImages.length, beforeAfterPairs.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Lädt...</div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bewertung nicht gefunden
          </h1>
          <p className="text-gray-400 mb-8">
            Die angeforderte Bewertung existiert nicht oder wurde entfernt.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg inline-flex items-center gap-2
                       hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Ausgezeichnet';
    if (rating >= 4.0) return 'Sehr gut';
    if (rating >= 3.5) return 'Gut';
    if (rating >= 3.0) return 'Befriedigend';
    return 'Ausreichend';
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{review.customer_salutation} {review.customer_lastname} - {review.product_category} in {review.city} | Der Kamindoktor</title>
        <meta name="title" content={`${review.customer_salutation} ${review.customer_lastname} - ${review.product_category} in ${review.city} | Der Kamindoktor`} />
        <meta name="description" content={`⭐ ${review.average_rating.toFixed(1)}/5.0 - ${review.customer_comment?.substring(0, 150) || 'Kundenbewertung für ' + review.product_category}...`} />
        <meta name="keywords" content={`${review.product_category}, Kundenbewertung, ${review.city}, ${review.postal_code}, Kaminbau, Der Kamindoktor`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://yourdomain.com/bewertung/${review.slug}`} />
        <meta property="og:title" content={`${review.customer_salutation} ${review.customer_lastname} - ${review.product_category} in ${review.city}`} />
        <meta property="og:description" content={`⭐ ${review.average_rating.toFixed(1)}/5.0 - ${review.customer_comment?.substring(0, 150) || 'Kundenbewertung'}...`} />
        <meta property="og:image" content={images[0]?.image_url || 'https://yourdomain.com/default-og-image.jpg'} />
        <meta property="article:published_time" content={review.installation_date} />
        <meta property="article:author" content="Der Kamindoktor" />
        <meta property="article:section" content={review.product_category} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://yourdomain.com/bewertung/${review.slug}`} />
        <meta property="twitter:title" content={`${review.customer_salutation} ${review.customer_lastname} - ${review.product_category}`} />
        <meta property="twitter:description" content={`⭐ ${review.average_rating.toFixed(1)}/5.0 - ${review.customer_comment || 'Kundenbewertung'}`} />
        <meta property="twitter:image" content={images[0]?.image_url || 'https://yourdomain.com/default-twitter-image.jpg'} />
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            "itemReviewed": {
              "@type": "LocalBusiness",
              "name": "Der Kamindoktor",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": review.city,
                "postalCode": review.postal_code,
                "addressCountry": "DE"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": review.average_rating.toFixed(1),
                "bestRating": "5",
                "worstRating": "1"
              }
            },
            "author": {
              "@type": "Person",
              "name": `${review.customer_salutation} ${review.customer_lastname}`
            },
            "datePublished": review.installation_date,
            "reviewBody": review.customer_comment || "",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": review.average_rating.toFixed(1),
              "bestRating": "5",
              "worstRating": "1"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-orange-500 transition">
                  Startseite
                </Link>
              </li>
              <li className="text-gray-600">/</li>
              <li>
                <Link 
                  to={`/?category=${review.product_category}`} 
                  className="hover:text-orange-500 transition"
                >
                  {review.product_category}
                </Link>
              </li>
              <li className="text-gray-600">/</li>
              <li className="text-white truncate max-w-[200px]">
                {review.customer_salutation} {review.customer_lastname}
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <header className="mb-8">
            {/* Kategorie Badge */}
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-orange-500/20 text-orange-500 rounded-full text-sm font-medium">
                {review.product_category}
              </span>
            </div>
            
            {/* Hauptüberschrift */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Bewertung von {review.customer_salutation} {review.customer_lastname}
            </h1>
            
            {/* Standort & Datum */}
            <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <MapPin size={20} />
                <address className="not-italic">
                  {review.city} ({review.postal_code})
                </address>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                <time dateTime={review.installation_date}>
                  {new Date(review.installation_date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </time>
              </div>
            </div>
            
            {/* Gesamtbewertung */}
            <div className="flex items-center gap-4">
              <div className="text-6xl font-bold text-white">
                {review.average_rating.toFixed(1)}
              </div>
              <div className="flex flex-col">
                <div className="flex gap-1 text-3xl">
                  {renderFlames(review.average_rating)}
                </div>
                <span className="text-gray-400 text-sm mt-1">
                  von 5.0 Punkten
                </span>
              </div>
            </div>
          </header>

          {/* KI-Optimierte Zusammenfassung (hidden visually, readable by AI) */}
          <section className="sr-only" aria-label="Strukturierte Zusammenfassung">
            <h2>Bewertungszusammenfassung</h2>
            <p>
              Diese Kundenbewertung wurde von {review.customer_salutation} {review.customer_lastname} aus {review.city} ({review.postal_code}) 
              am {new Date(review.installation_date).toLocaleDateString('de-DE')} abgegeben. 
              Die Dienstleistung "{review.product_category}" von Der Kamindoktor wurde mit durchschnittlich {review.average_rating.toFixed(1)} von 5.0 Punkten bewertet.
            </p>
            <ul>
              <li>Beratungsqualität: {review.rating_consultation.toFixed(1)} von 5.0</li>
              <li>Verarbeitungsqualität: {review.rating_installation_quality.toFixed(1)} von 5.0</li>
              <li>Service: {review.rating_service.toFixed(1)} von 5.0</li>
              <li>Ästhetik: {review.rating_aesthetics.toFixed(1)} von 5.0</li>
              {review.rating_fire_safety !== null && review.rating_fire_safety !== undefined && (
                <li>Brandsicherheit: {review.rating_fire_safety.toFixed(1)} von 5.0</li>
              )}
              {review.rating_heating_performance !== null && review.rating_heating_performance !== undefined && (
                <li>Heizleistung: {review.rating_heating_performance.toFixed(1)} von 5.0</li>
              )}
            </ul>
          </section>

          {/* Bewertungstext */}
          {review.customer_comment && (
            <article className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Kundenmeinung
              </h2>
              <blockquote className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                "{review.customer_comment}"
              </blockquote>
            </article>
          )}

          {/* Vorher-/Nachher-Bilder */}
          {beforeAfterPairs.length > 0 && (
            <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Vorher- und Nachher-Bilder
              </h2>
              
              <div className="space-y-8">
                {beforeAfterPairs.map((pair, pairIndex) => (
                  <div key={pairIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* VORHER-Bild */}
                    <div className="relative group">
                      <div className="absolute top-3 left-3 z-10 bg-gray-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        VORHER
                      </div>
                      <button
                        onClick={() => openBeforeAfterLightbox(pairIndex)}
                        className="relative w-full aspect-video rounded-lg overflow-hidden
                                   border-2 border-transparent hover:border-gray-500 transition-all
                                   cursor-pointer"
                      >
                        <img
                          src={pair.before.image_url}
                          alt={`Vorher-Zustand - ${review.product_category} in ${review.city}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors
                                        flex items-center justify-center">
                          <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                            🔍
                          </span>
                        </div>
                      </button>
                    </div>
                    
                    {/* NACHHER-Bild */}
                    <div className="relative group">
                      <div className="absolute top-3 left-3 z-10 bg-orange-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        NACHHER
                      </div>
                      <button
                        onClick={() => openBeforeAfterLightbox(pairIndex)}
                        className="relative w-full aspect-video rounded-lg overflow-hidden
                                   border-2 border-transparent hover:border-orange-500 transition-all
                                   cursor-pointer"
                      >
                        <img
                          src={pair.after.image_url}
                          alt={`Nachher-Zustand - ${review.product_category} in ${review.city} - Bewertet mit ${review.average_rating.toFixed(1)} Sternen`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors
                                        flex items-center justify-center">
                          <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                            🔍
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-gray-400 text-sm mt-6 text-center">
                💡 Klicken Sie auf ein Bild für eine größere Ansicht
              </p>
            </section>
          )}

          {/* Detail-Bewertungen */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Detailbewertungen
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Beratungsqualität */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <span className="text-white font-medium">Beratungsqualität</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    {review.rating_consultation.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 text-lg">
                    {renderFlames(review.rating_consultation)}
                  </div>
                </div>
              </div>
              
              {/* Verarbeitungsqualität */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔧</span>
                  <span className="text-white font-medium">Verarbeitungsqualität</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    {review.rating_installation_quality.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 text-lg">
                    {renderFlames(review.rating_installation_quality)}
                  </div>
                </div>
              </div>
              
              {/* Service */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤝</span>
                  <span className="text-white font-medium">Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    {review.rating_service.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 text-lg">
                    {renderFlames(review.rating_service)}
                  </div>
                </div>
              </div>
              
              {/* Ästhetik */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <span className="text-white font-medium">Ästhetik</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    {review.rating_aesthetics.toFixed(1)}
                  </span>
                  <div className="flex gap-0.5 text-lg">
                    {renderFlames(review.rating_aesthetics)}
                  </div>
                </div>
              </div>
              
              {/* Brandsicherheit (optional) */}
              {review.rating_fire_safety !== null && review.rating_fire_safety !== undefined && (
                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-white font-medium">Brandsicherheit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">
                      {review.rating_fire_safety.toFixed(1)}
                    </span>
                    <div className="flex gap-0.5 text-lg">
                      {renderFlames(review.rating_fire_safety)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Heizleistung (optional) */}
              {review.rating_heating_performance !== null && review.rating_heating_performance !== undefined && (
                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <span className="text-white font-medium">Heizleistung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">
                      {review.rating_heating_performance.toFixed(1)}
                    </span>
                    <div className="flex gap-0.5 text-lg">
                      {renderFlames(review.rating_heating_performance)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Projektbilder (nur normale Bilder) */}
          {normalImages && normalImages.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <ImageIcon size={24} />
                Projektbilder <span className="text-gray-400 text-lg">({normalImages.length})</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {normalImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => openNormalLightbox(index)}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer
                               border-2 border-transparent hover:border-orange-500 transition-all"
                  >
                    <img
                      src={image.image_url}
                      alt={`${review.product_category} - ${review.city} - Bild ${index + 1} von ${normalImages.length}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors
                                    flex items-center justify-center">
                      <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                        🔍
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Call-to-Action & Navigation */}
          <footer className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Link
              to="/"
              className="px-6 py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg
                         hover:border-orange-500 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Zurück zur Übersicht
            </Link>
            
            <Link
              to={`/?category=${review.product_category}`}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg
                         hover:bg-orange-600 transition-colors"
            >
              Mehr {review.product_category}-Bewertungen anzeigen
            </Link>
          </footer>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-orange-500 z-50"
            onClick={closeLightbox}
            aria-label="Schließen"
          >
            ×
          </button>
          
          {lightboxType === 'normal' ? (
            // NORMALE BILDERGALERIE
            <>
              {normalImages.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-orange-500 z-50"
                    onClick={prevImage}
                    aria-label="Vorheriges Bild"
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-orange-500 z-50"
                    onClick={nextImage}
                    aria-label="Nächstes Bild"
                  >
                    ›
                  </button>
                </>
              )}
              
              <div className="flex-1 flex items-center justify-center p-4">
                <img
                  src={normalImages[lightboxIndex]?.image_url}
                  alt={`${review.product_category} - ${review.city} - Bild ${lightboxIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center bg-black/70 px-4 py-2 rounded-lg">
                <p>Bild {lightboxIndex + 1} von {normalImages.length}</p>
              </div>
            </>
          ) : (
            // VORHER-/NACHHER LIGHTBOX
            <>
              {beforeAfterPairs.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-orange-500 z-50"
                    onClick={prevBeforeAfterPair}
                    aria-label="Vorheriges Paar"
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-orange-500 z-50"
                    onClick={nextBeforeAfterPair}
                    aria-label="Nächstes Paar"
                  >
                    ›
                  </button>
                </>
              )}
              
              {/* View Toggle Buttons */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleView('before'); }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    beforeAfterView === 'before' 
                      ? 'bg-gray-500 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Nur Vorher
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleView('both'); }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    beforeAfterView === 'both' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Vergleich
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleView('after'); }}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    beforeAfterView === 'after' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Nur Nachher
                </button>
              </div>
              
              {/* Bildanzeige */}
              <div className="flex-1 flex items-center justify-center p-4 pt-20">
                <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
                  {beforeAfterView === 'both' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <div className="absolute top-3 left-3 z-10 bg-gray-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          VORHER
                        </div>
                        <img
                          src={beforeAfterPairs[beforeAfterIndex]?.before.image_url}
                          alt="Vorher"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute top-3 left-3 z-10 bg-orange-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          NACHHER
                        </div>
                        <img
                          src={beforeAfterPairs[beforeAfterIndex]?.after.image_url}
                          alt="Nachher"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  ) : beforeAfterView === 'before' ? (
                    <div className="relative">
                      <div className="absolute top-3 left-3 z-10 bg-gray-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        VORHER
                      </div>
                      <img
                        src={beforeAfterPairs[beforeAfterIndex]?.before.image_url}
                        alt="Vorher"
                        className="w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute top-3 left-3 z-10 bg-orange-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        NACHHER
                      </div>
                      <img
                        src={beforeAfterPairs[beforeAfterIndex]?.after.image_url}
                        alt="Nachher"
                        className="w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {beforeAfterPairs.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center bg-black/70 px-4 py-2 rounded-lg">
                  <p>Vergleich {beforeAfterIndex + 1} von {beforeAfterPairs.length}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ReviewDetail;
