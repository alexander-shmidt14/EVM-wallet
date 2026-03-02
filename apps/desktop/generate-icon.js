/**
 * Generate EVM Wallet icon (256x256 PNG → ICO) using only built-in Node.js modules.
 * Colors: #09111C background, #BE0E20 red accent border, #f2f2f2 "EVM" text
 */
const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

// ── CRC-32 lookup table ──────────────────────────
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c
}
function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// ── Pixel buffer helpers ─────────────────────────
const W = 256, H = 256
const pixels = Buffer.alloc(W * H * 4) // RGBA

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const i = (y * W + x) * 4
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a
}

function fillRect(x0, y0, w, h, r, g, b, a = 255) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      setPixel(x, y, r, g, b, a)
}

function drawRoundedRect(x0, y0, w, h, radius, r, g, b, a = 255) {
  // Fill main body
  fillRect(x0 + radius, y0, w - 2 * radius, h, r, g, b, a)
  fillRect(x0, y0 + radius, w, h - 2 * radius, r, g, b, a)
  // Fill corners
  for (let cy = 0; cy < radius; cy++) {
    for (let cx = 0; cx < radius; cx++) {
      const dist = Math.sqrt((radius - cx - 0.5) ** 2 + (radius - cy - 0.5) ** 2)
      if (dist <= radius) {
        // Top-left
        setPixel(x0 + cx, y0 + cy, r, g, b, a)
        // Top-right
        setPixel(x0 + w - 1 - cx, y0 + cy, r, g, b, a)
        // Bottom-left
        setPixel(x0 + cx, y0 + h - 1 - cy, r, g, b, a)
        // Bottom-right
        setPixel(x0 + w - 1 - cx, y0 + h - 1 - cy, r, g, b, a)
      }
    }
  }
}

// Simple bitmap font for E, V, M (5x7 grid)
const FONT = {
  E: [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  V: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  M: [
    [1,0,0,0,1],
    [1,1,0,1,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
}

function drawChar(ch, startX, startY, scale, r, g, b) {
  const bitmap = FONT[ch]
  if (!bitmap) return
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (bitmap[row][col]) {
        fillRect(startX + col * scale, startY + row * scale, scale, scale, r, g, b)
      }
    }
  }
}

function drawText(text, centerX, centerY, scale, r, g, b) {
  const charW = 5 * scale
  const gap = Math.ceil(scale * 1.2)
  const totalW = text.length * charW + (text.length - 1) * gap
  let x = centerX - Math.floor(totalW / 2)
  const y = centerY - Math.floor(7 * scale / 2)
  for (const ch of text) {
    drawChar(ch, x, y, scale, r, g, b)
    x += charW + gap
  }
}

// ── Draw the icon ────────────────────────────────
// Background (fully transparent by default, then draw rounded rect)
// Fill with transparent first
pixels.fill(0)

// Outer rounded rectangle — red accent border
const borderWidth = 8
const cornerRadius = 40
drawRoundedRect(0, 0, W, H, cornerRadius, 0xBE, 0x0E, 0x20)

// Inner rounded rectangle — dark background
drawRoundedRect(borderWidth, borderWidth, W - 2 * borderWidth, H - 2 * borderWidth, cornerRadius - borderWidth, 0x09, 0x11, 0x1C)

// Draw "EVM" text
drawText('EVM', W / 2, H / 2, 8, 0xf2, 0xf2, 0xf2)

// Subtle red glow line at the bottom
const glowY = H - borderWidth - 20
for (let x = cornerRadius; x < W - cornerRadius; x++) {
  const dist = Math.abs(x - W / 2)
  const alpha = Math.max(0, Math.min(255, 255 - Math.floor(dist * 2.2)))
  setPixel(x, glowY, 0xBE, 0x0E, 0x20, alpha)
  setPixel(x, glowY + 1, 0xBE, 0x0E, 0x20, Math.floor(alpha * 0.5))
}

// ── Encode PNG ───────────────────────────────────
function makePNGChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeData = Buffer.concat([Buffer.from(type), data])
  const c = crc32(typeData)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(c)
  return Buffer.concat([len, typeData, crcBuf])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // IDAT — add filter byte per row
  const rowLen = 1 + width * 4
  const raw = Buffer.alloc(height * rowLen)
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0 // filter None
    rgba.copy(raw, y * rowLen + 1, y * width * 4, (y + 1) * width * 4)
  }
  const compressed = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    makePNGChunk('IHDR', ihdr),
    makePNGChunk('IDAT', compressed),
    makePNGChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Encode ICO ───────────────────────────────────
function encodeICO(pngBuffers) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)       // reserved
  header.writeUInt16LE(1, 2)       // type: icon
  header.writeUInt16LE(pngBuffers.length, 4) // image count

  const entries = []
  let dataOffset = 6 + pngBuffers.length * 16

  for (const png of pngBuffers) {
    const entry = Buffer.alloc(16)
    entry[0] = 0   // width (0 = 256)
    entry[1] = 0   // height (0 = 256)
    entry[2] = 0   // colors
    entry[3] = 0   // reserved
    entry.writeUInt16LE(1, 4)      // planes
    entry.writeUInt16LE(32, 6)     // bits per pixel
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(dataOffset, 12)
    entries.push(entry)
    dataOffset += png.length
  }

  return Buffer.concat([header, ...entries, ...pngBuffers])
}

// ── Generate smaller sizes ───────────────────────
function downscale(srcRGBA, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4)
  const scaleX = srcW / dstW
  const scaleY = srcH / dstH
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      // Simple area-average downscaling
      let r = 0, g = 0, b = 0, a = 0, count = 0
      const sx0 = Math.floor(x * scaleX)
      const sy0 = Math.floor(y * scaleY)
      const sx1 = Math.floor((x + 1) * scaleX)
      const sy1 = Math.floor((y + 1) * scaleY)
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * srcW + sx) * 4
          r += srcRGBA[i]; g += srcRGBA[i+1]; b += srcRGBA[i+2]; a += srcRGBA[i+3]
          count++
        }
      }
      const di = (y * dstW + x) * 4
      dst[di]   = Math.round(r / count)
      dst[di+1] = Math.round(g / count)
      dst[di+2] = Math.round(b / count)
      dst[di+3] = Math.round(a / count)
    }
  }
  return dst
}

// ── Write files ──────────────────────────────────
const outDir = path.join(__dirname, 'assets')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const png256 = encodePNG(256, 256, pixels)

// Smaller sizes for ICO
const sizes = [16, 32, 48, 256]
const pngBuffers = sizes.map(sz => {
  if (sz === 256) return png256
  const scaled = downscale(pixels, 256, 256, sz, sz)
  return encodePNG(sz, sz, scaled)
})

const ico = encodeICO(pngBuffers)

fs.writeFileSync(path.join(outDir, 'icon.png'), png256)
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico)

console.log('Generated:')
console.log('  assets/icon.png (' + png256.length + ' bytes)')
console.log('  assets/icon.ico (' + ico.length + ' bytes)')
