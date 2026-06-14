import type { ResolutionPreset, SpotlightPosition } from '../types';

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  // Google Play — modern phones are 9:19.5–9:20, so default there. Spec says
  // "16:9 or 9:16" but Play Store's viewport on modern devices tracks the device
  // aspect, so 9:19.5 letterboxes the LEAST on real phones.
  { id: 'gp-phone-1284x2778', label: 'Google Play Phone · 9:19.5 (1284 × 2778) — recommended', width: 1284, height: 2778, group: 'Google Play' },
  { id: 'gp-phone-1440x3120', label: 'Google Play Phone · 9:19.5 hi-res (1440 × 3120)', width: 1440, height: 3120, group: 'Google Play' },
  { id: 'gp-phone-1770x3835', label: 'Google Play Phone · 9:19.5 max (1770 × 3835)', width: 1770, height: 3835, group: 'Google Play' },
  { id: 'gp-phone-1080x2400', label: 'Google Play Phone · 9:20 (1080 × 2400)', width: 1080, height: 2400, group: 'Google Play' },
  { id: 'gp-phone-1080x1920', label: 'Google Play Phone · strict 9:16 (1080 × 1920)', width: 1080, height: 1920, group: 'Google Play' },
  { id: 'gp-phone-2160x3840', label: 'Google Play Phone · strict 9:16 max (2160 × 3840)', width: 2160, height: 3840, group: 'Google Play' },
  { id: 'gp-tablet-1080x1920-land', label: 'Google Play Tablet · 16:9 landscape (1920 × 1080)', width: 1920, height: 1080, group: 'Google Play' },
  // iOS App Store
  { id: 'ios-69-1320x2868', label: 'iPhone 6.9" (1320 × 2868)', width: 1320, height: 2868, group: 'iOS App Store' },
  { id: 'ios-67-1290x2796', label: 'iPhone 6.7" (1290 × 2796)', width: 1290, height: 2796, group: 'iOS App Store' },
  { id: 'ios-65-1284x2778', label: 'iPhone 6.5" (1284 × 2778)', width: 1284, height: 2778, group: 'iOS App Store' },
  { id: 'ios-ipad13-2064x2752', label: 'iPad 13" (2064 × 2752)', width: 2064, height: 2752, group: 'iOS App Store' },
];

export function getPreset(id: string): ResolutionPreset {
  return RESOLUTION_PRESETS.find(p => p.id === id) ?? RESOLUTION_PRESETS[0];
}

export const SPOTLIGHT_POSITIONS: { value: SpotlightPosition; label: string; cx: number; cy: number }[] = [
  { value: 'top-left', label: 'Top left', cx: 0.15, cy: 0.15 },
  { value: 'top-center', label: 'Top center', cx: 0.5, cy: 0.1 },
  { value: 'top-right', label: 'Top right', cx: 0.85, cy: 0.15 },
  { value: 'middle-left', label: 'Middle left', cx: 0.1, cy: 0.5 },
  { value: 'middle-right', label: 'Middle right', cx: 0.9, cy: 0.5 },
  { value: 'bottom-left', label: 'Bottom left', cx: 0.15, cy: 0.85 },
  { value: 'bottom-center', label: 'Bottom center', cx: 0.5, cy: 0.9 },
  { value: 'bottom-right', label: 'Bottom right', cx: 0.85, cy: 0.85 },
];

export function getSpotlightCenter(position: SpotlightPosition) {
  return SPOTLIGHT_POSITIONS.find(p => p.value === position) ?? SPOTLIGHT_POSITIONS[0];
}
