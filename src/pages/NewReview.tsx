import { useNavigate } from "react-router-dom";
import { ReviewForm } from "@/components/admin/ReviewForm";

const NewReview = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header mit Zurück-Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Zurück zum Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Neue Bewertung erstellen
          </h1>
        </div>
        
        {/* Trennlinie */}
        <div className="border-t border-gray-800 mb-6"></div>

        <ReviewForm mode="create" />
      </div>
    </div>
  );
};

export default NewReview;
