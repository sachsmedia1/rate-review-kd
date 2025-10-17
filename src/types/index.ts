// Type definitions for the Kamindoktor app

export interface Review {
  id: string;
  created_at: string;
  fireplace_type: string;
  rating: number;
  comment?: string;
  user_id: string;
}

export interface Fireplace {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  image_url?: string;
}
