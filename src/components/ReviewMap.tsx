import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { renderFlames } from "@/lib/renderFlames";

type Review = Database['public']['Tables']['reviews']['Row'];
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import "leaflet/dist/leaflet.css";
import "@/lib/leafletConfig";

interface ReviewMapProps {
  reviews: Review[];
}

export const ReviewMap = ({ reviews }: ReviewMapProps) => {
  // Nur veröffentlichte Reviews mit Koordinaten - with error handling
  const reviewsWithLocation = (reviews || []).filter(
    (review) => 
      review.latitude && 
      review.longitude && 
      review.is_published === true
  );

  // Wenn keine Reviews mit Koordinaten vorhanden sind
  if (reviewsWithLocation.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center text-gray-400">
        <p>Keine Bewertungen mit Standortdaten verfügbar</p>
      </div>
    );
  }

  // Deutschland-Center als Default
  const defaultCenter: [number, number] = [51.1657, 10.4515];

  // Berechne Center aus vorhandenen Markern
  // Berechne Center aus vorhandenen Markern - mit Sicherheitsprüfungen
  const avgLat = reviewsWithLocation.length > 0
    ? reviewsWithLocation.reduce((sum, r) => sum + (Number(r.latitude) || 0), 0) / reviewsWithLocation.length
    : 51.1657;
  
  const avgLng = reviewsWithLocation.length > 0
    ? reviewsWithLocation.reduce((sum, r) => sum + (Number(r.longitude) || 0), 0) / reviewsWithLocation.length
    : 10.4515;

  const center: [number, number] = [avgLat, avgLng];

  try {
    return (
      <MapContainer
        center={reviewsWithLocation.length > 0 ? center : defaultCenter}
        zoom={6}
        style={{ height: "500px", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup maxClusterRadius={50}>
          {reviewsWithLocation.map((review) => (
            <Marker
              key={review.id}
              position={[review.latitude!, review.longitude!]}
            >
              <Popup className="custom-popup">
                <div className="min-w-[250px]">
                  {/* Nachher-Bild */}
                  {review.after_image_url && (
                    <img
                      src={review.after_image_url}
                      alt={`${review.product_category} in ${review.city}`}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}

                  {/* Kategorie Badge */}
                  <Badge className="mb-2 bg-orange-500 hover:bg-orange-600">
                    {review.product_category}
                  </Badge>

                  {/* Kundename */}
                  <h3 className="font-bold text-base mb-1">
                    {review.customer_salutation} {review.customer_lastname}
                  </h3>

                  {/* Stadt + PLZ (KEINE Straße!) */}
                  <p className="text-sm text-gray-600 mb-2">
                    {review.postal_code} {review.city}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-orange-500">
                      {review.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm">
                      {renderFlames(review.average_rating)}
                    </span>
                  </div>

                  {/* Datum */}
                  {review.installation_date && (
                    <p className="text-xs text-gray-500 mb-3">
                      {format(new Date(review.installation_date), "MMMM yyyy", {
                        locale: de,
                      })}
                    </p>
                  )}

                  {/* Button */}
                  <Link
                    to={`/bewertung/${review.slug}`}
                    className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Bewertung ansehen
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="h-[500px] flex items-center justify-center text-gray-400">
        <p>Fehler beim Laden der Karte</p>
      </div>
    );
  }
};
