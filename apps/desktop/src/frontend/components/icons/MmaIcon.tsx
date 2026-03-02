import React from 'react'

/**
 * MMA Coin custom icon — bold hexagonal shield with a stylized "M" lightning bolt.
 * Red/dark theme matching the EVM Wallet brand colors.
 */
export const MmaIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red gradient circle background */}
    <defs>
      <linearGradient id="mmaGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BE0E20" />
        <stop offset="100%" stopColor="#8B0A18" />
      </linearGradient>
      <linearGradient id="mmaShine" x1="10" y1="8" x2="30" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF3850" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#BE0E20" stopOpacity="0" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="20" fill="url(#mmaGrad)" />
    {/* Shine overlay */}
    <circle cx="20" cy="20" r="18" fill="url(#mmaShine)" />
    {/* Hexagonal border accent */}
    <polygon
      points="20,4 34,12 34,28 20,36 6,28 6,12"
      fill="none"
      stroke="#FF6B7A"
      strokeWidth="1"
      strokeOpacity="0.4"
    />
    {/* Inner hexagon */}
    <polygon
      points="20,7 31.5,13.5 31.5,26.5 20,33 8.5,26.5 8.5,13.5"
      fill="none"
      stroke="#FF6B7A"
      strokeWidth="0.5"
      strokeOpacity="0.2"
    />
    {/* Bold "M" letter — stylized with sharp angles */}
    <path
      d="M11 29 L11 14 L16 22 L20 14 L24 22 L29 14 L29 29 L26 29 L26 21 L22 28 L18 28 L14 21 L14 29 Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
    />
  </svg>
)
