import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Review } from "@/types";
import { renderFlames } from "@/lib/renderFlames";
import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";

interface GoogleReviewMapProps {
  reviews: Review[];
}

const GOOGLE_MAPS_API_KEY = "AIzaSyCwuop_lzv-uC1A_X7DRQ3RkVYx69SuSgo";

export const GoogleReviewMap = ({ reviews }: GoogleReviewMapProps) => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Filter reviews with valid coordinates (not null, not 0, inside Germany)
  const reviewsWithLocation = reviews.filter((review) => {
    // Check 1: Koordinaten vorhanden
    if (!review.latitude || !review.longitude) return false;
    
    const lat = Number(review.latitude);
    const lng = Number(review.longitude);
    
    // Check 2: Valide Zahlen
    if (isNaN(lat) || isNaN(lng)) return false;
    
    // Check 3: Nicht 0
    if (lat === 0 || lng === 0) return false;
    
    // Check 4: Innerhalb Deutschland (Bounding Box)
    // Deutschland: 47.0°N - 55.5°N, 5.5°E - 15.5°E
    if (lat < 47.0 || lat > 55.5 || lng < 5.5 || lng > 15.5) {
      return false;
    }
    
    return true;
  });

  if (reviewsWithLocation.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#1a1a1a] text-gray-400">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keine Bewertungen mit Standortdaten verfügbar</p>
        </div>
      </div>
    );
  }

  // Calculate center from markers
  const avgLat =
    reviewsWithLocation.reduce((sum, r) => sum + Number(r.latitude), 0) /
    reviewsWithLocation.length;
  const avgLng =
    reviewsWithLocation.reduce((sum, r) => sum + Number(r.longitude), 0) /
    reviewsWithLocation.length;

  return (
    <div className="h-[500px] w-full">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat: avgLat, lng: avgLng }}
          defaultZoom={6}
          mapId="kamindoktor-reviews-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {reviewsWithLocation.map((review) => (
            <AdvancedMarker
              key={review.id}
              position={{
                lat: Number(review.latitude),
                lng: Number(review.longitude),
              }}
              onClick={() => setSelectedReview(review)}
            />
          ))}

          {selectedReview && (
            <InfoWindow
              position={{
                lat: Number(selectedReview.latitude),
                lng: Number(selectedReview.longitude),
              }}
              onCloseClick={() => setSelectedReview(null)}
            >
              <div className="p-3 sm:p-4 min-w-[240px] sm:min-w-[280px] max-w-[90vw] sm:max-w-[320px]">
                {/* Header mit Kategorie-Badge */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="px-2 sm:px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                    {selectedReview.product_category}
                  </span>
                  {selectedReview.installation_date && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedReview.installation_date).toLocaleDateString("de-DE", {
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  )}
                </div>

                {/* Nachher-Bild - smaller on mobile */}
                {selectedReview.after_image_url && (
                  <img
                    src={selectedReview.after_image_url}
                    alt={selectedReview.product_category}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2 sm:mb-3"
                  />
                )}

                {/* Kundenname */}
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2">
                  {selectedReview.customer_salutation} {selectedReview.customer_lastname}
                </h3>

                {/* Standort */}
                <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                  <span>{selectedReview.city} ({selectedReview.postal_code})</span>
                </div>

                {/* Rating - mehr prominent */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200">
                  <span className="text-xl sm:text-2xl font-bold text-orange-500">
                    {(selectedReview.average_rating ?? 0).toFixed(1)}
                  </span>
                  <div className="flex text-xs sm:text-sm">
                    {renderFlames(selectedReview.average_rating ?? 0)}
                  </div>
                </div>

                {/* Kommentar - kürzer auf mobile */}
                {selectedReview.customer_comment && (
                  <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
                    {selectedReview.customer_comment.substring(0, selectedReview.customer_comment.length > 120 ? 120 : selectedReview.customer_comment.length)}
                    {selectedReview.customer_comment.length > 120 && "..."}
                  </p>
                )}

                {/* Call-to-Action Button - volle Breite */}
                <Link
                  to={`/bewertung/${selectedReview.slug}`}
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
                >
                  <span className="hidden sm:inline">Vollständige Bewertung ansehen →</span>
                  <span className="sm:hidden">Bewertung ansehen →</span>
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
