import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { Review } from "@/types";
import { renderFlames } from "@/lib/renderFlames";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

interface ReviewMapProps {
  reviews: Review[];
}

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const ReviewMap = ({ reviews }: ReviewMapProps) => {
  // Filter reviews that have valid coordinates
  const reviewsWithLocation = reviews.filter(
    (review) => 
      review.latitude !== null && 
      review.longitude !== null &&
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

  return (
    <div className="h-[500px] w-full">
      <MapContainer
        center={[51.1657, 10.4515]} // Center of Germany
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {reviewsWithLocation.map((review) => {
          // Safety check - skip if coordinates are invalid
          if (!review.latitude || !review.longitude) return null;
          
          return (
            <Marker
              key={review.id}
              position={[Number(review.latitude), Number(review.longitude)]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-base mb-2">
                    {review.product_category}
                  </div>
                  
                  <div className="mb-2">
                    {renderFlames((review.average_rating || 0))}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>{review.city} ({review.postal_code})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(review.installation_date).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  
                  {review.customer_comment && (
                    <p className="text-gray-700 text-xs mb-3 line-clamp-2">
                      {review.customer_comment}
                    </p>
                  )}
                  
                  <Link
                    to={`/review/${review.id}`}
                    className="text-orange-500 hover:text-orange-600 text-xs font-medium"
                  >
                    Details ansehen →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
