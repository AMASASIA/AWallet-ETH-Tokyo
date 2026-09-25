import React from 'react';

interface TablerButterflyProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Tabler Icons: icon-butterfly (outline)
 * 絵文字(🦋)禁止ルールに準拠し、TablerのアウトラインベクターでButterfly Effectを表現
 */
export const TablerButterfly: React.FC<TablerButterflyProps> = ({
  size = 16,
  className = '',
  strokeWidth = 1.75,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Central butterfly body */}
      <path d="M12 4v16" />
      {/* Top wings */}
      <path d="M12 8c2.5 -4 7.5 -4 8.5 0c1 4 -2.5 7 -8.5 7" />
      <path d="M12 8c-2.5 -4 -7.5 -4 -8.5 0c-1 4 2.5 7 8.5 7" />
      {/* Bottom wings */}
      <path d="M12 15c3 2 6 2 6.5 0c.5 -2 -2 -3 -6.5 -3" />
      <path d="M12 15c-3 2 -6 2 -6.5 0c-.5 -2 2 -3 6.5 -3" />
      {/* Antennae */}
      <path d="M10 4l-1.5 -1.5" />
      <path d="M14 4l1.5 -1.5" />
    </svg>
  );
};
