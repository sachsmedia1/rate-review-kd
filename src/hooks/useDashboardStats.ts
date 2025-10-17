import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalReviews: number;
  draftReviews: number;
  averageRating: number;
  todayReviews: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    draftReviews: 0,
    averageRating: 0,
    todayReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total reviews
        const { count: totalCount, error: totalError } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true });

        if (totalError) throw totalError;

        // Get draft reviews
        const { count: draftCount, error: draftError } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("status", "draft");

        if (draftError) throw draftError;

        // Get average rating
        const { data: avgData, error: avgError } = await supabase
          .from("reviews")
          .select("average_rating");

        if (avgError) throw avgError;

        const averageRating = avgData && avgData.length > 0
          ? avgData.reduce((sum, review) => sum + (review.average_rating || 0), 0) / avgData.length
          : 0;

        // Get today's reviews
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const { count: todayCount, error: todayError } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayISO);

        if (todayError) throw todayError;

        setStats({
          totalReviews: totalCount || 0,
          draftReviews: draftCount || 0,
          averageRating: Math.round(averageRating * 10) / 10,
          todayReviews: todayCount || 0,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscription for reviews
    const channel = supabase
      .channel("dashboard-reviews")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, isLoading, error };
};
