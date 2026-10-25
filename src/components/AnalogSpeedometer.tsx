import React from 'react';

interface AnalogSpeedometerProps {
  speedKmh: number;
  isBoosting?: boolean;
}

export const AnalogSpeedometer: React.FC<AnalogSpeedometerProps> = React.memo(({
  speedKmh,
  isBoosting = false,
}) => {
  // Classic Indian rickshaw speedometer sweeps 240 degrees from -120° (0 km/h) to +120° (100 km/h)
  const clampedSpeed = Math.max(0, Math.min(115, speedKmh));
  const needleAngle = -120 + (clampedSpeed / 100) * 240;

  // Major tick speeds: 0, 20, 40, 60, 80, 100
  const majorTicks = [0, 20, 40, 60, 80, 100];
  // Minor tick speeds: 10, 30, 50, 70, 90
  const minorTicks = [10, 30, 50, 70, 90];

  return (
    <div
      className="relative flex items-center justify-center select-none group"
      title={`Speed: ${speedKmh} km/h (Classic Rickshaw Gauge)`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-18 h-18 sm:w-22 sm:h-22 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter overflow-visible"
      >
        <defs>
          {/* Bezel Metallic Gradients */}
          <radialGradient id="bezelOuter" cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="45%" stopColor="#b45309" />
            <stop offset="85%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#18181b" />
          </radialGradient>

          <radialGradient id="bezelInner" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#18181b" />
            <stop offset="90%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </radialGradient>

          {/* Dial Face Texture Gradient */}
          <radialGradient id="dialFace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="70%" stopColor="#0c0a09" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Needle Gradient */}
          <linearGradient id="needleGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="85%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          {/* Pivot Hub Cap Gradient */}
          <radialGradient id="hubGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          {/* Needle Drop Shadow */}
          <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0.5" dy="1.2" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* 1. Outer Brass / Chrome Metallic Bezel */}
        <circle cx="50" cy="50" r="48" fill="url(#bezelOuter)" stroke="#d97706" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="45.5" fill="none" stroke="#78350f" strokeWidth="0.75" />

        {/* 2. Deep Matte Dial Face */}
        <circle cx="50" cy="50" r="44" fill="url(#dialFace)" stroke="#27272a" strokeWidth="0.6" />

        {/* 3. Outer Calibration Arc Tracks */}
        {/* Safe Economy Track (0 to 60 km/h) */}
        <path
          d="M 23.3 67.5 A 38 38 0 0 1 72.8 33.9"
          fill="none"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />

        {/* Redline Danger Track (60 to 100+ km/h) */}
        <path
          d="M 72.8 33.9 A 38 38 0 0 1 76.7 67.5"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeOpacity="0.85"
          strokeLinecap="round"
        />

        {/* 4. Minor Ticks (Every 10 km/h: 10, 30, 50, 70, 90) */}
        {minorTicks.map((val) => {
          const angle = -120 + (val / 100) * 240;
          const isRed = val >= 60;
          return (
            <line
              key={`minor-${val}`}
              x1="50"
              y1="13"
              x2="50"
              y2="16.5"
              stroke={isRed ? '#f87171' : '#a1a1aa'}
              strokeWidth="0.8"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}

        {/* 5. Major Ticks & Speed Numbers (0, 20, 40, 60, 80, 100) */}
        {majorTicks.map((val) => {
          const angle = -120 + (val / 100) * 240;
          const isRed = val >= 60;
          // Calculate number position at radius 28.5
          const rad = ((angle - 90) * Math.PI) / 180;
          const numX = 50 + 28 * Math.cos(rad);
          const numY = 50 + 28 * Math.sin(rad);

          return (
            <g key={`major-${val}`}>
              <line
                x1="50"
                y1="12"
                x2="50"
                y2="18"
                stroke={isRed ? '#ef4444' : '#fef08a'}
                strokeWidth="1.4"
                strokeLinecap="round"
                transform={`rotate(${angle} 50 50)`}
              />
              <text
                x={numX}
                y={numY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isRed ? '#f87171' : '#e4e4e7'}
                fontSize="5.2"
                fontWeight="800"
                fontFamily="monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* 6. Authentic Vintage Branding & Units */}
        <text
          x="50"
          y="35"
          textAnchor="middle"
          fill="#f59e0b"
          fontSize="3.6"
          fontWeight="800"
          letterSpacing="0.8"
          fontFamily="sans-serif"
          opacity="0.85"
        >
          PRICOL • RE
        </text>

        <text
          x="50"
          y="62.5"
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="4.2"
          fontWeight="bold"
          letterSpacing="0.4"
          fontFamily="monospace"
        >
          km/h
        </text>

        {/* 7. Classic Odometer / Mini Digital Box */}
        <rect
          x="36"
          y="66.5"
          width="28"
          height="10"
          rx="1.8"
          fill="#09090b"
          stroke="#3f3f46"
          strokeWidth="0.7"
        />
        <text
          x="50"
          y="73"
          textAnchor="middle"
          dominantBaseline="central"
          fill={isBoosting ? '#38bdf8' : '#fbbf24'}
          fontSize="6.2"
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="0.5"
        >
          {String(Math.round(speedKmh)).padStart(3, '0')}
        </text>

        {/* 8. Rotating Analog Speedometer Needle */}
        <g
          filter="url(#needleShadow)"
          transform={`rotate(${needleAngle} 50 50)`}
          style={{
            transition: 'transform 90ms cubic-bezier(0.12, 0.72, 0.29, 1)',
          }}
        >
          {/* Tapered needle pointer */}
          <path
            d="M 48.6 50 L 49.3 13.5 Q 50 12 50.7 13.5 L 51.4 50 L 51 58 L 49 58 Z"
            fill="url(#needleGrad)"
          />
          {/* Needle bright center highlight spine */}
          <line
            x1="50"
            y1="14"
            x2="50"
            y2="48"
            stroke="#ffffff"
            strokeWidth="0.45"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
          {/* Needle counterweight tail */}
          <circle cx="50" cy="55.5" r="2.2" fill="#7f1d1d" />
        </g>

        {/* 9. Center Brass Pivot Hub Cap */}
        <circle cx="50" cy="50" r="5.6" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="3.6" fill="url(#hubGrad)" />
        <circle cx="50" cy="50" r="1.3" fill="#fef08a" />
      </svg>
    </div>
  );
});
