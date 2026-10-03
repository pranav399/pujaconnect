/*
# Add admin UPDATE policy on profiles

## Changes
- Adds an UPDATE policy so admin users can update any profile (needed for changing user roles).
- Regular users can still only update their own profile (existing policy unchanged).
*/

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;

CREATE POLICY "profiles_admin_update"
ON profiles FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
