import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkUserRole } from "@/lib/auth";
import { ReviewForm } from "@/components/admin/ReviewForm";

const EditReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, [id]);

  const loadReview = async () => {
    if (!id) {
      toast.error("Ungültige Bewertungs-ID");
      navigate("/admin/reviews");
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sie müssen angemeldet sein");
        navigate("/admin/login");
        return;
      }

      // Load review
      const { data: review, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !review) {
        toast.error("Bewertung nicht gefunden");
        navigate("/admin/reviews");
        return;
      }

      // Check permissions
      const userRole = await checkUserRole(user.id);
      if (userRole !== "admin" && review.created_by !== user.id) {
        toast.error("Keine Berechtigung zum Bearbeiten dieser Bewertung");
        navigate("/admin/reviews");
        return;
      }

      setExistingReview(review);
    } catch (error) {
      console.error("Error loading review:", error);
      toast.error("Fehler beim Laden der Bewertung");
      navigate("/admin/reviews");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!existingReview) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header mit Zurück-Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/reviews')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Zurück zur Liste
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bewertung bearbeiten</h1>
            <p className="text-gray-400">
              {existingReview.customer_salutation} {existingReview.customer_lastname},{" "}
              {existingReview.city}
            </p>
          </div>
        </div>
        
        {/* Trennlinie */}
        <div className="border-t border-gray-800 mb-6"></div>

        <ReviewForm mode="edit" existingData={existingReview} reviewId={id} />
      </div>
    </div>
  );
};

export default EditReview;
