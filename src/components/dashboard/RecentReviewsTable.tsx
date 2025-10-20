import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Pencil, Trash2, CheckCircle2, FileText, Loader2, Flame, ArrowRight } from "lucide-react";
import { Review } from "@/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
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

interface RecentReviewsTableProps {
  reviews: Review[];
  isLoading: boolean;
  userRole: string | null;
  onReviewDeleted?: () => void;
}

const RecentReviewsTable = ({ reviews, isLoading, userRole, onReviewDeleted }: RecentReviewsTableProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  
  const getStatusIcon = (status: string) => {
    if (status === "published") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-yellow-500" />;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: de });
  };

  const getCategoryShort = (category: string) => {
    const map: Record<string, string> = {
      "Kaminofen": "Ofen",
      "Neubau Kaminanlage": "Neubau",
      "Austausch Kamineinsatz": "Einsatz",
      "Kaminkassette": "Kassette",
      "Austausch Kachelofeneinsatz": "Kachel",
    };
    return map[category] || category;
  };

  const confirmDelete = (id: string) => {
    setReviewToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewToDelete);

    if (!error) {
      toast.success("Bewertung erfolgreich gelöscht");
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      
      if (onReviewDeleted) {
        onReviewDeleted();
      }
    } else {
      toast.error("Löschen fehlgeschlagen");
      console.error("Delete error:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Letzte Bewertungen</CardTitle>
          <CardDescription>Die 5 neuesten Bewertungen</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Letzte Bewertungen</CardTitle>
          <CardDescription>Die 5 neuesten Bewertungen</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Noch keine Bewertungen vorhanden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Letzte Bewertungen</CardTitle>
            <CardDescription>Die 5 neuesten Bewertungen</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/reviews">
              Alle Bewertungen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Status</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Stadt</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead className="text-center">Bewertung</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {getStatusIcon(review.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {review.customer_salutation} {review.customer_lastname}
                  </TableCell>
                  <TableCell>{review.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryShort(review.product_category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="h-4 w-4 text-primary" />
                      <span className="font-semibold">
                        {review.average_rating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(review.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Bearbeiten"
                        onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Vorschau"
                        onClick={() => window.open(`/bewertung/${review.slug}`, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {userRole === "admin" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Löschen"
                          onClick={() => confirmDelete(review.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bewertung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Bewertung wird
              dauerhaft aus der Datenbank gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default RecentReviewsTable;
