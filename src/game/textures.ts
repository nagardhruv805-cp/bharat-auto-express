import * as THREE from 'three';

// Cache generated procedural textures to avoid recreation
const textureCache = new Map<string, THREE.CanvasTexture>();

function setupTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  return texture;
}

// 1. Asphalt Road Texture with Indian yellow/white median markings & tar texture
export function getRoadTexture(): THREE.CanvasTexture {
  if (textureCache.has('road')) return textureCache.get('road')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark charcoal asphalt base with fine pebble grit
  ctx.fillStyle = '#222326';
  ctx.fillRect(0, 0, 1024, 1024);

  // Road noise / gravel texture
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle tar patches
  for (let p = 0; p < 8; p++) {
    ctx.fillStyle = 'rgba(15, 15, 17, 0.4)';
    ctx.beginPath();
    const px = Math.random() * 1024;
    const py = Math.random() * 1024;
    ctx.ellipse(px, py, 20 + Math.random() * 40, 10 + Math.random() * 25, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // White edge lines (outer boundary)
  ctx.fillStyle = '#e2ded5';
  ctx.fillRect(40, 0, 24, 1024);
  ctx.fillRect(1024 - 64, 0, 24, 1024);

  // Center dashed dual yellow/white lines
  ctx.fillStyle = '#f5b027'; // Marigold yellow
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(504, y, 16, 72);
  }

  // Occasional worn zebra crossing stripes near edges
  ctx.fillStyle = 'rgba(230, 226, 218, 0.25)';
  for (let x = 80; x < 940; x += 60) {
    ctx.fillRect(x, 480, 36, 120);
  }

  const texture = setupTexture(canvas, 1, 4);
  textureCache.set('road', texture);
  return texture;
}

// 2. Haveli / Rajasthani Heritage Sandstone Facade with Jaali arches
export function getHaveliTexture(variant: 'sandstone' | 'terracotta' | 'blue' = 'sandstone'): THREE.CanvasTexture {
  const key = `haveli_${variant}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const baseColors = {
    sandstone: '#dcb886', // Jaisalmer golden yellow stone
    terracotta: '#c86848', // Jaipur pink terracotta
    blue: '#5b8fa8', // Jodhpur royal indigo blue
  };

  ctx.fillStyle = baseColors[variant];
  ctx.fillRect(0, 0, 1024, 1024);

  // Stone masonry blocks
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.22)';
  ctx.lineWidth = 4;
  const blockH = 64;
  const blockW = 128;
  for (let y = 0; y < 1024; y += blockH) {
    const shift = (Math.floor(y / blockH) % 2) * (blockW / 2);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    for (let x = shift; x < 1024; x += blockW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + blockH);
      ctx.stroke();
    }
  }

  // Draw 2 Carved Jharokha (ornate Indian arched balconies)
  for (const jx of [256, 768]) {
    const jy = 512;
    // Arch frame
    ctx.fillStyle = '#fff4e0';
    ctx.beginPath();
    ctx.arc(jx, jy - 80, 100, Math.PI, 0);
    ctx.lineTo(jx + 100, jy + 140);
    ctx.lineTo(jx - 100, jy + 140);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8d4f24';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Dark interior window
    ctx.fillStyle = '#261b14';
    ctx.beginPath();
    ctx.arc(jx, jy - 70, 75, Math.PI, 0);
    ctx.lineTo(jx + 75, jy + 120);
    ctx.lineTo(jx - 75, jy + 120);
    ctx.closePath();
    ctx.fill();

    // Intricate Jaali (stone latticework screen)
    ctx.strokeStyle = 'rgba(215, 175, 120, 0.7)';
    ctx.lineWidth = 3;
    for (let lx = jx - 70; lx <= jx + 70; lx += 20) {
      ctx.beginPath();
      ctx.moveTo(lx, jy - 60);
      ctx.lineTo(lx, jy + 110);
      ctx.stroke();
    }
    for (let ly = jy - 60; ly <= jy + 110; ly += 20) {
      ctx.beginPath();
      ctx.moveTo(jx - 70, ly);
      ctx.lineTo(jx + 70, ly);
      ctx.stroke();
    }

    // Carved brackets under balcony
    ctx.fillStyle = '#7a3e1b';
    ctx.fillRect(jx - 110, jy + 140, 220, 24);
  }

  // Decorative floral frieze border at top
  ctx.fillStyle = '#b83b1e';
  ctx.fillRect(0, 0, 1024, 48);
  ctx.fillStyle = '#ffcc00';
  for (let x = 20; x < 1024; x += 40) {
    ctx.beginPath();
    ctx.arc(x, 24, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 3. Indian Truck Art Texture (Authentic "HORN OK PLEASE" & Peacock / Floral Motifs)
export function getTruckArtTexture(): THREE.CanvasTexture {
  if (textureCache.has('truck_art')) return textureCache.get('truck_art')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Vivid sunburst yellow & deep crimson backplate
  ctx.fillStyle = '#f1b709';
  ctx.fillRect(0, 0, 1024, 1024);

  // Chevron border in tricolor / psychedelic truck art colors
  const bw = 32;
  for (let y = 0; y < 1024; y += bw * 2) {
    ctx.fillStyle = '#e62419';
    ctx.fillRect(0, y, bw, bw);
    ctx.fillRect(1024 - bw, y, bw, bw);
    ctx.fillStyle = '#06a350';
    ctx.fillRect(0, y + bw, bw, bw);
    ctx.fillRect(1024 - bw, y + bw, bw, bw);
  }

  // Central ornate medallion
  ctx.fillStyle = '#0551a3';
  ctx.beginPath();
  ctx.ellipse(512, 480, 420, 280, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.stroke();

  // "HORN OK PLEASE" Bold hand-painted lettering
  ctx.font = '900 84px "Cinzel", "Impact", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // HORN (Left)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 10;
  ctx.fillText('HORN', 240, 480);

  // OK in center diamond
  ctx.fillStyle = '#ff0037';
  ctx.beginPath();
  ctx.moveTo(512, 380);
  ctx.lineTo(600, 480);
  ctx.lineTo(512, 580);
  ctx.lineTo(424, 480);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px "Cinzel", "Impact", sans-serif';
  ctx.fillText('OK', 512, 480);

  // PLEASE (Right)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 84px "Cinzel", "Impact", sans-serif';
  ctx.fillText('PLEASE', 780, 480);

  // Classic slogan on bottom: "DEKHO MAGAR PYAAR SE"
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#171717';
  ctx.fillRect(80, 800, 864, 120);
  ctx.fillStyle = '#ffe135';
  ctx.font = '800 48px "Cinzel", sans-serif';
  ctx.fillText('DEKHO MAGAR PYAAR SE', 512, 860);

  // Top banner: "ALL INDIA TOURIST PERMIT"
  ctx.fillStyle = '#06a350';
  ctx.fillRect(80, 100, 864, 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px "Cinzel", sans-serif';
  ctx.fillText('★ ALL INDIA PERMIT ★', 512, 145);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set('truck_art', texture);
  return texture;
}

// 4. Roadside Dhaba / Chai Stall Signboard ("SHARMA CHAI & NASHTA")
export function getDhabaSignTexture(): THREE.CanvasTexture {
  if (textureCache.has('dhaba_sign')) return textureCache.get('dhaba_sign')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Weathered wooden / tin painted board
  ctx.fillStyle = '#b72a1e'; // Indian red
  ctx.fillRect(0, 0, 1024, 512);

  // Golden inner border
  ctx.strokeStyle = '#f5c518';
  ctx.lineWidth = 16;
  ctx.strokeRect(20, 20, 984, 472);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px "Yatra One", "Cinzel", sans-serif';
  ctx.fillText('★ SHARMAJI CHAI DHABA ★', 512, 110);

  ctx.fillStyle = '#f5c518';
  ctx.font = '800 46px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SPECIAL CUTTING CHAI & FRESH SAMOSA', 512, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Open 24 Hours • Desi Ghee Jalebi • Pure Veg', 512, 300);

  // Marigold flower icons at corners
  ctx.fillStyle = '#ff8800';
  for (const [x, y] of [[60, 60], [964, 60], [60, 452], [964, 452]]) {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Teapot doodle in center bottom
  ctx.fillStyle = '#f5c518';
  ctx.beginPath();
  ctx.arc(512, 400, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(492, 350, 40, 16);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set('dhaba_sign', texture);
  return texture;
}

// 5. Authentic Indian Rickshaw Mudflap & Rear Slogan ("BURA MAT DEKHO")
export function getRickshawMudflapTexture(): THREE.CanvasTexture {
  if (textureCache.has('rickshaw_mudflap')) return textureCache.get('rickshaw_mudflap')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Black heavy rubber flap
  ctx.fillStyle = '#111215';
  ctx.fillRect(0, 0, 512, 256);

  // White reflective lettering
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Cinzel", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HORN OK PLEASE', 256, 110);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KEEP DISTANCE 10 FT', 256, 170);

  // Red reflectors on both sides
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(20, 80, 30, 90);
  ctx.fillRect(512 - 50, 80, 30, 90);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set('rickshaw_mudflap', texture);
  return texture;
}

// 6. Rickshaw Meter Screen Texture (Classic Indian Fare Meter)
export function getMeterScreenTexture(fare: number, hired: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Retro brushed silver & black metal box
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 120);

  // Status banner: FOR HIRE (Green) or HIRED (Red)
  ctx.fillStyle = hired ? '#ef4444' : '#10b981';
  ctx.fillRect(12, 12, 232, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hired ? '● HIRED (METER DOWN)' : '○ FOR HIRE (VACANT)', 128, 32);

  // Digital LED Fare Readout
  ctx.fillStyle = '#fbbf24'; // Amber seven-segment LED
  ctx.font = '900 38px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`₹ ${fare.toFixed(0)}.00`, 128, 86);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SPEED FARE / MIN', 128, 112);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 7. Sacred Rangoli Sidewalk Decal
export function getRangoliTexture(): THREE.CanvasTexture {
  if (textureCache.has('rangoli')) return textureCache.get('rangoli')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;

  // Concentric colored rings: Turmeric yellow, vermilion red, sacred white
  const colors = ['#dc2626', '#f59e0b', '#ffffff', '#ec4899', '#3b82f6'];
  for (let r = 240; r > 20; r -= 40) {
    ctx.strokeStyle = colors[(r / 40) % colors.length];
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 8-petal Lotus flower in center
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(0, 80, 24, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  // Golden Diya flame in absolute center
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set('rangoli', texture);
  return texture;
}
