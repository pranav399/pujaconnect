/*
# Update profiles SELECT policy for admin access

## Changes
- Updated the profiles SELECT policy so admin users can read ALL profiles (including regular users).
- Previously admins could only see their own profile + pandit + admin profiles.
- Now: admin can see everything, regular users see own + pandit + admin profiles.
*/

DROP POLICY IF EXISTS "profiles_select_own_or_public" ON profiles;

CREATE POLICY "profiles_select_own_or_public"
ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR role = 'pandit'
  OR role = 'admin'
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
