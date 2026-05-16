export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  SOS_COUNTDOWN_SECONDS: 5,
  INVITATION_EXPIRY_HOURS: 72,
  INVITATION_CODE_LENGTH: 6,

  LOCATION_ACCURACY: 'high' as const,
  SOS_LOCATION_INTERVAL_MS: 5000,

  MAX_GROUP_NAME_LENGTH: 60,
  MAX_GROUP_DESC_LENGTH: 200,

  MAX_REPORT_BUTTONS: 5,
  MAX_BUTTON_NAME_LENGTH: 40,
  BUTTON_WINDOW_TICKER_MS: 60_000,

  REPORT_BUTTON_ICONS: [
    'home',
    'car-outline',
    'walk-outline',
    'briefcase-outline',
    'storefront-outline',
    'school-outline',
    'medkit-outline',
    'restaurant-outline',
    'fitness-outline',
    'cafe-outline',
    'bus-outline',
    'bicycle-outline',
    'boat-outline',
    'hand-left-outline',
    'shield-checkmark-outline',
    'people-outline',
    'flag-outline',
    'star-outline',
    'radio-outline',
    'checkmark-circle-outline',
  ] as const,
};
