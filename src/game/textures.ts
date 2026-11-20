import * as THREE from 'three';

function hexToCss(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

export function createSnowCobbleTexture(
  baseHex: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = hexToCss(baseHex);
  ctx.fillRect(0, 0, size, size);

  const rows = 4;
  const cols = 4;
  const cellW = size / cols;
  const cellH = size / rows;
  for (let r = 0; r < rows; r++) {
    const offsetX = r % 2 === 0 ? 0 : cellW * 0.5;
    for (let c = -1; c <= cols; c++) {
      const x = c * cellW + offsetX + 4;
      const y = r * cellH + 4;
      const w = cellW - 8;
      const h = cellH - 8;
      ctx.fillStyle =
        (r + c) % 2 === 0
          ? 'rgba(255, 255, 255, 0.35)'
          : 'rgba(100, 116, 139, 0.22)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  for (let i = 0; i < 120; i++) {
    const sx = (i * 73) % size;
    const sy = (i * 137) % size;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.fillRect(sx, sy, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWallBrickTexture(
  primaryHex: number,
  trimHex: number,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = hexToCss(primaryHex);
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.lineWidth = 4;
  const rows = 4;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    const offset = r % 2 === 0 ? 0 : size / 4;
    for (let c = 0; c < 3; c++) {
      const x = (c * size) / 2 + offset;
      ctx.beginPath();
      ctx.moveTo(x % size, y);
      ctx.lineTo(x % size, y + rowH);
      ctx.stroke();
    }
  }

  const grad = ctx.createLinearGradient(0, 0, 0, 48);
  grad.addColorStop(0, hexToCss(trimHex));
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createIceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#bae6fd');
  grad.addColorStop(0.5, '#e0f2fe');
  grad.addColorStop(1, '#7dd3fc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 3;
  for (let i = -size; i < size * 2; i += 44) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 80, size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBumpNoiseTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 115 + ((i * 37) % 45);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    4,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(10, 18, 36, 0.55)');
  grad.addColorStop(0.6, 'rgba(10, 18, 36, 0.22)');
  grad.addColorStop(1, 'rgba(10, 18, 36, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Soft glowing circular ring texture for Santa's Night Mode lantern aura.
 * Keeps the illuminated circle compact with a warm, soft-fading perimeter.
 */
export function createNightLightRingTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, size / 2);
  grad.addColorStop(0, 'rgba(255, 244, 200, 0.55)');
  grad.addColorStop(0.45, 'rgba(255, 226, 148, 0.34)');
  grad.addColorStop(0.75, 'rgba(251, 191, 36, 0.16)');
  grad.addColorStop(0.9, 'rgba(251, 191, 36, 0.05)');
  grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle soft golden lantern ring edge
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.24)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.41, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
