const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to rounded rectangle
function sdRoundRect(px, py, rx, ry, rw, rh, radius) {
  const dx = Math.max(Math.abs(px - (rx + rw / 2)) - (rw / 2 - radius), 0);
  const dy = Math.max(Math.abs(py - (ry + rh / 2)) - (rh / 2 - radius), 0);
  return Math.sqrt(dx * dx + dy * dy) - radius;
}

function drawIcon(x, y, width, height, isMaskable = false) {
  const u = x / width;
  const v = y / height;

  // Background
  let bgR = 10, bgG = 12, bgB = 18, bgA = 255;
  // Subtle radial gradient
  const distCenter = Math.hypot(u - 0.5, v - 0.45);
  bgR = Math.min(255, Math.round(10 + (1 - distCenter) * 12));
  bgG = Math.min(255, Math.round(14 + (1 - distCenter) * 24));
  bgB = Math.min(255, Math.round(20 + (1 - distCenter) * 16));

  if (!isMaskable) {
    const pad = width * 0.04;
    const corner = width * 0.22;
    const d = sdRoundRect(x, y, pad, pad, width - pad * 2, height - pad * 2, corner);
    if (d > 0) {
      const alpha = Math.max(0, Math.min(1, 1 - d));
      if (alpha <= 0) return [0, 0, 0, 0];
      bgA = Math.round(alpha * 255);
    }
  }

  // Emerald circular aura
  const auraDist = Math.hypot(u - 0.5, v - 0.5);
  const auraStrength = Math.max(0, 1 - auraDist / 0.42);
  const auraEmerald = Math.pow(auraStrength, 2.2) * 0.45;

  let r = Math.round(bgR * (1 - auraEmerald) + 16 * auraEmerald);
  let g = Math.round(bgG * (1 - auraEmerald) + 185 * auraEmerald);
  let b = Math.round(bgB * (1 - auraEmerald) + 129 * auraEmerald);

  // Scale emblem
  const scale = isMaskable ? 0.72 : 0.85;
  const cx = 0.5;
  const cy = 0.5;
  const nx = (u - cx) / scale;
  const ny = (v - cy) / scale;

  // Draw currency '$' / 'S' Glyph with smooth distance fields
  // Vertical spine: from ny = -0.32 to +0.32 at nx ~ 0
  const distSpine = Math.max(Math.abs(nx), Math.max(0, Math.abs(ny) - 0.32));
  const spineWidth = 0.045;
  const isSpine = distSpine < spineWidth;

  // Upper arc centered around (0, -0.13), radius ~0.15
  const dUpperArc = Math.abs(Math.hypot(nx, ny - (-0.13)) - 0.15);
  // Lower arc centered around (0, 0.13), radius ~0.15
  const dLowerArc = Math.abs(Math.hypot(nx, ny - 0.13) - 0.15);

  const strokeWidth = 0.065;
  const isUpper = dUpperArc < strokeWidth && (nx < 0.12 || ny < -0.13);
  const isLower = dLowerArc < strokeWidth && (nx > -0.12 || ny > 0.13);

  let glyphAlpha = 0;
  if (isSpine) {
    glyphAlpha = Math.max(glyphAlpha, 0.65 * (1 - distSpine / spineWidth));
  }
  if (isUpper) {
    const a = 1 - dUpperArc / strokeWidth;
    glyphAlpha = Math.max(glyphAlpha, a);
  }
  if (isLower) {
    const a = 1 - dLowerArc / strokeWidth;
    glyphAlpha = Math.max(glyphAlpha, a);
  }

  // Accent diamond dot at top right (nx: 0.22, ny: -0.22)
  const dDot = Math.hypot(nx - 0.24, ny - (-0.24));
  if (dDot < 0.055) {
    glyphAlpha = Math.max(glyphAlpha, 1 - dDot / 0.055);
  }

  if (glyphAlpha > 0) {
    // Gradient on glyph: emerald #34d399 to #10b981
    const glyphR = Math.round(52 + (1 - v) * 50);
    const glyphG = Math.round(211 + (1 - v) * 30);
    const glyphB = Math.round(153 + (1 - v) * 30);

    r = Math.round(r * (1 - glyphAlpha) + glyphR * glyphAlpha);
    g = Math.round(g * (1 - glyphAlpha) + glyphG * glyphAlpha);
    b = Math.round(b * (1 - glyphAlpha) + glyphB * glyphAlpha);
  }

  return [r, g, b, bgA];
}

console.log('Generating PWA icons...');
const publicDir = path.join(__dirname, '..', 'public');

// 1. icon-192.png
const buf192 = createPng(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), buf192);
console.log('Created public/icon-192.png');

// 2. icon-512.png
const buf512 = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), buf512);
console.log('Created public/icon-512.png');

// 3. icon-maskable-512.png
const bufMask512 = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), bufMask512);
console.log('Created public/icon-maskable-512.png');

// 4. apple-touch-icon.png (180x180)
const bufApple = createPng(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), bufApple);
console.log('Created public/apple-touch-icon.png');

// 5. favicon.png (32x32)
const bufFavicon = createPng(32, 32, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), bufFavicon);
console.log('Created public/favicon.png');

console.log('All PWA icons generated successfully!');
