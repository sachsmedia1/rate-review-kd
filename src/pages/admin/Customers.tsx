import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Customers = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [plzFrom, setPlzFrom] = useState("");
  const [plzTo, setPlzTo] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("installation_date", { ascending: false });
    
    setReviews((data as Review[]) || []);
  };

  const uniqueTeams = [...new Set(reviews
    .map(r => r.installed_by)
    .filter(Boolean)
  )];

  const filteredReviews = reviews.filter(review => {
    if (categoryFilter !== "all" && review.product_category !== categoryFilter) {
      return false;
    }
    
    if (plzFrom && review.postal_code < plzFrom) return false;
    if (plzTo && review.postal_code > plzTo) return false;
    
    if (teamFilter !== "all" && review.installed_by !== teamFilter) {
      return false;
    }
    
    if (timeFilter !== "all") {
      const installDate = new Date(review.installation_date);
      const now = new Date();
      
      switch (timeFilter) {
        case "last30":
          const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (installDate < days30) return false;
          break;
        case "last90":
          const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          if (installDate < days90) return false;
          break;
        case "thisYear":
          if (installDate.getFullYear() !== now.getFullYear()) return false;
          break;
        case "lastYear":
          if (installDate.getFullYear() !== now.getFullYear() - 1) return false;
          break;
      }
    }
    
    return true;
  });

  const stats = {
    kaminofen: filteredReviews.filter(r => r.product_category === "Kaminofen").length,
    neubau: filteredReviews.filter(r => r.product_category === "Neubau Kaminanlage").length,
    austauschKamineinsatz: filteredReviews.filter(r => r.product_category === "Austausch Kamineinsatz").length,
    kaminkassette: filteredReviews.filter(r => r.product_category === "Kaminkassette").length,
  };

  const groupByPlzRange = (reviews: Review[]) => {
    const ranges: Record<string, number> = {
      "0xxxx": 0, "1xxxx": 0, "2xxxx": 0, "3xxxx": 0, "4xxxx": 0,
      "5xxxx": 0, "6xxxx": 0, "7xxxx": 0, "8xxxx": 0, "9xxxx": 0
    };
    
    reviews.forEach(r => {
      const firstDigit = r.postal_code[0];
      const key = `${firstDigit}xxxx`;
      if (ranges[key] !== undefined) {
        ranges[key]++;
      }
    });
    
    return ranges;
  };

  const plzDistribution = groupByPlzRange(filteredReviews);
  
  const chartData = Object.keys(plzDistribution).map(key => ({
    name: key,
    projekte: plzDistribution[key]
  }));

  const teamStats = teamFilter !== "all" ? (() => {
    const teamReviews = filteredReviews.filter(r => r.installed_by === teamFilter);
    const avgRating = teamReviews.reduce((sum, r) => sum + (r.average_rating || 0), 0) / (teamReviews.length || 1);
    
    const categoryCount: Record<string, number> = {};
    teamReviews.forEach(r => {
      categoryCount[r.product_category] = (categoryCount[r.product_category] || 0) + 1;
    });
    const bestCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0]?.[0] || "-";
    
    const ratings = {
      consultation: teamReviews.reduce((sum, r) => sum + (r.rating_consultation || 0), 0) / (teamReviews.length || 1),
      fire_safety: teamReviews.reduce((sum, r) => sum + (r.rating_fire_safety || 0), 0) / (teamReviews.length || 1),
      heating_performance: teamReviews.reduce((sum, r) => sum + (r.rating_heating_performance || 0), 0) / (teamReviews.length || 1),
      aesthetics: teamReviews.reduce((sum, r) => sum + (r.rating_aesthetics || 0), 0) / (teamReviews.length || 1),
      installation_quality: teamReviews.reduce((sum, r) => sum + (r.rating_installation_quality || 0), 0) / (teamReviews.length || 1),
      service: teamReviews.reduce((sum, r) => sum + (r.rating_service || 0), 0) / (teamReviews.length || 1),
    };
    
    return {
      average: avgRating,
      total: teamReviews.length,
      bestCategory,
      ratings
    };
  })() : null;

  const handleExportCSV = () => {
    const headers = ["Kunde", "PLZ", "Stadt", "Kategorie", "Team", "Durchschnitt", "Datum", "Status"];
    const rows = filteredReviews.map(r => [
      `${r.customer_salutation} ${r.customer_lastname}`,
      r.postal_code,
      r.city,
      r.product_category,
      r.installed_by || "",
      r.average_rating?.toFixed(1) || "",
      new Date(r.installation_date).toLocaleDateString("de-DE"),
      r.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kundenkarte_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">📊 Kundenkarte</h1>
          <p className="text-muted-foreground">Übersicht und Analyse aller Projekte</p>
        </div>

        {/* Filter-Leiste */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">Alle Kategorien</option>
            <option value="Kaminofen">Kaminofen</option>
            <option value="Neubau Kaminanlage">Neubau Kaminanlage</option>
            <option value="Austausch Kamineinsatz">Austausch Kamineinsatz</option>
            <option value="Kaminkassette">Kaminkassette</option>
            <option value="Austausch Kachelofeneinsatz">Austausch Kachelofeneinsatz</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="PLZ von"
              value={plzFrom}
              onChange={(e) => setPlzFrom(e.target.value.replace(/\D/g, "").substring(0, 5))}
              className="w-1/2 px-4 py-2 bg-card border border-border rounded-lg text-foreground"
            />
            <input
              type="text"
              placeholder="PLZ bis"
              value={plzTo}
              onChange={(e) => setPlzTo(e.target.value.replace(/\D/g, "").substring(0, 5))}
              className="w-1/2 px-4 py-2 bg-card border border-border rounded-lg text-foreground"
            />
          </div>
          
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">Alle Teams</option>
            {uniqueTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">Gesamter Zeitraum</option>
            <option value="last30">Letzte 30 Tage</option>
            <option value="last90">Letzte 90 Tage</option>
            <option value="thisYear">Dieses Jahr</option>
            <option value="lastYear">Letztes Jahr</option>
          </select>
        </div>

        {/* Export-Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors mb-6"
        >
          📥 Als CSV exportieren
        </button>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">{stats.kaminofen}</div>
            <div className="text-sm text-muted-foreground">Kaminofen</div>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">{stats.neubau}</div>
            <div className="text-sm text-muted-foreground">Neubau Kaminanlage</div>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">{stats.austauschKamineinsatz}</div>
            <div className="text-sm text-muted-foreground">Austausch Kamineinsatz</div>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">{stats.kaminkassette}</div>
            <div className="text-sm text-muted-foreground">Kaminkassette</div>
          </div>
        </div>

        {/* Regional-Verteilung Chart */}
        <div className="bg-card rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Regional-Verteilung nach PLZ-Bereichen</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorProjekte" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4500" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="projekte" fill="url(#colorProjekte)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Kunden-Tabelle */}
        <div className="bg-card rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Kunde</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">PLZ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Stadt</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Kategorie</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Team</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Ø</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Datum</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-foreground">{review.customer_salutation} {review.customer_lastname}</td>
                    <td className="px-4 py-3 text-foreground">{review.postal_code}</td>
                    <td className="px-4 py-3 text-foreground">{review.city}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{review.product_category}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{review.installed_by || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="text-primary">🔥 {review.average_rating?.toFixed(1)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {new Date(review.installation_date).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      {review.status === "published" ? "✅" : "📝"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team-Performance */}
        {teamFilter !== "all" && teamStats && (
          <div className="bg-card rounded-lg p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Team-Performance: {teamFilter}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-primary">
                  ⚡ {teamStats.average.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Durchschnittsbewertung</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-primary">
                  {teamStats.total}
                </div>
                <div className="text-sm text-muted-foreground">Montagen gesamt</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-500">
                  🔥 {teamStats.bestCategory}
                </div>
                <div className="text-sm text-muted-foreground">Beste Kategorie</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Detailbewertungen:</h4>
              <div className="space-y-1 text-sm text-foreground">
                <div>Beratung: 🔥 {teamStats.ratings.consultation.toFixed(2)}</div>
                <div>Gefahrenanalyse: 🔥 {teamStats.ratings.fire_safety.toFixed(2)}</div>
                <div>Heizleistung: 🔥 {teamStats.ratings.heating_performance.toFixed(2)}</div>
                <div>Optik: 🔥 {teamStats.ratings.aesthetics.toFixed(2)}</div>
                <div>Professionalität: 🔥 {teamStats.ratings.installation_quality.toFixed(2)}</div>
                <div>Service: 🔥 {teamStats.ratings.service.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
