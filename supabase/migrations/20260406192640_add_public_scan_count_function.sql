/*
  # Add public scan count function

  1. New Functions
    - `count_scans_for_pet(p_pet_id uuid)` - Returns the total scan count for a given pet
      - SECURITY DEFINER so anonymous and authenticated users can get the count
      - Only returns a single integer, no sensitive scan data exposed

  2. Security
    - Function is read-only (SELECT count)
    - No scan details (timestamps, locations, user IDs) are exposed
    - Granted to both anon and authenticated roles
*/

CREATE OR REPLACE FUNCTION count_scans_for_pet(p_pet_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT count(*) FROM scan_events WHERE pet_id = p_pet_id;
$$;

GRANT EXECUTE ON FUNCTION count_scans_for_pet(uuid) TO anon;
GRANT EXECUTE ON FUNCTION count_scans_for_pet(uuid) TO authenticated;
