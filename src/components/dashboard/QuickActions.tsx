import { useNavigate } from "react-router-dom";
import { AppRole } from "@/types";

interface QuickActionsProps {
  userRole?: AppRole | null;
}

const QuickActions = ({ userRole }: QuickActionsProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() => navigate('/admin/reviews/new')}
        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-semibold"
      >
        Neue Bewertung
      </button>
      
      <button
        onClick={() => navigate('/admin/reviews')}
        className="px-6 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-lg transition-colors"
      >
        Alle Bewertungen
      </button>
      
      <button
        onClick={() => navigate('/admin/customers')}
        className="px-6 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-lg transition-colors"
      >
        Zur Kundenkarte
      </button>
      
      <button
        onClick={() => navigate('/admin/images')}
        className="px-6 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-lg transition-colors"
      >
        Bilderverwaltung
      </button>
      
      {userRole === 'admin' && (
        <button
          onClick={() => navigate('/admin/users')}
          className="px-6 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-lg transition-colors"
        >
          Nutzerverwaltung
        </button>
      )}
    </div>
  );
};

export default QuickActions;
