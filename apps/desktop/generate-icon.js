/**
 * Generate EVM Wallet icon assets from icon_app.png
 * Reads the custom icon, decodes PNG, downscales to required sizes,
 * outputs icon.png (256×256) and icon.ico (16/32/48/256 multi-size).
 * Uses only built-in Node.js modules.
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

// ── PNG Decoder (pure Node.js) ───────────────────
function decodePNG(fileBuffer) {
  // Verify PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (fileBuffer.subarray(0, 8).compare(sig) !== 0) {
    throw new Error('Not a valid PNG file')
  }

  let offset = 8
  let width, height, bitDepth, colorType
  const idatChunks = []

  // Parse PNG chunks
  while (offset < fileBuffer.length) {
    const chunkLen = fileBuffer.readUInt32BE(offset)
    const chunkType = fileBuffer.subarray(offset + 4, offset + 8).toString('ascii')
    const chunkData = fileBuffer.subarray(offset + 8, offset + 8 + chunkLen)
    offset += 12 + chunkLen // 4 len + 4 type + data + 4 crc

    if (chunkType === 'IHDR') {
      width = chunkData.readUInt32BE(0)
      height = chunkData.readUInt32BE(4)
      bitDepth = chunkData[8]
      colorType = chunkData[9]
      const compression = chunkData[10]
      const filter = chunkData[11]
      const interlace = chunkData[12]
      if (interlace !== 0) throw new Error('Interlaced PNGs not supported')
      if (bitDepth !== 8) throw new Error(`Unsupported bit depth: ${bitDepth}`)
      console.log(`  Source: ${width}×${height}, bitDepth=${bitDepth}, colorType=${colorType}`)
    } else if (chunkType === 'IDAT') {
      idatChunks.push(chunkData)
    } else if (chunkType === 'IEND') {
      break
    }
  }

  if (!width || !height) throw new Error('Missing IHDR chunk')

  // Determine bytes per pixel
  let bpp
  switch (colorType) {
    case 0: bpp = 1; break // Grayscale
    case 2: bpp = 3; break // RGB
    case 4: bpp = 2; break // Grayscale+Alpha
    case 6: bpp = 4; break // RGBA
    default: throw new Error(`Unsupported color type: ${colorType}`)
  }

  // Decompress IDAT data
  const compressedData = Buffer.concat(idatChunks)
  const rawData = zlib.inflateSync(compressedData)

  const rowBytes = width * bpp
  const rgba = Buffer.alloc(width * height * 4)

  // Un-filter rows
  let rawOffset = 0
  const prevRow = Buffer.alloc(rowBytes)
  const curRow = Buffer.alloc(rowBytes)
  prevRow.fill(0)

  for (let y = 0; y < height; y++) {
    const filterType = rawData[rawOffset++]

    // Read current filtered row
    rawData.copy(curRow, 0, rawOffset, rawOffset + rowBytes)
    rawOffset += rowBytes

    // Apply PNG filter reconstruction
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? curRow[i - bpp] : 0 // left
      const b = prevRow[i]                       // up
      const c = i >= bpp ? prevRow[i - bpp] : 0  // upper-left

      switch (filterType) {
        case 0: break // None
        case 1: curRow[i] = (curRow[i] + a) & 0xFF; break // Sub
        case 2: curRow[i] = (curRow[i] + b) & 0xFF; break // Up
        case 3: curRow[i] = (curRow[i] + Math.floor((a + b) / 2)) & 0xFF; break // Average
        case 4: { // Paeth
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          curRow[i] = (curRow[i] + pr) & 0xFF
          break
        }
        default: throw new Error(`Unknown filter type: ${filterType} at row ${y}`)
      }
    }

    // Convert to RGBA
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4
      switch (colorType) {
        case 0: // Grayscale
          rgba[di] = rgba[di+1] = rgba[di+2] = curRow[x]
          rgba[di+3] = 255
          break
        case 2: // RGB
          rgba[di]   = curRow[x * 3]
          rgba[di+1] = curRow[x * 3 + 1]
          rgba[di+2] = curRow[x * 3 + 2]
          rgba[di+3] = 255
          break
        case 4: // Grayscale+Alpha
          rgba[di] = rgba[di+1] = rgba[di+2] = curRow[x * 2]
          rgba[di+3] = curRow[x * 2 + 1]
          break
        case 6: // RGBA
          rgba[di]   = curRow[x * 4]
          rgba[di+1] = curRow[x * 4 + 1]
          rgba[di+2] = curRow[x * 4 + 2]
          rgba[di+3] = curRow[x * 4 + 3]
          break
      }
    }

    // Save current row as previous
    curRow.copy(prevRow)
  }

  return { width, height, rgba }
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

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

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
function encodeICO(pngBuffers, sizes) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)       // reserved
  header.writeUInt16LE(1, 2)       // type: icon
  header.writeUInt16LE(pngBuffers.length, 4)

  const entries = []
  let dataOffset = 6 + pngBuffers.length * 16

  for (let i = 0; i < pngBuffers.length; i++) {
    const png = pngBuffers[i]
    const sz = sizes[i]
    const entry = Buffer.alloc(16)
    entry[0] = sz < 256 ? sz : 0  // width (0 = 256)
    entry[1] = sz < 256 ? sz : 0  // height (0 = 256)
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

// ── Downscale with area-average sampling ─────────
function downscale(srcRGBA, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4)
  const scaleX = srcW / dstW
  const scaleY = srcH / dstH
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0
      const sx0 = Math.floor(x * scaleX)
      const sy0 = Math.floor(y * scaleY)
      const sx1 = Math.min(Math.floor((x + 1) * scaleX), srcW)
      const sy1 = Math.min(Math.floor((y + 1) * scaleY), srcH)
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * srcW + sx) * 4
          r += srcRGBA[i]; g += srcRGBA[i+1]; b += srcRGBA[i+2]; a += srcRGBA[i+3]
          count++
        }
      }
      if (count === 0) count = 1
      const di = (y * dstW + x) * 4
      dst[di]   = Math.round(r / count)
      dst[di+1] = Math.round(g / count)
      dst[di+2] = Math.round(b / count)
      dst[di+3] = Math.round(a / count)
    }
  }
  return dst
}

// ── Main ─────────────────────────────────────────
const outDir = path.join(__dirname, 'assets')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// Read and decode source icon
const srcPath = path.join(outDir, 'icon_app.png')
if (!fs.existsSync(srcPath)) {
  console.error(`ERROR: Source icon not found at ${srcPath}`)
  console.error('Place your icon_app.png in apps/desktop/assets/')
  process.exit(1)
}

console.log('Reading source icon: ' + srcPath)
const srcBuf = fs.readFileSync(srcPath)
const { width: srcW, height: srcH, rgba: srcRGBA } = decodePNG(srcBuf)

// Downscale source to 256×256 for the main icon.png
console.log('Downscaling to 256×256...')
const pixels256 = downscale(srcRGBA, srcW, srcH, 256, 256)
const png256 = encodePNG(256, 256, pixels256)

// Generate multi-size ICO (16, 32, 48, 256)
const sizes = [16, 32, 48, 256]
console.log('Generating ICO sizes:', sizes.join(', '))
const pngBuffers = sizes.map(sz => {
  if (sz === 256) return png256
  const scaled = downscale(srcRGBA, srcW, srcH, sz, sz)
  return encodePNG(sz, sz, scaled)
})

const ico = encodeICO(pngBuffers, sizes)

fs.writeFileSync(path.join(outDir, 'icon.png'), png256)
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico)

console.log('\nGenerated:')
console.log('  assets/icon.png (' + png256.length + ' bytes)')
console.log('  assets/icon.ico (' + ico.length + ' bytes)')
console.log('Done!')
