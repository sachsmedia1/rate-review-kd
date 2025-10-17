import { Button } from "@/components/ui/button";
import { Plus, Users, Image, List } from "lucide-react";

const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Button size="lg" className="w-full" asChild>
        <a href="/admin/reviews/new">
          <Plus className="mr-2 h-5 w-5" />
          Neue Bewertung
        </a>
      </Button>
      <Button variant="outline" size="lg" className="w-full" asChild>
        <a href="/admin/reviews">
          <List className="mr-2 h-5 w-5" />
          Alle Bewertungen
        </a>
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        <Users className="mr-2 h-5 w-5" />
        Zur Kundenkarte
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        <Image className="mr-2 h-5 w-5" />
        Bilderverwaltung
      </Button>
    </div>
  );
};

export default QuickActions;
