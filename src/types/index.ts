// Type definitions for the Kamindoktor app

export type ReviewStatus = 'draft' | 'published' | 'pending';
export type CustomerSalutation = 'Herr' | 'Frau';
export type Montagestandort = 'Bamberg' | 'Essen' | 'Rödermark' | 'Hamburg';
export type ProductCategory = 
  | 'Kaminofen' 
  | 'Neubau Kaminanlage' 
  | 'Austausch Kamineinsatz' 
  | 'Kaminkassette'
  | 'Kaminkassette FreeStanding'
  | 'Austausch Kachelofeneinsatz';

export type AppRole = 'user' | 'admin';

export interface Review {
  id: string;
  slug: string;
  status: ReviewStatus;
  is_published: boolean;
  
  // Customer data
  customer_id?: string;
  customer_salutation: CustomerSalutation;
  customer_firstname?: string;
  customer_lastname?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city: string;
  installation_date?: string;
  
  // Geo data
  latitude?: number;
  longitude?: number;
  
  // Product
  product_category: ProductCategory;
  
  // Images
  before_image_url?: string;
  after_image_url?: string;
  
  // Ratings (1-5)
  rating_consultation?: number;
  rating_fire_safety?: number;
  rating_heating_performance?: number;
  rating_aesthetics?: number;
  rating_installation_quality?: number;
  rating_service?: number;
  average_rating: number;
  
  // Optional fields
  customer_comment?: string;
  internal_notes?: string;
  installed_by?: Montagestandort;
  meta_title?: string;
  meta_description?: string;
  
  // Tracking
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
