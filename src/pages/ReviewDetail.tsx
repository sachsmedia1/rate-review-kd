import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { renderFlames } from "@/lib/renderFlames";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Review } from "@/types";

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
  const [similarReviews, setSimilarReviews] = useState<SimilarReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

      setReview(reviewData as Review);

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
  const openBeforeAfterLightbox = () => {
    setBeforeAfterView('both');
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const toggleView = (view: 'before' | 'after' | 'both') => {
    setBeforeAfterView(view);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === '1') toggleView('before');
      if (e.key === '2') toggleView('both');
      if (e.key === '3') toggleView('after');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

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
        <meta property="og:image" content={review.after_image_url || review.before_image_url || 'https://yourdomain.com/default-og-image.jpg'} />
        <meta property="article:published_time" content={review.installation_date} />
        <meta property="article:author" content="Der Kamindoktor" />
        <meta property="article:section" content={review.product_category} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://yourdomain.com/bewertung/${review.slug}`} />
        <meta property="twitter:title" content={`${review.customer_salutation} ${review.customer_lastname} - ${review.product_category}`} />
        <meta property="twitter:description" content={`⭐ ${review.average_rating.toFixed(1)}/5.0 - ${review.customer_comment || 'Kundenbewertung'}`} />
        <meta property="twitter:image" content={review.after_image_url || review.before_image_url || 'https://yourdomain.com/default-twitter-image.jpg'} />
        
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
          {review.before_image_url && review.after_image_url && (
            <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Vorher- und Nachher-Bilder
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* VORHER-Bild */}
                <div className="relative group">
                  <div className="absolute top-3 left-3 z-10 bg-gray-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    VORHER
                  </div>
                  <button
                    onClick={() => openBeforeAfterLightbox()}
                    className="relative w-full aspect-video rounded-lg overflow-hidden
                               border-2 border-transparent hover:border-gray-500 transition-all
                               cursor-pointer"
                  >
                    <img
                      src={review.before_image_url}
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
                    onClick={() => openBeforeAfterLightbox()}
                    className="relative w-full aspect-video rounded-lg overflow-hidden
                               border-2 border-transparent hover:border-orange-500 transition-all
                               cursor-pointer"
                  >
                    <img
                      src={review.after_image_url}
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
              {/* Beratung */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <span className="text-white font-medium">Beratung</span>
                <div className="flex gap-0.5 text-lg">
                  {renderFlames(review.rating_consultation)}
                </div>
              </div>
              
              {/* Professionalität */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <span className="text-white font-medium">Professionalität</span>
                <div className="flex gap-0.5 text-lg">
                  {renderFlames(review.rating_installation_quality)}
                </div>
              </div>
              
              {/* Service */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <span className="text-white font-medium">Service</span>
                <div className="flex gap-0.5 text-lg">
                  {renderFlames(review.rating_service)}
                </div>
              </div>
              
              {/* Optik */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                <span className="text-white font-medium">Optik</span>
                <div className="flex gap-0.5 text-lg">
                  {renderFlames(review.rating_aesthetics)}
                </div>
              </div>
              
              {/* Gefahrenanalyse (optional) */}
              {review.rating_fire_safety !== null && review.rating_fire_safety !== undefined && (
                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                  <span className="text-white font-medium">Gefahrenanalyse</span>
                  <div className="flex gap-0.5 text-lg">
                    {renderFlames(review.rating_fire_safety)}
                  </div>
                </div>
              )}
              
              {/* Heizleistung (optional) */}
              {review.rating_heating_performance !== null && review.rating_heating_performance !== undefined && (
                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
                  <span className="text-white font-medium">Heizleistung</span>
                  <div className="flex gap-0.5 text-lg">
                    {renderFlames(review.rating_heating_performance)}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Häufig gestellte Fragen zu dieser Bewertung
            </h2>
            
            <div className="space-y-4">
              <div className="border-b border-[#2a2a2a] pb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Wie wurde die Beratungsqualität bewertet?
                </h3>
                <p className="text-gray-300">
                  {review.rating_consultation.toFixed(1)} von 5.0 Punkten
                </p>
              </div>
              
              <div className="border-b border-[#2a2a2a] pb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Wo wurde diese Dienstleistung durchgeführt?
                </h3>
                <p className="text-gray-300">
                  In {review.city} ({review.postal_code}), Deutschland
                </p>
              </div>
              
              <div className="border-b border-[#2a2a2a] pb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Welche Art von Dienstleistung wurde bewertet?
                </h3>
                <p className="text-gray-300">
                  {review.product_category}
                </p>
              </div>
              
              <div className="border-b border-[#2a2a2a] pb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Wie ist die Gesamtbewertung?
                </h3>
                <p className="text-gray-300">
                  {review.average_rating.toFixed(1)} von 5.0 Punkten - {getRatingLabel(review.average_rating)}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Wann wurde diese Bewertung abgegeben?
                </h3>
                <p className="text-gray-300">
                  Am {new Date(review.installation_date).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </section>

          {/* Ähnliche Bewertungen */}
          {similarReviews && similarReviews.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Weitere {review.product_category}-Bewertungen
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similarReviews.map(similar => (
                  <Link
                    key={similar.slug}
                    to={`/bewertung/${similar.slug}`}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4
                               hover:border-orange-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {similar.customer_salutation} {similar.customer_lastname}
                      </span>
                      <span className="text-orange-500 font-bold">
                        {similar.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{similar.city}</span>
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      {new Date(similar.installation_date).toLocaleDateString('de-DE')}
                    </div>
                  </Link>
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

      {/* Lightbox Modal - Vorher/Nachher */}
      {lightboxOpen && review.before_image_url && review.after_image_url && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-orange-500 z-50"
            onClick={closeLightbox}
            aria-label="Schließen"
          >
            ×
          </button>
          
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
                // Vergleichsansicht: Beide Bilder nebeneinander
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute top-3 left-3 z-10 bg-gray-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      VORHER
                    </div>
                    <img
                      src={review.before_image_url}
                      alt="Vorher"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute top-3 left-3 z-10 bg-orange-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      NACHHER
                    </div>
                    <img
                      src={review.after_image_url}
                      alt="Nachher"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              ) : beforeAfterView === 'before' ? (
                // Nur Vorher-Bild
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10 bg-gray-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    VORHER
                  </div>
                  <img
                    src={review.before_image_url}
                    alt="Vorher"
                    className="w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                  />
                </div>
              ) : (
                // Nur Nachher-Bild
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10 bg-orange-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    NACHHER
                  </div>
                  <img
                    src={review.after_image_url}
                    alt="Nachher"
                    className="w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewDetail;
