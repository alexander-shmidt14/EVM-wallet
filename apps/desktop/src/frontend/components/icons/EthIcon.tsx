import React from 'react'

/** Ethereum diamond logo — clean, bold, easily readable at small sizes */
export const EthIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Dark circle background */}
    <circle cx="20" cy="20" r="20" fill="#343A54" />
    {/* Diamond top-left */}
    <path d="M20 6 L10 20 L20 17 Z" fill="#8C8EAE" />
    {/* Diamond top-right */}
    <path d="M20 6 L30 20 L20 17 Z" fill="#C0C2D5" />
    {/* Diamond mid-left */}
    <path d="M10 20 L20 17 L20 24 Z" fill="#8C8EAE" />
    {/* Diamond mid-right */}
    <path d="M30 20 L20 17 L20 24 Z" fill="#C0C2D5" />
    {/* Diamond bottom-left */}
    <path d="M10 22 L20 34 L20 26 Z" fill="#8C8EAE" />
    {/* Diamond bottom-right */}
    <path d="M30 22 L20 34 L20 26 Z" fill="#C0C2D5" />
  </svg>
)
