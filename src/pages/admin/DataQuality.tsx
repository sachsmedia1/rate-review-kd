import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface DataQualityStats {
  totalPublished: number;
  withCoordinates: number;
  withoutCoordinates: number;
}

const DataQuality = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DataQualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBulkGeocoding, setIsBulkGeocoding] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    loadDataQuality();
  }, []);

  const loadDataQuality = async () => {
    setLoading(true);
    try {
      // Total published
      const { count: totalPublished } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // With valid coordinates
      const { count: withCoordinates } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0)
        .neq("longitude", 0)
        .gte("latitude", 47.0)
        .lte("latitude", 55.5)
        .gte("longitude", 5.5)
        .lte("longitude", 15.5);

      // Without coordinates
      const withoutCoordinates = (totalPublished || 0) - (withCoordinates || 0);

      setStats({
        totalPublished: totalPublished || 0,
        withCoordinates: withCoordinates || 0,
        withoutCoordinates,
      });
    } catch (error) {
      console.error("Error loading data quality:", error);
      toast.error("Fehler beim Laden der Datenqualität");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGeocode = async () => {
    setIsBulkGeocoding(true);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailedCount(0);

    try {
      // Load all reviews WITHOUT coordinates
      const { data: reviewsWithoutCoords, error } = await supabase
        .from("reviews")
        .select("id, city, postal_code")
        .eq("status", "published")
        .or("latitude.is.null,longitude.is.null");

      if (error) throw error;

      if (!reviewsWithoutCoords || reviewsWithoutCoords.length === 0) {
        toast.info("Alle Reviews haben bereits Koordinaten!");
        setIsBulkGeocoding(false);
        return;
      }

      setTotalCount(reviewsWithoutCoords.length);
      toast.info(`Starte Geocoding für ${reviewsWithoutCoords.length} Reviews...`);

      // Process reviews one by one
      for (const review of reviewsWithoutCoords) {
        if (!review.city || !review.postal_code) {
          setProcessedCount(prev => prev + 1);
          continue;
        }

        try {
          const { data: result, error: geocodeError } = await supabase.functions.invoke(
            'geocode-address',
            {
              body: {
                city: review.city,
                postal_code: review.postal_code,
                review_id: review.id
              }
            }
          );

          if (!geocodeError && result) {
            setSuccessCount(prev => prev + 1);
          } else {
            setFailedCount(prev => prev + 1);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setFailedCount(prev => prev + 1);
        }

        setProcessedCount(prev => prev + 1);

        // Rate limiting: 5 requests per second
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success(
        `Bulk-Geocoding abgeschlossen! ✅ ${successCount} erfolgreich, ❌ ${failedCount} fehlgeschlagen`
      );

      // Refresh stats
      loadDataQuality();
    } catch (error) {
      console.error("Bulk Geocoding Error:", error);
      toast.error("Fehler beim Bulk-Geocoding");
    } finally {
      setIsBulkGeocoding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Datenqualität | Der Kamindoktor Admin</title>
      </Helmet>
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zum Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Datenqualität</h1>
                <p className="text-gray-400 mt-1">Geocoding-Status der Reviews</p>
              </div>
              <Button onClick={loadDataQuality} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-800"></div>

          {/* Statistik Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Gesamt Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats?.totalPublished}</span>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Auf Map sichtbar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold">{stats?.withCoordinates}</span>
                    <p className="text-xs text-gray-400 mt-1">
                      {((stats?.withCoordinates || 0) / (stats?.totalPublished || 1) * 100).toFixed(1)}% Abdeckung
                    </p>
                  </div>
                  <MapPin className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Ohne Koordinaten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-orange-500">
                    {stats?.withoutCoordinates}
                  </span>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Differenz Erklärung */}
          <Card className="bg-orange-950/20 border-orange-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                Differenz erklärt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-2">
                <strong>Gesamt:</strong> {stats?.totalPublished} Reviews
              </p>
              <p className="text-gray-300 mb-2">
                <strong>Auf Map:</strong> {stats?.withCoordinates} Reviews
              </p>
              <p className="text-xl font-bold text-orange-500">
                <strong>Differenz:</strong> {stats?.withoutCoordinates} Reviews fehlen
              </p>
            </CardContent>
          </Card>

          {/* Bulk Geocoding */}
          {stats && stats.withoutCoordinates > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Bulk-Geocoding
                </CardTitle>
                <CardDescription>
                  Berechne Standorte für alle Reviews ohne Koordinaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isBulkGeocoding ? (
                  <Button 
                    onClick={handleBulkGeocode} 
                    size="lg" 
                    className="w-full"
                    disabled={stats.withoutCoordinates === 0}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {stats.withoutCoordinates} Reviews jetzt geocoden
                  </Button>
                ) : (
                  <>
                    <Progress value={(processedCount / totalCount) * 100} />
                    <p className="text-center text-gray-300">
                      {processedCount} von {totalCount} verarbeitet
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-green-500 font-bold">{successCount}</p>
                        <p className="text-gray-400">Erfolgreich</p>
                      </div>
                      <div className="text-center">
                        <p className="text-red-500 font-bold">{failedCount}</p>
                        <p className="text-gray-400">Fehlgeschlagen</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default DataQuality;
