import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, User, ExternalLink } from "lucide-react";
import { Location } from "@/types/location";
import { FieldStaff } from "@/types/field-staff";
import { findNearestLocation } from "@/utils/geo-distance";

interface ContactSectionProps {
  reviewLatitude: number | null;
  reviewLongitude: number | null;
  reviewPostalCode: string | null;
}

export const ContactSection = ({
  reviewLatitude,
  reviewLongitude,
  reviewPostalCode,
}: ContactSectionProps) => {
  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return data as Location[];
    },
  });

  // Fetch field staff by postal code
  const { data: fieldStaff } = useQuery({
    queryKey: ["field-staff", reviewPostalCode],
    queryFn: async () => {
      if (!reviewPostalCode) return null;
      
      const { data, error } = await supabase
        .rpc("find_field_staff_by_postal_code", {
          search_plz: reviewPostalCode,
        });
      
      if (error) throw error;
      return data as FieldStaff[];
    },
    enabled: !!reviewPostalCode,
  });

  // Determine nearest location
  const nearestLocation = 
    reviewLatitude && reviewLongitude && locations
      ? findNearestLocation(reviewLatitude, reviewLongitude, locations)
      : locations?.find((loc) => loc.is_default) || locations?.[0];

  // Determine assigned staff
  const assignedStaff = fieldStaff && fieldStaff.length > 0 ? fieldStaff[0] : null;

  // If no location and no staff, don't render
  if (!nearestLocation && !assignedStaff) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">
        Ihr Ansprechpartner in der Region
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spalte 1: Standort */}
        {nearestLocation && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="h-1 bg-orange-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <MapPin className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {nearestLocation.name}
                  </h3>
                  {nearestLocation.company_name && (
                    <p className="text-gray-400 text-sm">{nearestLocation.company_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="text-gray-300">
                  <p>{nearestLocation.street_address}</p>
                  <p>{nearestLocation.postal_code} {nearestLocation.city}</p>
                </div>

                {nearestLocation.phone && (
                  <a
                    href={`tel:${nearestLocation.phone}`}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <Phone size={16} />
                    <span>{nearestLocation.phone}</span>
                  </a>
                )}

                {nearestLocation.email && (
                  <a
                    href={`mailto:${nearestLocation.email}`}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <Mail size={16} />
                    <span>{nearestLocation.email}</span>
                  </a>
                )}
              </div>

              {nearestLocation.has_showroom && nearestLocation.showroom_info_url && (
                <a
                  href={nearestLocation.showroom_info_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Mehr zur Ausstellung
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Spalte 2: Außendienstmitarbeiter */}
        {assignedStaff && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {assignedStaff.image_url ? (
                  <img
                    src={assignedStaff.image_url}
                    alt={`${assignedStaff.first_name} ${assignedStaff.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <User className="text-blue-500" size={24} />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {assignedStaff.first_name} {assignedStaff.last_name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {assignedStaff.area_name}
                    {assignedStaff.area_number && (
                      <span className="ml-2 text-blue-400">#{assignedStaff.area_number}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <a
                  href={`tel:${assignedStaff.phone}`}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Phone size={16} />
                  <span>{assignedStaff.phone}</span>
                </a>

                <a
                  href={`mailto:${assignedStaff.email}`}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Mail size={16} />
                  <span>{assignedStaff.email}</span>
                </a>

                {assignedStaff.assigned_postal_codes && assignedStaff.assigned_postal_codes.length > 0 && (
                  <div className="text-gray-400 text-sm">
                    <span className="font-medium">Zuständig für PLZ: </span>
                    {assignedStaff.assigned_postal_codes.slice(0, 5).join(", ")}
                    {assignedStaff.assigned_postal_codes.length > 5 && (
                      <span className="text-gray-500"> +{assignedStaff.assigned_postal_codes.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              {assignedStaff.contact_form_url && (
                <a
                  href={assignedStaff.contact_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Anfrage senden
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
