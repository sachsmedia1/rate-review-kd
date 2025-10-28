import { lazy, Suspense } from "react";
import { Review } from "@/types";
import { MapPin } from "lucide-react";

interface ReviewMapProps {
  reviews: Review[];
}

// Lazy load the actual map component to avoid SSR issues
const MapComponent = lazy(() => import("./ReviewMapClient"));

export const ReviewMap = ({ reviews }: ReviewMapProps) => {
  return (
    <Suspense 
      fallback={
        <div className="h-[500px] flex items-center justify-center bg-[#1a1a1a] text-gray-400">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p>Karte wird geladen...</p>
          </div>
        </div>
      }
    >
      <MapComponent reviews={reviews} />
    </Suspense>
  );
};
