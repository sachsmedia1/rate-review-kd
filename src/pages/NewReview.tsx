import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReviewForm } from "@/components/admin/ReviewForm";

const NewReview = () => {
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Zurück</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Neue Bewertung erstellen</h1>
          </div>

          <ReviewForm mode="create" />
        </div>
      </main>
    </div>
  );
};

export default NewReview;
