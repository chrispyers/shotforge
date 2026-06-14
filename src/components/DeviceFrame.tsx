import type { CSSProperties } from 'react';

interface Props {
  /** Pixel width of the device frame (height derived from aspect ratio) */
  width: number;
  screenshotDataUrl: string | null;
  showShadow: boolean;
  showStatusBar: boolean;
  statusBarTime: string;
  noSignal: boolean;
  lowBattery: boolean;
}

const DEVICE_ASPECT = 9 / 19.5;

export function DeviceFrame({
  width,
  screenshotDataUrl,
  showShadow,
  showStatusBar,
  statusBarTime,
  noSignal,
  lowBattery,
}: Props) {
  const height = width / DEVICE_ASPECT;
  const bezel = width * 0.025;
  const cornerRadius = width * 0.13;
  const innerCorner = cornerRadius - bezel * 0.6;
  const buttonWidth = bezel * 0.6;
  const volumeTop = height * 0.18;
  const volumeHeight = height * 0.06;
  const volume2Top = volumeTop + volumeHeight + height * 0.02;
  const powerTop = height * 0.26;
  const powerHeight = height * 0.08;
  const micWidth = width * 0.16;
  const micHeight = bezel * 0.18;

  const containerStyle: CSSProperties = {
    width,
    height,
    position: 'relative',
    filter: showShadow
      ? `drop-shadow(0 ${width * 0.06}px ${width * 0.1}px rgba(0,0,0,0.45))`
      : undefined,
  };

  const frameStyle: CSSProperties = {
    width,
    height,
    backgroundColor: '#1f2024',
    borderRadius: cornerRadius,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
  };

  const screenStyle: CSSProperties = {
    position: 'absolute',
    top: bezel,
    left: bezel,
    right: bezel,
    bottom: bezel,
    borderRadius: innerCorner,
    backgroundColor: '#000',
    overflow: 'hidden',
  };

  const buttonBase: CSSProperties = {
    position: 'absolute',
    right: -buttonWidth * 0.35,
    width: buttonWidth,
    backgroundColor: '#16171a',
    borderRadius: buttonWidth * 0.4,
  };

  return (
    <div style={containerStyle}>
      <div style={frameStyle}>
        {/* Mic slit */}
        <div
          style={{
            position: 'absolute',
            top: bezel * 0.45,
            left: '50%',
            transform: 'translateX(-50%)',
            width: micWidth,
            height: micHeight,
            backgroundColor: '#0e0f12',
            borderRadius: micHeight,
          }}
        />
        {/* Screen */}
        <div style={screenStyle}>
          {screenshotDataUrl ? (
            <img
              src={screenshotDataUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5b5e66',
                fontSize: width * 0.05,
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                padding: width * 0.08,
                lineHeight: 1.3,
              }}
            >
              Drop a cleaned screenshot here
            </div>
          )}
          {showStatusBar && (
            <StatusBarOverlay
              width={width - bezel * 2}
              time={statusBarTime}
              noSignal={noSignal}
              lowBattery={lowBattery}
            />
          )}
        </div>
      </div>
      {/* Buttons (right side) */}
      <div style={{ ...buttonBase, top: volumeTop, height: volumeHeight }} />
      <div style={{ ...buttonBase, top: volume2Top, height: volumeHeight }} />
      <div style={{ ...buttonBase, top: powerTop, height: powerHeight, right: undefined, left: -buttonWidth * 0.35 }} />
    </div>
  );
}

function StatusBarOverlay({
  width,
  time,
  noSignal,
  lowBattery,
}: {
  width: number;
  time: string;
  noSignal: boolean;
  lowBattery: boolean;
}) {
  const height = width * 0.075;
  const fontSize = height * 0.42;
  const padX = width * 0.1;
  const topOffset = width * 0.022;
  return (
    <div
      style={{
        position: 'absolute',
        top: topOffset,
        left: 0,
        right: 0,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${padX}px`,
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize,
        textShadow: '0 0 4px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    >
      <span>{time}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: width * 0.03 }}>
        {/* Signal bars — filled pills, no outline. Faded when off-grid. */}
        <span style={{ display: 'flex', gap: width * 0.006, alignItems: 'flex-end' }}>
          {[0.4, 0.6, 0.8, 1].map((h, i) => {
            const barW = width * 0.013;
            return (
              <span
                key={i}
                style={{
                  width: barW,
                  height: height * 0.45 * h,
                  backgroundColor: '#fff',
                  opacity: noSignal ? 0.3 : 1,
                  borderRadius: barW,
                }}
              />
            );
          })}
        </span>
        {/* Wifi (simple bars) — hidden when off-grid */}
        {!noSignal && (
          <svg width={height * 0.55} height={height * 0.5} viewBox="0 0 20 16" fill="#fff">
            <path d="M10 16a2 2 0 110-4 2 2 0 010 4zM3 8.5a10 10 0 0114 0l-2 2a7 7 0 00-10 0zM0 5.5a14 14 0 0120 0l-2 2a11 11 0 00-16 0z" />
          </svg>
        )}
        {/* Battery — Android-style cell on its side: no outline, a nub on the
            right, translucent body, charge filling from the left (red when low). */}
        <span style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* Body */}
          <span
            style={{
              position: 'relative',
              width: height * 0.58,
              height: height * 0.42,
              backgroundColor: 'rgba(255,255,255,0.22)',
              borderRadius: height * 0.08,
              overflow: 'hidden',
            }}
          >
            {/* Charge level filling from the left */}
            <span
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: lowBattery ? '22%' : '100%',
                backgroundColor: lowBattery ? '#FF3B30' : '#fff',
              }}
            />
          </span>
          {/* Nub — detached, sitting just to the right of the body */}
          <span
            style={{
              width: height * 0.09,
              height: height * 0.26,
              backgroundColor: 'rgba(255,255,255,0.22)',
              borderTopRightRadius: height * 0.04,
              borderBottomRightRadius: height * 0.04,
              marginLeft: height * 0.05,
            }}
          />
        </span>
      </span>
    </div>
  );
}
