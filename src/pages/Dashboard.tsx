import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getUserProfile, checkUserRole, signOut } from "@/lib/auth";
import { Flame, LogOut, Users } from "lucide-react";
import { AppRole } from "@/types";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentReviewsTable from "@/components/dashboard/RecentReviewsTable";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRecentReviews } from "@/hooks/useRecentReviews";

const Dashboard = () => {
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [userLastName, setUserLastName] = useState<string>("");
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useRecentReviews(5);

  useEffect(() => {
    const loadUserData = async () => {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        const role = await checkUserRole(user.id);
        
        if (profile) {
          setUserFirstName(profile.firstname || "");
          setUserLastName(profile.lastname || "");
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
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">Kamindoktor Admin</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {userFirstName && userLastName && `${userFirstName} ${userLastName}`}
                  </p>
                  {userRole && (
                    <Badge variant={userRole === "admin" ? "default" : "secondary"} className="text-xs">
                      {userRole === "admin" ? "Administrator" : "Nutzer"}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Section - Mobile */}
        <div className="sm:hidden space-y-2">
          <h2 className="text-2xl font-bold">
            Willkommen, {userFirstName || "Admin"}
          </h2>
          {userRole && (
            <Badge variant={userRole === "admin" ? "default" : "secondary"}>
              {userRole === "admin" ? "Administrator" : "Nutzer"}
            </Badge>
          )}
        </div>

        {/* Welcome Section - Desktop */}
        <div className="hidden sm:block">
          <h2 className="text-3xl font-bold">
            Willkommen, {userFirstName} {userLastName}
          </h2>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Bewertungen gesamt"
            value={stats.totalReviews}
            icon="📊"
            isLoading={statsLoading}
          />
          <StatCard
            title="Entwürfe"
            value={stats.draftReviews}
            icon="📝"
            isLoading={statsLoading}
          />
          <StatCard
            title="Durchschnitt (Flammen)"
            value={stats.averageRating.toFixed(1)}
            icon="⚡"
            isLoading={statsLoading}
          />
          <StatCard
            title="Heute hinzugefügt"
            value={stats.todayReviews}
            icon="📅"
            isLoading={statsLoading}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Schnellaktionen</h3>
          <QuickActions userRole={userRole} />
        </div>

        {/* Recent Reviews Table */}
        <RecentReviewsTable 
          reviews={reviews} 
          isLoading={reviewsLoading}
          userRole={userRole}
          onReviewDeleted={refetchReviews}
        />
      </main>
    </div>
  );
};

export default Dashboard;
