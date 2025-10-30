// SEO Settings Types for Der Kamindoktor Review System

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CategorySEOContent {
  meta_title_template: string;
  meta_description_template: string;
  heading: string;
  description: string;
  faq: FAQItem[];
}

export interface SEOSettings {
  id: string;
  category_seo_content: Record<string, CategorySEOContent>;
  company_name: string;
  company_legal_name: string;
  company_description: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  company_logo_url?: string;
  address_street: string;
  address_city: string;
  address_postal_code: string;
  address_region: string;
  address_country: string;
  social_facebook?: string;
  social_instagram?: string;
  social_pinterest?: string;
  social_youtube?: string;
  social_xing?: string;
  service_areas: string[];
  regional_keywords: string[];
  default_meta_description?: string;
  default_og_image_url?: string;
  canonical_base_url?: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  enable_indexing: boolean;
  created_at?: string;
  updated_at?: string;
}

export const PRODUCT_CATEGORIES = [
  'Kaminofen',
  'Neubau Kaminanlage',
  'Austausch Kamineinsatz',
  'Kaminkassette',
  'Kaminkassette FreeStanding',
  'Austausch Kachelofeneinsatz'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
