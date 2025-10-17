import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, MoreVertical, Edit, Eye, Trash2, Flame } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { checkUserRole } from "@/lib/auth";
import { AppRole } from "@/types";

interface Review {
  id: string;
  status: string;
  customer_salutation: string;
  customer_firstname: string;
  customer_lastname: string;
  city: string;
  product_category: string;
  average_rating: number | null;
  installation_date: string;
  slug: string;
}

const ITEMS_PER_PAGE = 30;

const Reviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, categoryFilter, searchQuery, currentPage]);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = await checkUserRole(user.id);
      setUserRole(role);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);

    // Count query for pagination
    let countQuery = supabase
      .from("reviews")
      .select("*", { count: "exact", head: true });

    // Data query
    let dataQuery = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    // Apply filters to both queries
    if (statusFilter !== "all") {
      countQuery = countQuery.eq("status", statusFilter);
      dataQuery = dataQuery.eq("status", statusFilter);
    }

    if (categoryFilter !== "all") {
      countQuery = countQuery.eq("product_category", categoryFilter);
      dataQuery = dataQuery.eq("product_category", categoryFilter);
    }

    if (searchQuery) {
      const searchFilter = `customer_firstname.ilike.%${searchQuery}%,customer_lastname.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (!error && data) {
      setReviews(data);
      setTotalCount(count || 0);
    } else if (error) {
      toast.error("Fehler beim Laden der Bewertungen");
      console.error(error);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewToDelete);

    if (!error) {
      toast.success("Bewertung gelöscht");
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      fetchReviews();
    } else {
      toast.error("Löschen fehlgeschlagen");
      console.error(error);
    }
  };

  const confirmDelete = (id: string) => {
    setReviewToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">✅ Veröffentlicht</Badge>;
      case "draft":
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">📝 Entwurf</Badge>;
      case "archived":
        return <Badge className="bg-gray-500/20 text-gray-500 hover:bg-gray-500/30">📦 Archiviert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header mit Zurück-Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Zurück zum Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Bewertungen verwalten
              </h1>
            </div>
            <button
              onClick={() => navigate("/admin/reviews/new")}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors font-semibold"
            >
              Neue Bewertung
            </button>
          </div>
        </div>
        
        {/* Trennlinie */}
        <div className="border-t border-gray-800 mb-6"></div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Status wählen" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="published">Veröffentlicht</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="archived">Archiviert</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Kategorie wählen" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="Kaminofen">Kaminofen</SelectItem>
              <SelectItem value="Neubau Kaminanlage">Neubau Kaminanlage</SelectItem>
              <SelectItem value="Austausch Kamineinsatz">Austausch Kamineinsatz</SelectItem>
              <SelectItem value="Kaminkassette">Kaminkassette</SelectItem>
              <SelectItem value="Austausch Kachelofeneinsatz">Austausch Kachelofeneinsatz</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <Input
            placeholder="Suche nach Name oder Stadt..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-4">Keine Bewertungen gefunden</p>
            <button
              onClick={() => navigate("/admin/reviews/new")}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors font-semibold"
            >
              Erste Bewertung erstellen
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Kunde</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Stadt</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Kategorie</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Durchschnitt</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Datum</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {reviews.map((review, index) => (
                      <tr
                        key={review.id}
                        className="hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {getStatusIcon(review.status)}
                        </td>
                        <td className="px-4 py-3">
                          {review.customer_salutation} {review.customer_lastname}
                        </td>
                        <td className="px-4 py-3">{review.city}</td>
                        <td className="px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger>
                              {truncateText(review.product_category, 20)}
                            </TooltipTrigger>
                            <TooltipContent>
                              {review.product_category}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-primary">
                            <Flame className="h-4 w-4 fill-current" />
                            <span className="font-medium">
                              {review.average_rating?.toFixed(1) || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {format(new Date(review.installation_date), "dd.MM.yyyy", {
                            locale: de,
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/bewertung/${review.slug}`, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {userRole === "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(review.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Zurück
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 py-2">...</span>;
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Weiter
                </Button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Bewertung löschen?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Diese Aktion kann nicht rückgängig gemacht werden. Die Bewertung wird
                dauerhaft gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white">Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Reviews;
