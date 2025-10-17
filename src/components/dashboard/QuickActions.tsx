import { Button } from "@/components/ui/button";
import { Plus, Users, Image } from "lucide-react";

const QuickActions = () => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" className="flex-1 min-w-[200px]">
        <Plus className="mr-2 h-5 w-5" />
        Neue Bewertung
      </Button>
      <Button variant="outline" size="lg" className="flex-1 min-w-[200px]">
        <Users className="mr-2 h-5 w-5" />
        Zur Kundenkarte
      </Button>
      <Button variant="outline" size="lg" className="flex-1 min-w-[200px]">
        <Image className="mr-2 h-5 w-5" />
        Bilderverwaltung
      </Button>
    </div>
  );
};

export default QuickActions;
