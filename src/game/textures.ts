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

// 8. Soft Radial Contact Shadow Texture (prevents vehicles from looking floaty)
export function getContactShadowTexture(): THREE.CanvasTexture {
  if (textureCache.has('contact_shadow')) return textureCache.get('contact_shadow')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(5, 5, 5, 0.75)');
  grad.addColorStop(0.35, 'rgba(10, 10, 10, 0.55)');
  grad.addColorStop(0.7, 'rgba(20, 20, 20, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('contact_shadow', texture);
  return texture;
}

// 9. Indian Yellow & Black Hazard Speed Breaker Stripe Texture
export function getSpeedBreakerTexture(): THREE.CanvasTexture {
  if (textureCache.has('speed_breaker')) return textureCache.get('speed_breaker')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Alternating high-vis Indian highway chevron stripes
  const stripeW = 32;
  for (let x = 0; x < 512; x += stripeW * 2) {
    ctx.fillStyle = '#f59e0b'; // Amber highway yellow
    ctx.fillRect(x, 0, stripeW, 128);
    ctx.fillStyle = '#18181b'; // Tar black
    ctx.fillRect(x + stripeW, 0, stripeW, 128);
  }

  // Weathering and tyre scuff marks
  ctx.fillStyle = 'rgba(20, 20, 20, 0.3)';
  for (let s = 0; s < 12; s++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 128, 40 + Math.random() * 60, 4);
  }

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set('speed_breaker', texture);
  return texture;
}

// 10. Authentic Indian Vehicle Number Plate ("IND • DL 1R TA 4092")
export function getLicensePlateTexture(regNumber = 'DL 1R TA 4092'): THREE.CanvasTexture {
  const key = `plate_${regNumber}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // White reflective background with black border
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 60);

  // Left Blue IND strip with Chakra symbol
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(4, 4, 28, 56);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IND', 18, 48);

  // Ashoka Chakra circle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(18, 22, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Registration Number Text (embossed Indian RTO font)
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(regNumber, 145, 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

// 11. Authentic Circular Indian Auto Speedometer Dial (Bajaj RE 0-100 km/h)
export function getSpeedometerDialTexture(): THREE.CanvasTexture {
  if (textureCache.has('speedometer_dial')) return textureCache.get('speedometer_dial')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const radius = 230;

  // Dark charcoal gauge face with brass bezel ring
  ctx.fillStyle = '#121316';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Outer brass ring
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Chrome inner ring
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 16, 0, Math.PI * 2);
  ctx.stroke();

  // Green economy speed arc (30 to 50 km/h)
  const startAng = Math.PI * 0.75;
  const totalSweep = Math.PI * 1.5;
  const ecoStart = startAng + (30 / 100) * totalSweep;
  const ecoEnd = startAng + (55 / 100) * totalSweep;

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 35, ecoStart, ecoEnd);
  ctx.stroke();

  // Tick marks (0 to 100 km/h)
  for (let s = 0; s <= 100; s += 10) {
    const angle = startAng + (s / 100) * totalSweep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const r1 = radius - 24;
    const r2 = radius - (s % 20 === 0 ? 52 : 38);

    ctx.strokeStyle = s > 65 ? '#ef4444' : '#ffffff';
    ctx.lineWidth = s % 20 === 0 ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(cx + cos * r1, cy + sin * r1);
    ctx.lineTo(cx + cos * r2, cy + sin * r2);
    ctx.stroke();

    if (s % 20 === 0) {
      const textR = radius - 76;
      ctx.fillStyle = s > 65 ? '#ef4444' : '#ffffff';
      ctx.font = '900 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${s}`, cx + cos * textR, cy + sin * textR);
    }
  }

  // Central Branding & Odometer Box
  ctx.fillStyle = '#f59e0b';
  ctx.font = '900 22px "Cinzel", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BAJAJ AUTO', cx, cy - 70);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px monospace';
  ctx.fillText('KM / H', cx, cy + 60);

  // Mechanical 5-digit Odometer window
  ctx.fillStyle = '#050505';
  ctx.fillRect(cx - 70, cy - 25, 140, 36);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 70, cy - 25, 140, 36);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 24px monospace';
  ctx.letterSpacing = '6px';
  ctx.fillText('04829', cx, cy - 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('speedometer_dial', texture);
  return texture;
}

// 12. Realistic Twin Tire Skid Mark Texture
export function getSkidMarkTexture(): THREE.CanvasTexture {
  if (textureCache.has('skid_mark')) return textureCache.get('skid_mark')!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 512);

  // Twin tire dark rubber rubber marks with tread grain
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(10, 10, 12, 0)');
  grad.addColorStop(0.15, 'rgba(15, 15, 18, 0.7)');
  grad.addColorStop(0.85, 'rgba(15, 15, 18, 0.7)');
  grad.addColorStop(1, 'rgba(10, 10, 12, 0)');

  ctx.fillStyle = grad;
  // Left tire track
  ctx.fillRect(20, 0, 28, 512);
  // Right tire track
  ctx.fillRect(80, 0, 28, 512);

  // Add rubber grain
  ctx.fillStyle = 'rgba(5, 5, 6, 0.3)';
  for (let y = 0; y < 512; y += 8) {
    ctx.fillRect(22, y, 24, 3);
    ctx.fillRect(82, y, 24, 3);
  }

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set('skid_mark', texture);
  return texture;
}

// 13. Indian Highway Warning & Slogan Signboards
export function getHighwaySignTexture(type: 'speed_breaker' | 'cows' | 'accident' | 'horn'): THREE.CanvasTexture {
  const key = `hway_sign_${type}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (type === 'speed_breaker') {
    // Yellow highway diamond warning sign
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 16;
    ctx.strokeRect(16, 16, 480, 480);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = '900 48px "Cinzel", sans-serif';
    ctx.fillText('SPEED BREAKER', 256, 130);
    ctx.fillText('AHEAD', 256, 190);

    // Bump silhouette icon
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(256, 310, 140, 50, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(80, 310, 352, 16);

    ctx.font = '800 32px sans-serif';
    ctx.fillText('गति अवरोधक', 256, 420);
  } else if (type === 'cows') {
    // Caution Cattle Crossing
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 16;
    ctx.strokeRect(16, 16, 480, 480);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = '900 44px "Cinzel", sans-serif';
    ctx.fillText('CAUTION: COWS', 256, 130);
    ctx.fillText('CROSSING', 256, 190);

    ctx.font = '800 38px sans-serif';
    ctx.fillText('गौ माता सम्मान', 256, 320);
    ctx.font = '700 32px sans-serif';
    ctx.fillText('DRIVE SLOWLY', 256, 400);
  } else if (type === 'accident') {
    // Red border white sign
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 28;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.font = '900 52px "Cinzel", sans-serif';
    ctx.fillText('GO SLOW', 256, 150);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 38px "Cinzel", sans-serif';
    ctx.fillText('ACCIDENT PRONE', 256, 240);
    ctx.fillText('ZONE', 256, 300);

    ctx.fillStyle = '#16a34a';
    ctx.font = '800 32px sans-serif';
    ctx.fillText('★ DRIVE SAFE ★', 256, 400);
  } else {
    // Sound Horn / Use Dipper At Night
    ctx.fillStyle = '#0284c7'; // Blue Indian highway circular sign
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.strokeRect(16, 16, 480, 480);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 44px "Cinzel", sans-serif';
    ctx.fillText('USE DIPPER', 256, 160);
    ctx.fillText('AT NIGHT', 256, 230);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 36px "Cinzel", sans-serif';
    ctx.fillText('रात्रौ डिपर का प्रयोग करें', 256, 330);
    ctx.font = '700 30px sans-serif';
    ctx.fillText('SOUND HORN ON TURNS', 256, 410);
  }

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 15. Handlebar Mounted In-Game Smartphone Screen Texture (OPPO F27 5G)
export function getMountedPhoneScreenTexture(): THREE.CanvasTexture {
  const key = 'mounted_phone_screen_oppo_f27';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background - Dark GPS navigation night mode
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 256, 512);

  // Road grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Cyan glowing GPS navigation route line
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 500);
  ctx.lineTo(128, 220);
  ctx.bezierCurveTo(128, 160, 160, 130, 200, 100);
  ctx.stroke();

  // Green user auto arrow
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(128, 380);
  ctx.lineTo(116, 415);
  ctx.lineTo(128, 404);
  ctx.lineTo(140, 415);
  ctx.closePath();
  ctx.fill();

  // Top Status Bar (ColorOS 14 / Oppo F27 5G)
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 256, 44);

  // Central punch hole camera indicator
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(128, 14, 6, 0, Math.PI * 2);
  ctx.fill();

  // Network & Battery status
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Jio 5G', 10, 22);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('94% ⚡', 246, 22);

  // OPPO F27 5G Dynamic Aqua Island / Halo Light Banner
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.roundRect(8, 48, 240, 72, 14);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glowing Halo Ring emblem
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(38, 84, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#d97706';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛺', 38, 89);

  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('OPPO F27 5G', 66, 75);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px sans-serif';
  ctx.fillText('ColorOS • Desi Virtual Call', 66, 94);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '9px sans-serif';
  ctx.fillText('BeaconLink Ready • 300% Vol', 66, 108);

  // Bottom prompt card
  ctx.fillStyle = '#022c22';
  ctx.beginPath();
  ctx.roundRect(8, 436, 240, 64, 14);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('📞 PRESS [ P ] TO CALL', 128, 464);
  ctx.fillStyle = '#a7f3d0';
  ctx.font = '10px sans-serif';
  ctx.fillText('Maa • Mechanic • Police • Anyone', 128, 484);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 16. Desi Agricultural Tractor Trolley / Sugarcane Trailer Slogan Texture
export function getTractorTrolleyTexture(): THREE.CanvasTexture {
  const key = 'tractor_trolley_texture';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep forest green / dark blue wooden slat body
  ctx.fillStyle = '#166534';
  ctx.fillRect(0, 0, 512, 256);

  // Horizontal wood plank grooves
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 4;
  for (let y = 0; y < 256; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Yellow and red diagonal hazard stripes at base
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 220, 512, 36);
  ctx.fillStyle = '#dc2626';
  for (let x = -50; x < 550; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.lineTo(x + 20, 256);
    ctx.lineTo(x + 40, 220);
    ctx.lineTo(x + 20, 220);
    ctx.closePath();
    ctx.fill();
  }

  // Patriotic Indian Farmer Slogan ("JAI JAWAN JAI KISAN • KISAN EXPRESS")
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 34px "Cinzel", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText('जय जवान जय किसान', 256, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('KISAN POWER • NH-48', 256, 130);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('KEEP DISTANCE • 20 KM/H MAX', 256, 175);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 17. Rival Auto-Rickshaw Mudflap & Slogan Texture
export function getRivalAutoMudflapTexture(variant: 'mumbai' | 'delhi' | 'bangalore' = 'mumbai'): THREE.CanvasTexture {
  const key = `rival_mudflap_${variant}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 116);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('बुरी नज़र वाले', 128, 42);

  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('तेरा मुँह काला 😈', 128, 72);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  const plates = {
    mumbai: 'MH-02-AK-4200',
    delhi: 'DL-1R-TUK-99',
    bangalore: 'KA-01-EXP-786',
  };
  ctx.fillText(plates[variant], 128, 104);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 18. Indian State Transport Bus Destination Board ("LAL DIBBA EXPRESS")
export function getBusRouteBoardTexture(): THREE.CanvasTexture {
  const key = 'bus_route_board';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#fef08a';
  ctx.font = '900 32px "Cinzel", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('महाराष्ट्र राज्य मार्ग परिवहन', 256, 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('MUMBAI ➔ PUNE EXPRESS', 256, 85);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('SPEED 50 KM/H • SOUND HORN', 256, 112);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 19. Cycle Rickshaw Decorative Canopy Texture (Vibrant Indian floral vinyl)
export function getCycleRickshawHoodTexture(): THREE.CanvasTexture {
  const key = 'cycle_rickshaw_hood';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Crimson red base
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 256, 256);

  // Marigold yellow & emerald geometric floral bands
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 30, 256, 24);
  ctx.fillRect(0, 202, 256, 24);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, 54, 256, 12);
  ctx.fillRect(0, 190, 256, 12);

  // Rangoli lotus center medallion
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(128, 128, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(128, 128, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SHREE', 128, 132);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}

// 24. Digital Dhaba Tabletop QR Standee Texture (Authentic Indian UPI / Rewards QR)
export function getDhabaQrStandTexture(codeText: string = 'SHARMA-CHAI-99'): THREE.CanvasTexture {
  const key = `dhaba_qr_${codeText}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Acrylic Standee Dark Slate / Blue Gradient Frame
  const grad = ctx.createLinearGradient(0, 0, 0, 768);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  // Vivid Orange & Emerald Accent Header Bands
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(16, 16, 480, 12);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(16, 32, 480, 6);

  // Top Title: DIGITAL DHABA REWARDS
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('⚡ DIGITAL DHABA 5G 🛺', 256, 80);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('SCAN ON PHONE FOR REWARDS', 256, 115);

  // White Background Card for High-Contrast QR Code
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(40, 140, 432, 432, 24);
  ctx.fill();

  // Draw Procedural QR Pattern
  const qrX = 66;
  const qrY = 166;
  const qrSize = 380;
  const modules = 25;
  const modSize = qrSize / modules;

  // Background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);

  // Helper to draw QR finder square (7x7)
  const drawFinder = (cx: number, cy: number) => {
    // Outer black square 7x7
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx, cy, modSize * 7, modSize * 7);
    // Inner white square 5x5
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + modSize, cy + modSize, modSize * 5, modSize * 5);
    // Core black square 3x3
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx + modSize * 2, cy + modSize * 2, modSize * 3, modSize * 3);
  };

  // 3 Finder patterns
  drawFinder(qrX, qrY); // Top-left
  drawFinder(qrX + modSize * (modules - 7), qrY); // Top-right
  drawFinder(qrX, qrY + modSize * (modules - 7)); // Bottom-left

  // Timing patterns
  ctx.fillStyle = '#000000';
  for (let i = 8; i < modules - 8; i += 2) {
    ctx.fillRect(qrX + i * modSize, qrY + 6 * modSize, modSize, modSize);
    ctx.fillRect(qrX + 6 * modSize, qrY + i * modSize, modSize, modSize);
  }

  // Deterministic data modules based on codeText hash
  let hash = 0;
  for (let i = 0; i < codeText.length; i++) {
    hash = (hash << 5) - hash + codeText.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder zones
      if (r < 7 && c < 7) continue;
      if (r < 7 && c >= modules - 7) continue;
      if (r >= modules - 7 && c < 7) continue;
      if (r === 6 || c === 6) continue;

      const seed = Math.sin(r * 31 + c * 17 + hash) * 10000;
      if (seed - Math.floor(seed) > 0.48) {
        ctx.fillRect(qrX + c * modSize, qrY + r * modSize, modSize - 0.5, modSize - 0.5);
      }
    }
  }

  // Center Desi Emblem in QR
  const centerSize = modSize * 5;
  const centerX = qrX + (qrSize - centerSize) / 2;
  const centerY = qrY + (qrSize - centerSize) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(centerX - 4, centerY - 4, centerSize + 8, centerSize + 8, 8);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(centerX + centerSize / 2, centerY + centerSize / 2, centerSize / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('☕', centerX + centerSize / 2, centerY + centerSize / 2 + 8);

  // Bottom text badge
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(40, 590, 432, 130, 16);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(codeText, 256, 630);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px monospace';
  ctx.fillText('DESI-PAY UPI: dhaba@airjio', 256, 665);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('★ FREE CUTTING CHAI & COIN REWARDS ★', 256, 695);

  const texture = setupTexture(canvas, 1, 1);
  textureCache.set(key, texture);
  return texture;
}



