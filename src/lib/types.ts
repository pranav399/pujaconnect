export type UserRole = 'user' | 'pandit' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ritual {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  required_materials: string;
  price_min: number;
  price_max: number;
  location_type: 'home' | 'temple' | 'both';
  category: string;
  image_url: string | null;
  created_at: string;
}

export interface PanditProfile {
  id: string;
  user_id: string;
  bio: string;
  experience_years: number;
  city: string;
  state: string;
  languages: string[];
  photo_url: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  specializations: string;
  total_pujas: number;
  created_at: string;
  updated_at: string;
}

export interface PanditRitual {
  id: string;
  pandit_id?: string;
  ritual_id: string;
  price: number;
  created_at?: string;
  ritual?: Ritual;
  pandit?: PanditProfileWithProfile;
}

export interface PanditProfileWithProfile extends PanditProfile {
  profile?: Profile;
  avg_rating?: number;
  review_count?: number;
}

export interface PanditAvailability {
  id: string;
  pandit_id: string;
  date: string;
  is_available: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

export interface Booking {
  id: string;
  user_id: string;
  pandit_id: string;
  ritual_id: string;
  booking_date: string;
  booking_time: string;
  location_type: 'home' | 'temple';
  address: string;
  city: string;
  notes: string;
  status: BookingStatus;
  price: number;
  created_at: string;
  updated_at: string;
  ritual?: Ritual;
  pandit?: PanditProfileWithProfile;
  user_profile?: Profile;
  review?: Review;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  pandit_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profile?: Profile;
}
