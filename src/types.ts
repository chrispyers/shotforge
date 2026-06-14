export type SpotlightPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ResolutionPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  group: 'Google Play' | 'iOS App Store';
}

export interface DeviceConfig {
  /** 0..1 of canvas width (the visible width of the device frame) */
  widthRatio: number;
  /** 0..1 of canvas — top-left of the device frame */
  x: number;
  y: number;
  /** Degrees, can be negative */
  tiltDeg: number;
  /** Cleaned screenshot, base64 data URL or null */
  screenshotDataUrl: string | null;
  showShadow: boolean;
  showStatusBar: boolean;
  /** Optional override for the time string in the status bar */
  statusBarTime: string;
  /** Show empty signal bars + hide wifi (off-the-grid look) */
  noSignal: boolean;
  /** Render battery as nearly-empty in red */
  lowBattery: boolean;
}

export interface TextLayer {
  text: string;
  fontSize: number;
  weight: number;
  roundness: number;
  /** 0..1 of canvas width — left padding */
  paddingX: number;
  /** 0..1 of canvas height — top offset for headline block */
  paddingTop: number;
  align: 'left' | 'center' | 'right';
  color: string;
  letterSpacing: number;
  /** Drop shadow behind the text. All optional — absent on older saved pages. */
  shadow?: boolean;
  shadowColor?: string;
  /** Direction the shadow is cast, 0–360°. 0 = right, 90 = down (clockwise). */
  shadowAngle?: number;
  /** Offset length in full-resolution px. */
  shadowDistance?: number;
  /** Blur radius ("size") in full-resolution px. */
  shadowSize?: number;
}

export interface Page {
  id: string;
  name: string;
  resolutionId: string;
  primaryColor: string;
  secondaryColor: string;
  spotlightPosition: SpotlightPosition;
  /** 0..1, how large the spotlight reaches (radius as fraction of diagonal) */
  spotlightSize: number;
  /** Apply subtle noise dither over the gradient to defeat Play Store's lossy recompression banding */
  dither: boolean;
  /** 0..0.25 overlay opacity for the dither layer. 0 = no dither. */
  ditherStrength: number;
  headline: TextLayer;
  subhead: TextLayer;
  showSubhead: boolean;
  device: DeviceConfig;
}

export interface ProjectTheme {
  primaryColor: string;
  secondaryColor: string;
  spotlightPosition: SpotlightPosition;
  spotlightSize: number;
  fontSize: number;
  fontWeight: number;
  fontRoundness: number;
  textColor: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  theme: ProjectTheme;
  pages: Page[];
}
