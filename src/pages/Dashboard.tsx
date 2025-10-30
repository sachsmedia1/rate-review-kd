import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getUserProfile, checkUserRole, signOut } from "@/lib/auth";
import { Flame, LogOut, Star, Check, Clock, X, FileEdit } from "lucide-react";
import { AppRole } from "@/types";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentReviewsTable from "@/components/dashboard/RecentReviewsTable";
import { useRecentReviews } from "@/hooks/useRecentReviews";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [userLastName, setUserLastName] = useState<string>("");
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useRecentReviews(5);

  // Fetch comprehensive dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      // Total Count
      const { count: totalCount } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true });

      // Fetch all reviews with rating fields (explicitly set range to load all)
      const { data: allReviews } = await supabase
        .from("reviews")
        .select(`
          average_rating, 
          status,
          rating_consultation,
          rating_aesthetics,
          rating_installation_quality,
          rating_service,
          rating_fire_safety,
          rating_heating_performance
        `)
        .range(0, 10000);

      if (!allReviews) {
        return {
          totalCount: 0,
          avgRating: "0.0",
          detailRatings: {
            consultation: "0.0",
            appearance: "0.0",
            professionalism: "0.0",
            service: "0.0",
            safetyAnalysis: "0.0",
            heatingPerformance: "0.0",
          },
          statusCounts: { published: 0, pending: 0, draft: 0 },
        };
      }

      // Overall Average Rating
      const validRatings = allReviews.filter(r => r.average_rating != null && r.average_rating > 0);
      const totalRating = validRatings.reduce((sum, r) => sum + (r.average_rating || 0), 0);
      const avgRating = validRatings.length > 0 ? (totalRating / validRatings.length).toFixed(1) : "0.0";

      // Detail Ratings - only reviews with values
      const calculateDetailAvg = (field: string) => {
        const validReviews = allReviews.filter(r => r[field] != null && r[field] > 0);
        if (validReviews.length === 0) return "0.0";
        const sum = validReviews.reduce((acc, r) => acc + (r[field] || 0), 0);
        return (sum / validReviews.length).toFixed(1);
      };

      const detailRatings = {
        consultation: calculateDetailAvg("rating_consultation"),
        appearance: calculateDetailAvg("rating_aesthetics"),
        professionalism: calculateDetailAvg("rating_installation_quality"),
        service: calculateDetailAvg("rating_service"),
        safetyAnalysis: calculateDetailAvg("rating_fire_safety"),
        heatingPerformance: calculateDetailAvg("rating_heating_performance"),
      };

      // Status Distribution (server-side exact counts to avoid 1,000 row limit)
      const [{ count: publishedCount }, { count: pendingCount }, { count: draftCount }] = await Promise.all([
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "draft"),
      ]);

      const statusCounts = {
        published: publishedCount || 0,
        pending: pendingCount || 0,
        draft: draftCount || 0,
      };

      return {
        totalCount: totalCount || 0,
        avgRating,
        detailRatings,
        statusCounts,
      };
    },
  });

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
    <>
      <Helmet>
        <title>Dashboard | Der Kamindoktor Admin</title>
        <meta name="description" content="Administrator-Dashboard für Bewertungsverwaltung" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
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

        {/* Dashboard Statistics Card */}
        {statsLoading ? (
          <Card className="bg-card border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-5" />
              <Skeleton className="h-5 w-64 mb-5" />
              <div className="border-t border-border my-5" />
              <Skeleton className="h-20 w-full mb-5" />
              <div className="border-t border-border my-5" />
              <Skeleton className="h-5 w-80" />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border/50">
            <CardContent className="p-6">
              {/* Header */}
              <h3 className="text-lg font-semibold mb-4">Dashboard Übersicht</h3>
              
              {/* Top Summary */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-base font-medium text-foreground">
                  {stats?.totalCount || 0} Reviews
                </span>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-base font-medium text-foreground">
                    {stats?.avgRating || "0.0"} Durchschnitt
                  </span>
                </div>
              </div>

              <div className="border-t border-border my-5" />

              {/* Detail Ratings Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 mb-5">
                {[
                  { label: "Beratung", value: stats?.detailRatings.consultation },
                  { label: "Optik", value: stats?.detailRatings.appearance },
                  { label: "Professionalität", value: stats?.detailRatings.professionalism },
                  { label: "Service", value: stats?.detailRatings.service },
                  { label: "Gefahrenanalyse", value: stats?.detailRatings.safetyAnalysis },
                  { label: "Heizleistung", value: stats?.detailRatings.heatingPerformance },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value || "0.0"}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border my-5" />

              {/* Status Row */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {stats?.statusCounts.published || 0} Veröffentlicht
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {stats?.statusCounts.pending || 0} Ausstehend
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {stats?.statusCounts.draft || 0} Entwurf
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
    </>
  );
};

export default Dashboard;
