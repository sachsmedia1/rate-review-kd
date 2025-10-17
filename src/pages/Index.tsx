import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Review, ProductCategory } from "@/types";

// WICHTIG: Leaflet Icon Fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// Helper: Flammen rendern
function renderFlames(rating: number) {
  const fullFlames = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={i < fullFlames ? "text-orange-500" : "text-gray-600"}
        >
          {i < fullFlames ? "🔥" : i === fullFlames && hasHalf ? "🔥" : "⚪"}
        </span>
      ))}
    </>
  );
}

function calculateAverage(reviews: Review[], field: keyof Review) {
  const validRatings = reviews
    .map((r) => r[field] as number)
    .filter((v) => v !== null && v > 0);

  return validRatings.length > 0
    ? validRatings.reduce((sum, v) => sum + v, 0) / validRatings.length
    : 0;
}

const Index = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [plzSearch, setPlzSearch] = useState("");
  const [displayCount, setDisplayCount] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews((data || []) as Review[]);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter anwenden
  const filteredReviews = reviews.filter((review) => {
    if (categoryFilter !== "all" && review.product_category !== categoryFilter) {
      return false;
    }

    if (plzSearch && !review.postal_code.startsWith(plzSearch)) {
      return false;
    }

    return true;
  });

  // Nur erste X anzeigen
  const displayedReviews = filteredReviews.slice(0, displayCount);

  // Mehr laden
  const loadMore = () => {
    setDisplayCount((prev) => prev + 8);
  };

  // Statistiken berechnen
  const overallStats = {
    total: reviews.length,
    average:
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.average_rating || 0), 0) /
          reviews.length
        : 0,
    ratings: {
      consultation: calculateAverage(reviews, "rating_consultation"),
      fire_safety: calculateAverage(reviews, "rating_fire_safety"),
      heating_performance: calculateAverage(reviews, "rating_heating_performance"),
      aesthetics: calculateAverage(reviews, "rating_aesthetics"),
      installation_quality: calculateAverage(reviews, "rating_installation_quality"),
      service: calculateAverage(reviews, "rating_service"),
    },
  };

  const categories: ProductCategory[] = [
    "Kaminofen",
    "Neubau Kaminanlage",
    "Austausch Kamineinsatz",
    "Kaminkassette",
    "Austausch Kachelofeneinsatz",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-orange-900/20 to-transparent py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Unsere Kundenbewertungen</h1>
          <p className="text-xl text-gray-300 mb-2">
            Über {overallStats.total}+ zufriedene Kunden vertrauen uns
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Lade Bewertungen...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">Noch keine Bewertungen vorhanden</p>
          </div>
        ) : (
          <>
            {/* OpenStreetMap */}
            <div
              className="mb-12 rounded-lg overflow-hidden"
              style={{ height: "400px" }}
            >
              <MapContainer
                center={[51.1657, 10.4515]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {reviews
                  .filter((r) => r.latitude && r.longitude)
                  .map((review) => (
                    <Marker
                      key={review.id}
                      position={[review.latitude!, review.longitude!]}
                    >
                      <Popup>
                        <div className="text-gray-900 p-2">
                          <h3 className="font-bold text-lg mb-1">
                            {review.customer_salutation}{" "}
                            {review.customer_lastname}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {review.city}
                          </p>
                          <p className="text-orange-600 font-semibold mb-1">
                            ⚡ {review.average_rating?.toFixed(1)} / 5 Flammen
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {review.product_category}
                          </p>
                          <a
                            href={`/bewertung/${review.slug}`}
                            className="text-orange-600 hover:text-orange-700 text-sm font-semibold underline"
                          >
                            Mehr erfahren →
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>

            {/* Gesamtscore-Dashboard */}
            <div className="bg-gray-800 rounded-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Linke Seite: Gesamt */}
                <div className="text-center md:text-left">
                  <div className="text-6xl font-bold text-orange-500 mb-2">
                    ⚡ {overallStats.average.toFixed(1)}
                  </div>
                  <div className="text-xl text-gray-300 mb-1">
                    von 5 Flammen
                  </div>
                  <div className="text-sm text-gray-400">
                    Basierend auf {overallStats.total} Bewertungen
                  </div>
                </div>

                {/* Rechte Seite: Detail-Bewertungen */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Beratung</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderFlames(overallStats.ratings.consultation)}
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        {overallStats.ratings.consultation.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      Gefahrenanalyse
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderFlames(overallStats.ratings.fire_safety)}
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        {overallStats.ratings.fire_safety.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Heizleistung</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderFlames(overallStats.ratings.heating_performance)}
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        {overallStats.ratings.heating_performance.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Optik</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderFlames(overallStats.ratings.aesthetics)}
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        {overallStats.ratings.aesthetics.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">
                      Professionalität
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderFlames(overallStats.ratings.installation_quality)}
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        {overallStats.ratings.installation_quality.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Service</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderFlames(overallStats.ratings.service)}
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        {overallStats.ratings.service.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter-Leiste */}
            <div className="mb-8">
              {/* Kategorie-Filter als Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    categoryFilter === "all"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Alle Kategorien
                </button>

                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      categoryFilter === category
                        ? "bg-orange-500 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* PLZ-Suche */}
              <input
                type="text"
                placeholder="Suche nach PLZ..."
                value={plzSearch}
                onChange={(e) =>
                  setPlzSearch(e.target.value.replace(/\D/g, "").substring(0, 5))
                }
                className="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Bewertungsgrid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all"
                >
                  {/* Vorher-Nachher Bilder */}
                  <div className="grid grid-cols-2 gap-1 aspect-video bg-gray-900">
                    {review.before_image_url && (
                      <img
                        src={review.before_image_url}
                        alt="Vorher"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {review.after_image_url && (
                      <img
                        src={review.after_image_url}
                        alt="Nachher"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-1">
                      {review.customer_salutation} {review.customer_lastname}
                    </h3>

                    <p className="text-gray-400 text-sm mb-2">
                      {review.postal_code} {review.city}
                    </p>

                    <p className="text-sm text-gray-500 mb-3">
                      {review.product_category}
                    </p>

                    <p className="text-xs text-gray-500 mb-3">
                      {new Date(review.installation_date).toLocaleDateString(
                        "de-DE",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>

                    {/* Bewertung */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {renderFlames(review.average_rating)}
                      </div>
                      <span className="text-lg font-bold text-orange-500">
                        {review.average_rating?.toFixed(1)}
                      </span>
                    </div>

                    {/* Mehr lesen Button */}
                    <a
                      href={`/bewertung/${review.slug}`}
                      className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors text-white font-semibold"
                    >
                      Mehr lesen →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Mehr laden Button */}
            {filteredReviews.length > displayedReviews.length && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Mehr laden ({filteredReviews.length - displayedReviews.length}{" "}
                  weitere)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
