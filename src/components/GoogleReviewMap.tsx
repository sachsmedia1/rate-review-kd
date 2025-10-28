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

  // Filter reviews with valid coordinates and published status
  const reviewsWithLocation = reviews.filter(
    (review) =>
      review.latitude &&
      review.longitude &&
      !isNaN(Number(review.latitude)) &&
      !isNaN(Number(review.longitude))
  );

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
              <div className="text-sm max-w-[250px]">
                <div className="font-bold text-base mb-2 text-gray-900">
                  {selectedReview.product_category}
                </div>

                <div className="mb-2 flex">
                  {renderFlames(selectedReview.average_rating ?? 0)}
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {selectedReview.city} ({selectedReview.postal_code})
                  </span>
                </div>

                {selectedReview.installation_date && (
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(selectedReview.installation_date).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                )}

                {selectedReview.customer_comment && (
                  <p className="text-gray-700 text-xs mb-3 line-clamp-2">
                    {selectedReview.customer_comment}
                  </p>
                )}

                <Link
                  to={`/bewertung/${selectedReview.slug}`}
                  className="text-orange-500 hover:text-orange-600 text-xs font-medium"
                >
                  Details ansehen →
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
