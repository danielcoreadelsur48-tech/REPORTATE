-- Add active_days column to report_buttons.
-- Stores JS day-of-week numbers (0=Sun, 1=Mon, ..., 6=Sat).
-- Default is all seven days so existing buttons are unaffected.
ALTER TABLE report_buttons
  ADD COLUMN IF NOT EXISTS active_days int[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::int[];
