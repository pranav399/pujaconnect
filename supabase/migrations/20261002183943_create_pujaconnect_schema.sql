/*
# PujaConnect - Core Schema

## Overview
Creates the full database schema for the PujaConnect platform: profiles with role-based access,
ritual catalog, pandit profiles with per-ritual pricing, availability schedules, bookings, and reviews.

## New Tables
1. **profiles** — Extends auth.users with role (user/pandit/admin), full name, phone, avatar.
2. **rituals** — Catalog of pujas/rituals with description, duration, materials, price range, location type.
3. **pandit_profiles** — Extended info for pandits: bio, experience, city, languages, verification status.
4. **pandit_rituals** — Junction table: which pandit offers which ritual, with custom pricing.
5. **pandit_availability** — Per-date availability for each pandit.
6. **bookings** — Booking records linking user, pandit, ritual, date/time, location, status.
7. **reviews** — User reviews for pandits after completed bookings.

## Security
- RLS enabled on all tables.
- Profiles: users read/update own; pandit_profiles publicly readable; admin reads all.
- Rituals: public read (anon + authenticated), admin-only write.
- Pandit profiles: public read, owner update, admin update (for verification).
- Pandit rituals/availability: public read, owner pandit write.
- Bookings: user sees own bookings; pandit sees bookings assigned to them; admin sees all.
- Reviews: public read; booking owner can insert one review per booking.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'pandit', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_public" ON profiles;
CREATE POLICY "profiles_select_own_or_public"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR role = 'pandit' OR role = 'admin');

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- RITUALS (public catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 90,
  required_materials text NOT NULL DEFAULT 'All materials provided by the pandit.',
  price_min integer NOT NULL DEFAULT 1100,
  price_max integer NOT NULL DEFAULT 5100,
  location_type text NOT NULL DEFAULT 'both' CHECK (location_type IN ('home', 'temple', 'both')),
  category text NOT NULL DEFAULT 'General',
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rituals_public_read" ON rituals;
CREATE POLICY "rituals_public_read"
ON rituals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "rituals_admin_insert" ON rituals;
CREATE POLICY "rituals_admin_insert"
ON rituals FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "rituals_admin_update" ON rituals;
CREATE POLICY "rituals_admin_update"
ON rituals FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "rituals_admin_delete" ON rituals;
CREATE POLICY "rituals_admin_delete"
ON rituals FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ============================================================
-- PANDIT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS pandit_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  experience_years integer NOT NULL DEFAULT 0,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  languages text[] NOT NULL DEFAULT '{}',
  photo_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  specializations text NOT NULL DEFAULT '',
  total_pujas integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pandit_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pandit_profiles_public_read" ON pandit_profiles;
CREATE POLICY "pandit_profiles_public_read"
ON pandit_profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "pandit_profiles_owner_insert" ON pandit_profiles;
CREATE POLICY "pandit_profiles_owner_insert"
ON pandit_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pandit_profiles_owner_update" ON pandit_profiles;
CREATE POLICY "pandit_profiles_owner_update"
ON pandit_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pandit_profiles_admin_update" ON pandit_profiles;
CREATE POLICY "pandit_profiles_admin_update"
ON pandit_profiles FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ============================================================
-- PANDIT_RITUALS (many-to-many with custom pricing)
-- ============================================================
CREATE TABLE IF NOT EXISTS pandit_rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id uuid NOT NULL REFERENCES pandit_profiles(id) ON DELETE CASCADE,
  ritual_id uuid NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  price integer NOT NULL DEFAULT 2100,
  created_at timestamptz DEFAULT now(),
  UNIQUE (pandit_id, ritual_id)
);

ALTER TABLE pandit_rituals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pandit_rituals_public_read" ON pandit_rituals;
CREATE POLICY "pandit_rituals_public_read"
ON pandit_rituals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "pandit_rituals_owner_insert" ON pandit_rituals;
CREATE POLICY "pandit_rituals_owner_insert"
ON pandit_rituals FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_rituals.pandit_id AND pp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pandit_rituals_owner_update" ON pandit_rituals;
CREATE POLICY "pandit_rituals_owner_update"
ON pandit_rituals FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_rituals.pandit_id AND pp.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_rituals.pandit_id AND pp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pandit_rituals_owner_delete" ON pandit_rituals;
CREATE POLICY "pandit_rituals_owner_delete"
ON pandit_rituals FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_rituals.pandit_id AND pp.user_id = auth.uid()
  )
);

-- ============================================================
-- PANDIT_AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS pandit_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id uuid NOT NULL REFERENCES pandit_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  UNIQUE (pandit_id, date)
);

ALTER TABLE pandit_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pandit_availability_public_read" ON pandit_availability;
CREATE POLICY "pandit_availability_public_read"
ON pandit_availability FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "pandit_availability_owner_insert" ON pandit_availability;
CREATE POLICY "pandit_availability_owner_insert"
ON pandit_availability FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_availability.pandit_id AND pp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pandit_availability_owner_update" ON pandit_availability;
CREATE POLICY "pandit_availability_owner_update"
ON pandit_availability FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_availability.pandit_id AND pp.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_availability.pandit_id AND pp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pandit_availability_owner_delete" ON pandit_availability;
CREATE POLICY "pandit_availability_owner_delete"
ON pandit_availability FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = pandit_availability.pandit_id AND pp.user_id = auth.uid()
  )
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pandit_id uuid NOT NULL REFERENCES pandit_profiles(id) ON DELETE CASCADE,
  ritual_id uuid NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  booking_time time NOT NULL DEFAULT '09:00',
  location_type text NOT NULL DEFAULT 'home' CHECK (location_type IN ('home', 'temple')),
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  price integer NOT NULL DEFAULT 2100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_parties" ON bookings;
CREATE POLICY "bookings_select_parties"
ON bookings FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = bookings.pandit_id AND pp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "bookings_user_insert" ON bookings;
CREATE POLICY "bookings_user_insert"
ON bookings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_parties_update" ON bookings;
CREATE POLICY "bookings_parties_update"
ON bookings FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = bookings.pandit_id AND pp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
) WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM pandit_profiles pp
    WHERE pp.id = bookings.pandit_id AND pp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pandit_id uuid NOT NULL REFERENCES pandit_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read"
ON reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_booking_owner_insert" ON reviews;
CREATE POLICY "reviews_booking_owner_insert"
ON reviews FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = reviews.booking_id AND b.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "reviews_owner_delete" ON reviews;
CREATE POLICY "reviews_owner_delete"
ON reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pandit_profiles_city ON pandit_profiles(city);
CREATE INDEX IF NOT EXISTS idx_pandit_profiles_verification ON pandit_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_pandit_rituals_pandit ON pandit_rituals(pandit_id);
CREATE INDEX IF NOT EXISTS idx_pandit_rituals_ritual ON pandit_rituals(ritual_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pandit ON bookings(pandit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_pandit_availability_pandit_date ON pandit_availability(pandit_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
