import { Flame } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Flame className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-primary">
              Kamindoktor Bewertungssystem
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Willkommen beim Kamindoktor
          </h2>
          <p className="text-xl text-muted-foreground">
            Professionelle Bewertungen für Kamine und Öfen
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
