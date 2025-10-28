import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, TrendingUp } from "lucide-react";
import { renderFlames } from "@/lib/renderFlames";
import { Helmet } from "react-helmet-async";
import { Review } from "@/types";
import { extractPathFromUrl, storage } from "@/lib/storage";

interface LocationStats {
  location: string;
  count: number;
  city: string;
  postalCode: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchPostalCode, setSearchPostalCode] = useState("");
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [liveCounters, setLiveCounters] = useState({ total: 0, avg: 0, year2025: 0 });
  const [countersLoading, setCountersLoading] = useState(true);

  const categories = [
    "Kaminofen",
    "Neubau Kaminanlage",
    "Austausch Kamineinsatz",
    "Kaminkassette",
    "Kaminkassette FreeStanding",
    "Austausch Kachelofeneinsatz",
  ];

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        setCountersLoading(true);
        const [totalRes, avgRes, yearRes] = await Promise.all([
          supabase
            .from("reviews")
            .select("*", { count: "exact", head: true })
            .eq("status", "published"),
          supabase
            .from("reviews")
            .select("average_rating")
            .eq("status", "published"),
          supabase
            .from("reviews")
            .select("*", { count: "exact", head: true })
            .eq("status", "published")
            .gte("installation_date", "2025-01-01"),
        ]);

        if (totalRes.error) throw totalRes.error;
        if (avgRes.error) throw avgRes.error;
        if (yearRes.error) throw yearRes.error;

        const ratings = (avgRes.data || [])
          .map((r: any) => r.average_rating)
          .filter((n: number | null) => typeof n === "number");
        const avg = ratings.length
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
          : 0;

        setLiveCounters({
          total: totalRes.count || 0,
          avg: Math.round(avg * 10) / 10,
          year2025: yearRes.count || 0,
        });
      } catch (e) {
        console.error("Error fetching live counters:", e);
      } finally {
        setCountersLoading(false);
      }
    };
    fetchCounters();
  }, []);
  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "published")
        .order("installation_date", { ascending: false });

      if (error) throw error;

      setReviews((data || []) as Review[]);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter-Anwendung
  useEffect(() => {
    let filtered = reviews;

    if (activeCategory !== "all") {
      filtered = filtered.filter((r) => r.product_category === activeCategory);
    }

    if (searchPostalCode.trim() !== "") {
      filtered = filtered.filter((r) =>
        r.postal_code.startsWith(searchPostalCode)
      );
    }

    setFilteredReviews(filtered);
    setDisplayedReviews(filtered.slice(0, page * 8));
  }, [reviews, activeCategory, searchPostalCode, page]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Statistiken berechnen
  const stats = {
    total: reviews.length,
    avgRating:
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.average_rating || 0), 0) /
          reviews.length
        : 0,
    thisYear: reviews.filter(
      (r) => new Date(r.installation_date).getFullYear() === 2025
    ).length,
    uniqueLocations: new Set(reviews.map((r) => `${r.city}-${r.postal_code}`))
      .size,
    newestDate: reviews.length > 0 ? reviews[0].installation_date : null,
  };

  // Kategorie-Statistiken
  const categoryStats = categories.reduce((acc, cat) => {
    const catReviews = reviews.filter((r) => r.product_category === cat);
    if (catReviews.length > 0) {
      acc[cat] = {
        count: catReviews.length,
        avgRating:
          catReviews.reduce((sum, r) => sum + (r.average_rating || 0), 0) /
          catReviews.length,
      };
    }
    return acc;
  }, {} as Record<string, { count: number; avgRating: number }>);

  const bestCategory = Object.entries(categoryStats).sort(
    ([, a], [, b]) => b.avgRating - a.avgRating
  )[0];

  // Standort-Gruppierung
  const locationGroups: LocationStats[] = Object.entries(
    reviews.reduce((acc, review) => {
      const key = `${review.city} (${review.postal_code})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([location, count]) => {
      const match = location.match(/^(.+?) \((.+?)\)$/);
      return {
        location,
        count,
        city: match ? match[1] : location,
        postalCode: match ? match[2] : "",
      };
    })
    .sort((a, b) => b.count - a.count);

  // Detail-Bewertungen für Gesamtscore
  const calculateAverage = (field: keyof Review) => {
    const validRatings = reviews
      .map((r) => r[field] as number)
      .filter((v) => v !== null && v > 0);

    return validRatings.length > 0
      ? validRatings.reduce((sum, v) => sum + v, 0) / validRatings.length
      : 0;
  };

  const overallRatings = {
    consultation: calculateAverage("rating_consultation"),
    fire_safety: calculateAverage("rating_fire_safety"),
    heating_performance: calculateAverage("rating_heating_performance"),
    aesthetics: calculateAverage("rating_aesthetics"),
    installation_quality: calculateAverage("rating_installation_quality"),
    service: calculateAverage("rating_service"),
  };

  const clearFilters = () => {
    setActiveCategory("all");
    setSearchPostalCode("");
    setPage(1);
  };

  const handleLocationClick = (postalCode: string) => {
    setSearchPostalCode(postalCode);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Lade Bewertungen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Kundenbewertungen | Der Kamindoktor - Authentische Erfahrungen</title>
        <meta name="title" content="Kundenbewertungen | Der Kamindoktor - Authentische Erfahrungen" />
        <meta name="description" content="Entdecken Sie authentische Kundenbewertungen für Kaminbau, Ofenbau und Schornsteinbau. Über 50+ zufriedene Kunden in ganz Deutschland. Vorher-Nachher-Bilder inklusive." />
        <meta name="keywords" content="Kaminbau Bewertungen, Ofenbau Erfahrungen, Schornsteinbau Kundenmeinungen, Der Kamindoktor, Kaminofen Installation" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bewertungen.der-kamindoktor.de/" />
        <meta property="og:title" content="Kundenbewertungen | Der Kamindoktor" />
        <meta property="og:description" content="Authentische Kundenbewertungen für Kaminbau, Ofenbau und Schornsteinbau. Über 50+ zufriedene Kunden." />
        <meta property="og:image" content="https://bewertungen.der-kamindoktor.de/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://bewertungen.der-kamindoktor.de/" />
        <meta property="twitter:title" content="Kundenbewertungen | Der Kamindoktor" />
        <meta property="twitter:description" content="Authentische Kundenbewertungen für Kaminbau, Ofenbau und Schornsteinbau." />
        <meta property="twitter:image" content="https://bewertungen.der-kamindoktor.de/twitter-image.jpg" />
        
        {/* Schema.org für Bewertungsübersicht */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Kundenbewertungen",
            "description": "Authentische Kundenbewertungen für Kaminbau, Ofenbau und Schornsteinbau",
            "url": "https://bewertungen.der-kamindoktor.de/",
            "publisher": {
              "@type": "LocalBusiness",
              "name": "Der Kamindoktor",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "DE"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Hero Section */}
      <div className="bg-gradient-to-b from-orange-900/20 to-transparent py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Der Kamindoktor - Unsere Kundenbewertungen
          </h1>
          <p className="text-lg md:text-xl text-gray-300 text-center mb-8">
            Authentische Erfahrungen unserer zufriedenen Kunden
          </p>

          {/* Statistik-Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {countersLoading ? "..." : liveCounters.total}
              </div>
              <div className="text-sm text-gray-400">Bewertungen gesamt</div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-500 mb-2 flex items-center gap-2">
                {countersLoading ? "..." : liveCounters.avg.toFixed(1)} 🔥
              </div>
              <div className="text-sm text-gray-400">
                Durchschnittsbewertung
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {countersLoading ? "..." : liveCounters.year2025}
              </div>
              <div className="text-sm text-gray-400">
                Bewertungen 2025
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {stats.uniqueLocations}
              </div>
              <div className="text-sm text-gray-400">Städte/Standorte</div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-lg font-bold text-orange-500 mb-2">
                {bestCategory ? bestCategory[0] : "-"}
              </div>
              <div className="text-sm text-gray-400">
                Beste Kategorie{" "}
                {bestCategory && `(${bestCategory[1].avgRating.toFixed(1)})`}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-lg font-bold text-orange-500 mb-2">
                {stats.newestDate
                  ? new Date(stats.newestDate).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "-"}
              </div>
              <div className="text-sm text-gray-400">Neueste Bewertung</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        {/* Filter-Bereich */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            {/* Kategorie-Filter */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                  activeCategory === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:border-orange-500/50"
                }`}
              >
                Alle Kategorien
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                    activeCategory === cat
                      ? "bg-orange-500 text-white"
                      : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:border-orange-500/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* PLZ-Suchfeld */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="PLZ suchen..."
                value={searchPostalCode}
                onChange={(e) => {
                  setSearchPostalCode(
                    e.target.value.replace(/\D/g, "").substring(0, 5)
                  );
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Aktive Filter */}
          {(activeCategory !== "all" || searchPostalCode !== "") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Aktive Filter:</span>
              {activeCategory !== "all" && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-sm">
                  {activeCategory}
                  <button
                    onClick={() => {
                      setActiveCategory("all");
                      setPage(1);
                    }}
                    className="hover:text-orange-400"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchPostalCode !== "" && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-sm">
                  PLZ: {searchPostalCode}
                  <button
                    onClick={() => {
                      setSearchPostalCode("");
                      setPage(1);
                    }}
                    className="hover:text-orange-400"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-orange-500 underline"
              >
                Alle Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Standort-Übersicht */}
        {locationGroups.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-orange-500" />
              Bewertungen aus folgenden Standorten
            </h2>
            <div className="flex flex-wrap gap-3">
              {locationGroups.map((loc) => {
                const opacity =
                  loc.count >= 6 ? "100" : loc.count >= 3 ? "50" : "30";
                const bgColor =
                  loc.count >= 3
                    ? `bg-orange-500/${opacity}`
                    : "bg-gray-700/50";
                const borderColor =
                  loc.count >= 3 ? "border-orange-500/50" : "border-gray-600";

                return (
                  <button
                    key={loc.location}
                    onClick={() => handleLocationClick(loc.postalCode)}
                    className={`px-4 py-2 ${bgColor} border ${borderColor} rounded-lg text-sm hover:border-orange-500 transition-all`}
                  >
                    {loc.location} - {loc.count} Bewertung
                    {loc.count !== 1 ? "en" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Gesamtscore-Dashboard */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center md:text-left">
              <div className="text-5xl md:text-6xl font-bold text-orange-500 mb-2">
                ⚡ {stats.avgRating.toFixed(1)}
              </div>
              <div className="text-xl text-gray-300 mb-1">von 5 Flammen</div>
              <div className="text-sm text-gray-400">
                Basierend auf {stats.total} Bewertungen
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Beratung</span>
                <div className="flex">
                  {renderFlames(overallRatings.consultation)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Gefahrenanalyse</span>
                <div className="flex">
                  {renderFlames(overallRatings.fire_safety)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Heizleistung</span>
                <div className="flex">
                  {renderFlames(overallRatings.heating_performance)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Optik</span>
                <div className="flex">
                  {renderFlames(overallRatings.aesthetics)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Professionalität</span>
                <div className="flex">
                  {renderFlames(overallRatings.installation_quality)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Service</span>
                <div className="flex">
                  {renderFlames(overallRatings.service)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bewertungs-Grid */}
        {displayedReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">Keine Bewertungen gefunden</p>
            {(activeCategory !== "all" || searchPostalCode !== "") && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-orange-500/50 transition-all"
                >
                  {/* Nachher-Bild-Vorschau */}
                  {review.after_image_url ? (
                    <div className="relative w-full h-40 md:h-48 overflow-hidden bg-gray-900">
                      <img
                        src={review.after_image_url}
                        alt={`Nachher-Zustand: ${review.product_category}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        loading="lazy"
                        onClick={() => navigate(`/bewertung/${review.slug}`)}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>📷</span>
                        <span>Vorher/Nachher</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-40 md:h-48 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(`/bewertung/${review.slug}`)}
                    >
                      <div className="text-gray-500 text-center">
                        <span className="text-4xl mb-2 block">🔥</span>
                        <span className="text-sm">Keine Bilder verfügbar</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                    <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full">
                      {review.product_category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(review.installation_date).toLocaleDateString(
                        "de-DE",
                        {
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2">
                      {review.customer_salutation} {review.customer_lastname}
                    </h3>

                    <p className="text-gray-400 text-sm mb-3 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {review.city} ({review.postal_code})
                    </p>

                    {/* Durchschnittsbewertung */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-3xl font-bold text-orange-500">
                        {review.average_rating.toFixed(1)}
                      </span>
                      <div className="flex">
                        {renderFlames(review.average_rating)}
                      </div>
                    </div>

                    {/* Bewertungstext */}
                    {review.customer_comment && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {review.customer_comment.length > 200
                          ? `${review.customer_comment.substring(0, 200)}...`
                          : review.customer_comment}
                      </p>
                    )}

                    {/* Detail-Bewertungen */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Beratung</span>
                        <div className="flex text-xs">
                          {renderFlames(review.rating_consultation)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Service</span>
                        <div className="flex text-xs">
                          {renderFlames(review.rating_service)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Professionalität</span>
                        <div className="flex text-xs">
                          {renderFlames(review.rating_installation_quality)}
                        </div>
                      </div>

                      {review.rating_fire_safety !== null && review.rating_fire_safety !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Gefahrenanalyse</span>
                          <div className="flex text-xs">
                            {renderFlames(review.rating_fire_safety)}
                          </div>
                        </div>
                      )}

                      {review.rating_heating_performance !== null && review.rating_heating_performance !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Heizleistung</span>
                          <div className="flex text-xs">
                            {renderFlames(review.rating_heating_performance)}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Optik</span>
                        <div className="flex text-xs">
                          {renderFlames(review.rating_aesthetics)}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <a
                        href={`/bewertung/${review.slug}`}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors text-white font-semibold text-sm"
                      >
                        Bewertung lesen
                      </a>

                      {(review.before_image_url || review.after_image_url) && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          📷{" "}
                          {[
                            review.before_image_url,
                            review.after_image_url,
                          ].filter(Boolean).length}{" "}
                          Bild
                          {[
                            review.before_image_url,
                            review.after_image_url,
                          ].filter(Boolean).length !== 1
                            ? "er"
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mehr laden Button */}
            {filteredReviews.length > displayedReviews.length && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <TrendingUp className="h-5 w-5" />
                  Weitere Bewertungen laden ({filteredReviews.length - displayedReviews.length} weitere)
                </button>
              </div>
            )}

            {filteredReviews.length === displayedReviews.length &&
               displayedReviews.length > 8 && (
                <div className="text-center text-gray-400 text-sm">
                  Alle {displayedReviews.length} Bewertungen geladen
                </div>
              )}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default Index;
