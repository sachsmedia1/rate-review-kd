import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types";

export const useRecentReviews = (limit: number = 5) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = async () => {
      try {
        setIsLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setReviews((data || []) as Review[]);
        setError(null);
      } catch (err) {
        console.error("Error fetching recent reviews:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchReviews();

    // Set up real-time subscription
    const channel = supabase
      .channel("recent-reviews")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { reviews, isLoading, error, refetch: fetchReviews };
};
