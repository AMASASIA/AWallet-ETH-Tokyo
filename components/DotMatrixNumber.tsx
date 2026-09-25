import React from 'react';

// 5x7 dot matrix font definition for digits and common currency / math symbols
const DIGIT_MAP: Record<string, number[]> = {
  '0': [
    0b01110,
    0b10001,
    0b10011,
    0b10101,
    0b11001,
    0b10001,
    0b01110,
  ],
  '1': [
    0b00100,
    0b01100,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b01110,
  ],
  '2': [
    0b01110,
    0b10001,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b11111,
  ],
  '3': [
    0b11110,
    0b00001,
    0b00001,
    0b01110,
    0b00001,
    0b00001,
    0b11110,
  ],
  '4': [
    0b00010,
    0b00110,
    0b01010,
    0b10010,
    0b11111,
    0b00010,
    0b00010,
  ],
  '5': [
    0b11111,
    0b10000,
    0b11110,
    0b00001,
    0b00001,
    0b10001,
    0b01110,
  ],
  '6': [
    0b01110,
    0b10000,
    0b11110,
    0b10001,
    0b10001,
    0b10001,
    0b01110,
  ],
  '7': [
    0b11111,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b01000,
    0b01000,
  ],
  '8': [
    0b01110,
    0b10001,
    0b10001,
    0b01110,
    0b10001,
    0b10001,
    0b01110,
  ],
  '9': [
    0b01110,
    0b10001,
    0b10001,
    0b01111,
    0b00001,
    0b00001,
    0b01110,
  ],
  '$': [
    0b00100,
    0b01111,
    0b10100,
    0b01110,
    0b00101,
    0b11110,
    0b00100,
  ],
  '¥': [
    0b10001,
    0b01010,
    0b00100,
    0b01110,
    0b00100,
    0b01110,
    0b00100,
  ],
  '.': [
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00110,
    0b00110,
  ],
  ',': [
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00110,
    0b00010,
    0b00100,
  ],
  '-': [
    0b00000,
    0b00000,
    0b00000,
    0b11111,
    0b00000,
    0b00000,
    0b00000,
  ],
  '+': [
    0b00000,
    0b00100,
    0b00100,
    0b11111,
    0b00100,
    0b00100,
    0b00000,
  ],
  '%': [
    0b11001,
    0b11010,
    0b00100,
    0b01000,
    0b01011,
    0b10011,
    0b00000,
  ],
  'B': [
    0b11110,
    0b10001,
    0b10001,
    0b11110,
    0b10001,
    0b10001,
    0b11110,
  ],
  'P': [
    0b11110,
    0b10001,
    0b10001,
    0b11110,
    0b10000,
    0b10000,
    0b10000,
  ],
  'k': [
    0b10000,
    0b10010,
    0b10100,
    0b11000,
    0b10100,
    0b10010,
    0b10001,
  ],
  'M': [
    0b10001,
    0b11011,
    0b10101,
    0b10101,
    0b10001,
    0b10001,
    0b10001,
  ],
};

interface DotMatrixNumberProps {
  value: string | number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dotColor?: string;
  glow?: boolean;
  className?: string;
}

export const DotMatrixNumber: React.FC<DotMatrixNumberProps> = ({
  value,
  size = 'md',
  dotColor = 'currentColor',
  glow = true,
  className = '',
}) => {
  const str = String(value);

  // Pixel sizing per dot
  const dotDimensions = {
    sm: { r: 1, step: 2.8, w: 14, h: 21, charGap: 3 },
    md: { r: 1.4, step: 3.8, w: 20, h: 29, charGap: 4 },
    lg: { r: 2.0, step: 5.4, w: 28, h: 40, charGap: 6 },
    xl: { r: 2.8, step: 7.2, w: 38, h: 54, charGap: 8 },
  }[size];

  return (
    <div 
      className={`inline-flex items-center select-none font-mono ${className}`} 
      aria-label={str}
      style={{ verticalAlign: 'middle' }}
    >
      {str.split('').map((char, charIdx) => {
        const matrix = DIGIT_MAP[char.toUpperCase()];

        if (char === ' ') {
          return <span key={charIdx} style={{ width: `${dotDimensions.w / 2}px` }} />;
        }

        if (!matrix) {
          // Fallback rendering for unsupported symbols
          return (
            <span 
              key={charIdx} 
              className="font-mono font-bold leading-none"
              style={{ fontSize: `${dotDimensions.h * 0.75}px`, marginRight: `${dotDimensions.charGap}px` }}
            >
              {char}
            </span>
          );
        }

        return (
          <svg
            key={charIdx}
            width={dotDimensions.w}
            height={dotDimensions.h}
            viewBox={`0 0 ${dotDimensions.w} ${dotDimensions.h}`}
            className="shrink-0"
            style={{ marginRight: `${dotDimensions.charGap}px` }}
          >
            {glow && (
              <defs>
                <filter id={`glow-${charIdx}`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="0.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            )}
            {matrix.map((rowBits, rowIndex) => {
              const y = (rowIndex + 0.8) * dotDimensions.step;
              return [4, 3, 2, 1, 0].map((bitCol) => {
                const isLit = (rowBits & (1 << bitCol)) !== 0;
                const colIndex = 4 - bitCol;
                const x = (colIndex + 0.8) * dotDimensions.step;

                if (!isLit) {
                  return (
                    <circle
                      key={`${rowIndex}-${colIndex}`}
                      cx={x}
                      cy={y}
                      r={dotDimensions.r * 0.55}
                      fill="currentColor"
                      opacity="0.08"
                    />
                  );
                }

                return (
                  <circle
                    key={`${rowIndex}-${colIndex}`}
                    cx={x}
                    cy={y}
                    r={dotDimensions.r}
                    fill={dotColor === 'currentColor' ? 'currentColor' : dotColor}
                    opacity="0.95"
                    filter={glow ? `url(#glow-${charIdx})` : undefined}
                  />
                );
              });
            })}
          </svg>
        );
      })}
    </div>
  );
};
