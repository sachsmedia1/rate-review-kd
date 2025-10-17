import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getUserProfile, checkUserRole, signOut } from "@/lib/auth";
import { Flame, LogOut, User } from "lucide-react";
import { AppRole } from "@/types";

const Dashboard = () => {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserData = async () => {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        const role = await checkUserRole(user.id);
        
        if (profile) {
          const fullName = [profile.firstname, profile.lastname]
            .filter(Boolean)
            .join(" ");
          setUserName(fullName || profile.email);
        } else {
          setUserName(user.email || "");
        }
        
        setUserRole(role);
      }
    };

    loadUserData();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Fehler beim Abmelden",
        description: error.message,
      });
    } else {
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Sie werden weitergeleitet...",
      });
      navigate("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Kamindoktor</h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Willkommen im Dashboard
              </CardTitle>
              <CardDescription>
                {userName && `Angemeldet als: ${userName}`}
                {userRole && ` (${userRole === 'admin' ? 'Administrator' : 'Benutzer'})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Das Dashboard wird in Kürze mit Funktionen zur Verwaltung von Bewertungen erweitert.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bewertungen</CardTitle>
                <CardDescription>Kunden-Bewertungen verwalten</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiken</CardTitle>
                <CardDescription>Übersicht und Analysen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
