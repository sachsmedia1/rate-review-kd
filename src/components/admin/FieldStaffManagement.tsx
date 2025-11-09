import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Außendienst</h2>
          <p className="text-gray-400">Außendienstmitarbeiter & PLZ-Zuständigkeiten</p>
        </div>
        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Mitarbeiter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : fieldStaff.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Noch keine Mitarbeiter angelegt. Erstellen Sie den ersten!
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Bereich</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Kontakt</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">PLZ-Bereiche</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {fieldStaff.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-white">{staff.area_name}</span>
                        {staff.area_number && (
                          <Badge variant="outline" className="w-fit border-gray-600 text-gray-400">
                            Bereich {staff.area_number}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {staff.image_url ? (
                          <img
                            src={staff.image_url}
                            alt={`${staff.first_name} ${staff.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {staff.first_name} {staff.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{staff.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{staff.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {staff.assigned_postal_codes.slice(0, 5).map((code, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {code}
                          </Badge>
                        ))}
                        {staff.assigned_postal_codes.length > 5 && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            +{staff.assigned_postal_codes.length - 5}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {staff.is_active ? (
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-600 text-gray-400">
                          Inaktiv
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                          onClick={() => handleEdit(staff)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                          onClick={() => handleDelete(staff)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
