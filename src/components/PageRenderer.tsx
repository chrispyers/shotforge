import { forwardRef, type CSSProperties } from 'react';
import type { Page, TextLayer } from '../types';
import { getPreset, getSpotlightCenter } from '../lib/presets';
import { DeviceFrame } from './DeviceFrame';

// Real PNG noise tile (generated once on first render and cached). We avoid
// an SVG-with-feTurbulence approach because html-to-image's foreignObject
// rasterizer doesn't reliably resolve nested SVG filters inside background-
// image data URLs — the dither overlay was getting silently dropped from the
// exported PNG even though it appeared in the live preview.
let cachedDitherUrl: string | null = null;
function getDitherUrl(): string {
  if (cachedDitherUrl) return cachedDitherUrl;
  if (typeof document === 'undefined') return '';
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  // High-contrast B/W noise so overlay blend mode produces visible dithering.
  // Each pixel either pulls toward black or toward white; the underlying color
  // averages out across pixels, but local variation breaks compressor banding.
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  cachedDitherUrl = canvas.toDataURL('image/png');
  return cachedDitherUrl;
}

interface Props {
  page: Page;
  /** When set, renders at exactly this pixel width (height auto from preset). For preview. */
  displayWidth?: number;
  /** When true, renders at full preset resolution. For export. */
  fullResolution?: boolean;
}

/**
 * Renders the inner content at native preset.width × preset.height in every case
 * and uses CSS transform: scale() to shrink the preview. The browser computes
 * line breaks at the same dimensions for preview and export, so wrapping matches.
 */
export const PageRenderer = forwardRef<HTMLDivElement, Props>(function PageRenderer(
  { page, displayWidth, fullResolution },
  ref
) {
  const preset = getPreset(page.resolutionId);
  const targetW = fullResolution ? preset.width : displayWidth ?? 360;
  const scale = targetW / preset.width;
  const targetH = preset.height * scale;

  const center = getSpotlightCenter(page.spotlightPosition);
  const spotlightRadiusPct = page.spotlightSize * 100;
  const background = `radial-gradient(circle at ${center.cx * 100}% ${center.cy * 100}%, ${page.secondaryColor} 0%, ${page.primaryColor} ${spotlightRadiusPct}%)`;

  const deviceWidth = preset.width * page.device.widthRatio;
  const deviceLeft = preset.width * page.device.x;
  const deviceTop = preset.height * page.device.y;

  const outerStyle: CSSProperties = {
    width: targetW,
    height: targetH,
    position: 'relative',
    overflow: 'hidden',
  };

  const innerStyle: CSSProperties = {
    width: preset.width,
    height: preset.height,
    position: 'relative',
    overflow: 'hidden',
    background,
    fontFamily: '"Google Sans Flex", "Roboto Flex", Inter, sans-serif',
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: 'top left',
  };

  return (
    <div ref={ref} style={outerStyle} data-page-id={page.id}>
      <div style={innerStyle}>
        {(() => {
          const ditherOn = page.dither ?? true;
          const strength = page.ditherStrength ?? 0.12;
          if (!ditherOn || strength <= 0) return null;
          const url = getDitherUrl();
          if (!url) return null;
          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${url}")`,
                backgroundRepeat: 'repeat',
                opacity: strength,
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }}
            />
          );
        })()}
        <TextBlock layer={page.headline} canvasWidth={preset.width} canvasHeight={preset.height} />
        {page.showSubhead && (
          <TextBlock layer={page.subhead} canvasWidth={preset.width} canvasHeight={preset.height} />
        )}
        <div
          style={{
            position: 'absolute',
            left: deviceLeft,
            top: deviceTop,
            transform: page.device.tiltDeg ? `rotate(${page.device.tiltDeg}deg)` : undefined,
            transformOrigin: 'center center',
          }}
        >
          <DeviceFrame
            width={deviceWidth}
            screenshotDataUrl={page.device.screenshotDataUrl}
            showShadow={page.device.showShadow}
            showStatusBar={page.device.showStatusBar}
            statusBarTime={page.device.statusBarTime}
            noSignal={page.device.noSignal ?? false}
            lowBattery={page.device.lowBattery ?? false}
          />
        </div>
      </div>
    </div>
  );
});

function TextBlock({
  layer,
  canvasWidth,
  canvasHeight,
}: {
  layer: TextLayer;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const padX = canvasWidth * layer.paddingX;
  const padTop = canvasHeight * layer.paddingTop;
  const widthAvail = canvasWidth - padX * 2;

  let textShadow: string | undefined;
  if (layer.shadow) {
    const angle = layer.shadowAngle ?? 90;
    const distance = layer.shadowDistance ?? 12;
    const blur = layer.shadowSize ?? 16;
    const color = layer.shadowColor ?? '#000000';
    const rad = (angle * Math.PI) / 180;
    // Screen y grows downward, so 0° casts right and 90° casts down.
    const dx = Math.cos(rad) * distance;
    const dy = Math.sin(rad) * distance;
    textShadow = `${dx.toFixed(2)}px ${dy.toFixed(2)}px ${blur}px ${color}`;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: padX,
        top: padTop,
        width: widthAvail,
        color: layer.color,
        fontSize: layer.fontSize,
        fontWeight: layer.weight,
        fontVariationSettings: `"wght" ${layer.weight}, "ROND" ${layer.roundness}`,
        letterSpacing: `${layer.letterSpacing}em`,
        lineHeight: 1.05,
        textAlign: layer.align,
        textShadow,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {layer.text}
    </div>
  );
}
