export interface Location {
  id: string;
  name: string;
  company_name: string | null;
  is_active: boolean;
  is_default: boolean;
  has_showroom: boolean;
  street_address: string;
  postal_code: string;
  city: string;
  phone: string | null;
  fax: string | null;
  email: string;
  description: string | null;
  service_areas: string | null;
  opening_hours: string | null;
  google_maps_embed_url: string | null;
  google_business_url: string | null;
  logo_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showroom_info_url?: string | null;
  created_at: string;
  updated_at: string;
}
