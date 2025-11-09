export interface FieldStaff {
  id: string;
  area_name: string;
  area_number: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  image_url: string | null;
  assigned_postal_codes: string[];
  contact_form_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FieldStaffFormData {
  area_name: string;
  area_number: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  image_url: string;
  assigned_postal_codes: string[];
  contact_form_url: string;
  is_active: boolean;
  display_order: number;
}
