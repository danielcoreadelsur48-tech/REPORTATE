-- Allow multiple buttons with GPS per group (remove single-home-button constraint)
drop index if exists public.report_buttons_one_home_per_group;
