import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { FieldStaff } from "@/types/field-staff";
import { FieldStaffDialog } from "./FieldStaffDialog";

export const FieldStaffManagement = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<FieldStaff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<FieldStaff | null>(null);

  // Fetch field staff
  const { data: fieldStaff = [], isLoading } = useQuery({
    queryKey: ["field-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_staff")
        .select("*")
        .order("display_order", { ascending: true })
        .order("area_number", { ascending: true });

      if (error) throw error;
      return data as FieldStaff[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FieldStaff>) => {
      const { error } = await supabase.from("field_staff").insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-staff"] });
      toast.success("Mitarbeiter erfolgreich erstellt");
    },
    onError: (error) => {
      console.error("Error creating field staff:", error);
      toast.error("Fehler beim Erstellen des Mitarbeiters");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FieldStaff> }) => {
      const { error } = await supabase.from("field_staff").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-staff"] });
      toast.success("Mitarbeiter erfolgreich aktualisiert");
    },
    onError: (error) => {
      console.error("Error updating field staff:", error);
      toast.error("Fehler beim Aktualisieren des Mitarbeiters");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("field_staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-staff"] });
      toast.success("Mitarbeiter erfolgreich gelöscht");
    },
    onError: (error) => {
      console.error("Error deleting field staff:", error);
      toast.error("Fehler beim Löschen des Mitarbeiters");
    },
  });

  const handleCreate = () => {
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (staff: FieldStaff) => {
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleDelete = (staff: FieldStaff) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteMutation.mutate(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleSave = async (data: Partial<FieldStaff>) => {
    if (selectedStaff) {
      await updateMutation.mutateAsync({ id: selectedStaff.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Field Staff Management</h2>
          <p className="text-sm text-gray-600">Außendienstmitarbeiter & PLZ-Zuständigkeiten</p>
        </div>
        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Mitarbeiter
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-600">Lädt...</div>
      ) : fieldStaff.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          Noch keine Mitarbeiter angelegt. Erstellen Sie den ersten!
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Bereich</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Kontakt</TableHead>
                  <TableHead className="font-semibold">PLZ-Bereiche</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldStaff.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{staff.area_name}</span>
                        {staff.area_number && (
                          <Badge variant="outline" className="w-fit">
                            Bereich {staff.area_number}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {staff.image_url ? (
                          <img
                            src={staff.image_url}
                            alt={`${staff.first_name} ${staff.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {staff.first_name} {staff.last_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{staff.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{staff.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {staff.assigned_postal_codes.slice(0, 5).map((code, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                        {staff.assigned_postal_codes.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{staff.assigned_postal_codes.length - 5}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.is_active ? "default" : "secondary"}>
                        {staff.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(staff)}
                          className="hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(staff)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <FieldStaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie {staffToDelete?.first_name} {staffToDelete?.last_name} wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
