import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export const QRCodeCanvas: React.FC<QRCodeProps> = ({ 
  value, 
  size = 200, 
  className = '',
  errorCorrectionLevel = 'M'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }, (err) => {
      if (err) {
        console.error('QR Code generation error:', err)
        setError('Failed to generate QR code')
      } else {
        setError(null)
      }
    })
  }, [value, size, errorCorrectionLevel])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-dark-700 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <p className="text-sm text-gray-500 text-center px-4">
          {error}
        </p>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
      style={{ maxWidth: size, maxHeight: size }}
    />
  )
}
