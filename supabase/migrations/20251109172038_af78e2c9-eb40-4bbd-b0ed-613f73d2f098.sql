-- =====================================================
-- FIX: Enable RLS on backup tables
-- =====================================================

-- Enable RLS on backup table 1
ALTER TABLE reviews_final_slug_backup_20251103 ENABLE ROW LEVEL SECURITY;

-- Enable RLS on backup table 2  
ALTER TABLE reviews_legacy_slug_backup_20251103 ENABLE ROW LEVEL SECURITY;

-- Add admin-only policies for backup table 1
CREATE POLICY "Only admins can view backup table 1"
  ON reviews_final_slug_backup_20251103 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin-only policies for backup table 2
CREATE POLICY "Only admins can view backup table 2"
  ON reviews_legacy_slug_backup_20251103 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );