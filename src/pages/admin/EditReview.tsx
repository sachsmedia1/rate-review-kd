import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!existingReview) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück zur Liste</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bewertung bearbeiten</h1>
            <p className="text-muted-foreground">
              {existingReview.customer_salutation} {existingReview.customer_lastname},{" "}
              {existingReview.city}
            </p>
          </div>

          <ReviewForm mode="edit" existingData={existingReview} reviewId={id} />
        </div>
      </main>
    </div>
  );
};

export default EditReview;
