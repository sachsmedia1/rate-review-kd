import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Review } from "@/types";
import { renderFlames } from "@/lib/renderFlames";
import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface GoogleReviewMapProps {
  reviews: Review[];
  selectedCategory?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  city: string | null;
  source: 'geolocation' | 'search';
  timestamp: number;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyCwuop_lzv-uC1A_X7DRQ3RkVYx69SuSgo";
const LOCATION_CACHE_KEY = 'kd_user_location';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

const saveUserLocation = (location: UserLocation) => {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  } catch (e) {
    console.error('Failed to save location', e);
  }
};

const loadUserLocation = (): UserLocation | null => {
  try {
    const stored = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!stored) return null;
    
    const location: UserLocation = JSON.parse(stored);
    const isExpired = Date.now() - location.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    
    return location;
  } catch (e) {
    console.error('Failed to load location', e);
    return null;
  }
};

const MapContent = ({ 
  filteredReviews, 
  userLocation, 
  selectedReview, 
  setSelectedReview 
}: { 
  filteredReviews: Review[]; 
  userLocation: UserLocation | null;
  selectedReview: Review | null;
  setSelectedReview: (review: Review | null) => void;
}) => {
  const map = useMap();
  const markerLib = useMapsLibrary('marker');
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map || !markerLib) return;

    // Custom Cluster Renderer (Orange Theme)
    const renderer = {
      render: (cluster: any) => {
        const count = cluster.count;
        const position = cluster.position;
        
        const svg = `
          <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="25" r="23" fill="#FF8C00" stroke="#fff" stroke-width="3"/>
            <text x="25" y="25" text-anchor="middle" dominant-baseline="central" 
                  font-size="16" font-weight="bold" fill="#fff">${count}</text>
          </svg>
        `;
        
        const marker = new markerLib.AdvancedMarkerElement({
          position,
          content: new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement,
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });

        // Add click handler to zoom into cluster
        marker.addListener('click', () => {
          // Calculate bounds for all markers in this cluster
          const bounds = new google.maps.LatLngBounds();
          cluster.markers.forEach((m: any) => {
            const pos = m.position;
            if (pos) {
              bounds.extend(pos);
            }
          });
          
          // Fit map to bounds and zoom in
          map.fitBounds(bounds);
          setTimeout(() => {
            const currentZoom = map.getZoom() || 10;
            if (currentZoom < 15) {
              map.setZoom(Math.min(currentZoom + 3, 16));
            }
          }, 300);
        });

        return marker;
      },
    };

    const newClusterer = new MarkerClusterer({ 
      map, 
      renderer,
    });
    
    setClusterer(newClusterer);

    return () => {
      newClusterer.clearMarkers();
    };
  }, [map, markerLib]);

  useEffect(() => {
    if (!map || !clusterer || !markerLib) return;

    // Clear old markers
    markers.forEach(marker => marker.map = null);
    clusterer.clearMarkers();

    // Create new markers
    const newMarkers = filteredReviews.map((review) => {
      const markerContent = document.createElement('div');
      markerContent.innerHTML = `
        <svg width="32" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#FF8C00" stroke="#fff" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="3" fill="#fff"/>
        </svg>
      `;

      const marker = new markerLib.AdvancedMarkerElement({
        position: {
          lat: Number(review.latitude),
          lng: Number(review.longitude),
        },
        map,
        content: markerContent,
      });

      marker.addListener('click', () => {
        setSelectedReview(review);
      });

      return marker;
    });

    setMarkers(newMarkers);
    clusterer.addMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => marker.map = null);
    };
  }, [map, clusterer, markerLib, filteredReviews, setSelectedReview]);

  return (
    <>
      {/* User Location Marker (Blue) */}
      {userLocation && (
        <AdvancedMarker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
        >
          <div className="relative">
            <svg width="32" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4" stroke="#fff" strokeWidth="1.5"/>
              <circle cx="12" cy="9" r="3" fill="#fff"/>
            </svg>
          </div>
        </AdvancedMarker>
      )}

      {/* Mini-Card InfoWindow */}
      {selectedReview && (
        <InfoWindow
          position={{
            lat: Number(selectedReview.latitude),
            lng: Number(selectedReview.longitude),
          }}
          onCloseClick={() => setSelectedReview(null)}
        >
          <div className="p-3 max-w-[240px]">
            {/* Header mit Bild und Kategorie */}
            <div className="flex items-start gap-2 mb-2">
              {selectedReview.after_image_url && (
                <img
                  src={selectedReview.after_image_url}
                  alt={selectedReview.product_category}
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="hidden md:block px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                  {selectedReview.product_category}
                </span>
                <h3 className="font-bold text-xs text-gray-900 mt-1 truncate">
                  {selectedReview.customer_salutation} {selectedReview.customer_lastname}
                </h3>
              </div>
            </div>

            {/* Standort */}
            <div className="flex items-center gap-1 text-gray-600 text-xs mb-2">
              <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <span className="truncate">{selectedReview.city} ({selectedReview.postal_code})</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
              <span className="text-lg font-bold text-orange-500">
                {(selectedReview.average_rating ?? 0).toFixed(1)}
              </span>
              <div className="flex text-xs">
                {renderFlames(selectedReview.average_rating ?? 0)}
              </div>
            </div>

            {/* Kommentar - max 2 Zeilen */}
            {selectedReview.customer_comment && (
              <p className="text-gray-700 text-xs mb-2 line-clamp-2">
                {selectedReview.customer_comment}
              </p>
            )}

            {/* CTA Button */}
            <Link
              to={`/bewertung/${selectedReview.slug}`}
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-1.5 rounded text-xs font-semibold transition-colors"
            >
              Ansehen →
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const GoogleReviewMap = ({ reviews, selectedCategory }: GoogleReviewMapProps) => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 50.5, lng: 10.5 });
  const [mapZoom, setMapZoom] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const requestUserLocation = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: null,
          source: 'geolocation',
          timestamp: Date.now()
        };
        
        saveUserLocation(userLoc);
        setUserLocation(userLoc);
        setMapCenter({ lat: userLoc.lat, lng: userLoc.lng });
        setMapZoom(12);
      },
      (error) => {
        console.log('Geolocation denied or failed:', error.message);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // Load cached location on mount
  useEffect(() => {
    const cached = loadUserLocation();
    if (cached) {
      setUserLocation(cached);
      setMapCenter({ lat: cached.lat, lng: cached.lng });
      setMapZoom(12);
    }
  }, []);

  // Request geolocation on category change
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      requestUserLocation();
    }
  }, [selectedCategory]);

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

  // Filter by PLZ search
  const filteredReviews = searchQuery 
    ? reviewsWithLocation.filter(r => r.postal_code?.includes(searchQuery))
    : reviewsWithLocation;

  // Center on first search result
  useEffect(() => {
    if (searchQuery && filteredReviews.length > 0) {
      const first = filteredReviews[0];
      setMapCenter({ lat: Number(first.latitude), lng: Number(first.longitude) });
      setMapZoom(11);
    }
  }, [searchQuery, filteredReviews.length]);

  if (reviewsWithLocation.length === 0) {
    return (
      <div className={isMobile ? "h-[500px] flex items-center justify-center bg-[#1a1a1a] text-gray-400" : "h-[600px] flex items-center justify-center bg-[#1a1a1a] text-gray-400"}>
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keine Bewertungen mit Standortdaten verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "h-[500px] w-full relative" : "h-[600px] w-full relative"}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        {/* PLZ Search Bar */}
        <div className="absolute top-4 left-4 z-10">
          <input
            type="text"
            placeholder="PLZ eingeben..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#2E2E2E] text-white border border-[#404040] rounded-lg px-4 py-2 focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 focus:outline-none placeholder:text-gray-400 text-sm"
          />
        </div>

        <Map
          center={mapCenter}
          zoom={mapZoom}
          mapId="kamindoktor-reviews-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          restriction={{
            latLngBounds: {
              north: 55.5,
              south: 45.5,
              west: 5.0,
              east: 17.0
            },
            strictBounds: false
          }}
        >
          <MapContent 
            filteredReviews={filteredReviews}
            userLocation={userLocation}
            selectedReview={selectedReview}
            setSelectedReview={setSelectedReview}
          />
        </Map>
      </APIProvider>
    </div>
  );
};
