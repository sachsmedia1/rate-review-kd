import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Inline icon fix - no external config file
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ReviewMapClientProps {
  reviews: any[];
}

const ReviewMapClient = ({ reviews }: ReviewMapClientProps) => {
  const validReviews = (reviews || []).filter(r => 
    r && r.latitude && r.longitude
  );

  if (validReviews.length === 0) {
    return <div className="h-[500px] bg-[#1a1a1a] flex items-center justify-center text-gray-400">
      Keine Standorte verfügbar
    </div>;
  }

  return (
    <div className="h-[500px] w-full">
      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {validReviews.slice(0, 10).map((review) => (
          <Marker
            key={review.id}
            position={[Number(review.latitude), Number(review.longitude)]}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default ReviewMapClient;
