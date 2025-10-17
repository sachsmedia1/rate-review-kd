import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Calendar, TrendingUp } from "lucide-react";

interface Review {
  id: string;
  slug: string;
  customer_salutation: string;
  customer_lastname: string;
  city: string;
  postal_code: string;
  product_category: string;
  installation_date: string;
  customer_comment: string;
  rating_consultation: number;
  rating_fire_safety: number;
  rating_heating_performance: number;
  rating_aesthetics: number;
  rating_installation_quality: number;
  rating_service: number;
  average_rating: number;
  is_published: boolean;
  before_image_url?: string;
  after_image_url?: string;
  created_at: string;
}

interface LocationStats {
  location: string;
  count: number;
  city: string;
  postalCode: string;
}

// Helper: Flammen rendern
const renderFlames = (rating: number) => {
  const flames = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      flames.push(<span key={i} className="text-orange-500">🔥</span>);
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      flames.push(<span key={i} className="text-orange-300">🔥</span>);
    } else {
      flames.push(<span key={i} className="text-gray-600">🔥</span>);
    }
  }
  return flames;
};

const Index = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchPostalCode, setSearchPostalCode] = useState("");
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const categories = [
    "Kaminofen",
    "Neubau Kaminanlage",
    "Austausch Kamineinsatz",
    "Kaminkassette",
    "Austausch Kachelofeneinsatz",
  ];

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_published", true)
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
                {stats.total}
              </div>
              <div className="text-sm text-gray-400">Bewertungen gesamt</div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-500 mb-2 flex items-center gap-2">
                {stats.avgRating.toFixed(1)} 🔥
              </div>
              <div className="text-sm text-gray-400">
                Durchschnittsbewertung
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {stats.thisYear}
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
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderFlames(overallRatings.consultation)}
                  </div>
                  <span className="text-sm font-semibold text-orange-500 w-8">
                    {overallRatings.consultation.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Gefahrenanalyse</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderFlames(overallRatings.fire_safety)}
                  </div>
                  <span className="text-sm font-semibold text-orange-500 w-8">
                    {overallRatings.fire_safety.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Heizleistung</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderFlames(overallRatings.heating_performance)}
                  </div>
                  <span className="text-sm font-semibold text-orange-500 w-8">
                    {overallRatings.heating_performance.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Optik</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderFlames(overallRatings.aesthetics)}
                  </div>
                  <span className="text-sm font-semibold text-orange-500 w-8">
                    {overallRatings.aesthetics.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Professionalität</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderFlames(overallRatings.installation_quality)}
                  </div>
                  <span className="text-sm font-semibold text-orange-500 w-8">
                    {overallRatings.installation_quality.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Service</span>
                <div className="flex items-center gap-2">
                  <div className="flex">{renderFlames(overallRatings.service)}</div>
                  <span className="text-sm font-semibold text-orange-500 w-8">
                    {overallRatings.service.toFixed(1)}
                  </span>
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
                      <div className="flex items-center gap-2">
                        <span>💬</span>
                        <span className="text-gray-400">Beratung:</span>
                        <span className="font-semibold text-orange-500">
                          {review.rating_consultation.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>🧹</span>
                        <span className="text-gray-400">Service:</span>
                        <span className="font-semibold text-orange-500">
                          {review.rating_service.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>🔧</span>
                        <span className="text-gray-400">Qualität:</span>
                        <span className="font-semibold text-orange-500">
                          {review.rating_installation_quality.toFixed(1)}
                        </span>
                      </div>

                      {review.rating_fire_safety !== null && review.rating_fire_safety !== undefined && (
                        <div className="flex items-center gap-2">
                          <span>⚠️</span>
                          <span className="text-gray-400">Sicherheit:</span>
                          <span className="font-semibold text-orange-500">
                            {review.rating_fire_safety.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {review.rating_heating_performance !== null && review.rating_heating_performance !== undefined && (
                        <div className="flex items-center gap-2">
                          <span>🔥</span>
                          <span className="text-gray-400">Heizleistung:</span>
                          <span className="font-semibold text-orange-500">
                            {review.rating_heating_performance.toFixed(1)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span className="text-gray-400">Optik:</span>
                        <span className="font-semibold text-orange-500">
                          {review.rating_aesthetics.toFixed(1)}
                        </span>
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
  );
};

export default Index;
