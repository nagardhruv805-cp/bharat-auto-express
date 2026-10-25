import { DriverProfile } from './auth';
import { RICKSHAW_LIVERIES } from './multiplayer';

export interface ScorecardData {
  profile: DriverProfile | null;
  earnings: number;
  distanceKm: number;
  topSpeedKmh: number;
  chaiCount: number;
  passengersServed: number;
  rank: number;
  category?: string;
  gameCanvas?: HTMLCanvasElement | null;
}

export async function generateScorecardCanvas(data: ScorecardData): Promise<{ dataUrl: string; blob: Blob | null }> {
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. Base Gradient Background (Deep Slate/Zinc)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#09090b');
  bgGrad.addColorStop(0.4, '#121217');
  bgGrad.addColorStop(1, '#050507');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw 3D Game Snapshot if available (Upper half with cinematic dark gradient blend)
  if (data.gameCanvas && data.gameCanvas.width > 0 && data.gameCanvas.height > 0) {
    try {
      ctx.save();
      ctx.globalAlpha = 0.42;
      // Draw centered cropped snapshot in top 550px
      const gw = data.gameCanvas.width;
      const gh = data.gameCanvas.height;
      const targetH = 580;
      ctx.drawImage(data.gameCanvas, 0, 0, gw, gh, 0, 0, width, targetH);
      ctx.restore();

      // Soft vignette fade overlay on the snapshot
      const snapFade = ctx.createLinearGradient(0, 0, 0, targetH + 60);
      snapFade.addColorStop(0, 'rgba(9, 9, 11, 0.2)');
      snapFade.addColorStop(0.7, 'rgba(9, 9, 11, 0.7)');
      snapFade.addColorStop(1, '#09090b');
      ctx.fillStyle = snapFade;
      ctx.fillRect(0, 0, width, targetH + 80);
    } catch {
      // Ignore cross-origin or canvas read errors
    }
  }

  // 3. Indian Truck-Art Style Borders & Corner Ornaments
  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 44, width - 88, height - 88);

  // Corner floral accents
  const drawCorner = (cx: number, cy: number) => {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  drawCorner(36, 36);
  drawCorner(width - 36, 36);
  drawCorner(36, height - 36);
  drawCorner(width - 36, height - 36);
  ctx.restore();

  // 4. Tricolor Top Header Ribbon (Saffron, White, Green)
  const ribY = 48;
  const ribH = 10;
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(48, ribY, (width - 96) / 3, ribH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(48 + (width - 96) / 3, ribY, (width - 96) / 3, ribH);
  ctx.fillStyle = '#138808';
  ctx.fillRect(48 + ((width - 96) / 3) * 2, ribY, (width - 96) / 3, ribH);

  // 5. Official RTO Authority Banner
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('अखिल भारतीय चालक महासंघ • ALL-INDIA HIGHWAY AUTHORITY', width / 2, 92);

  // Main Game Brand Logo
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('BHARAT AUTO EXPRESS', width / 2, 146);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText('NH-48 GOLDEN QUADRILATERAL • 5G HIGHWAY DRIVER PASS', width / 2, 178);

  // Decorative divider
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 196);
  ctx.lineTo(width - 120, 196);
  ctx.stroke();

  // 6. Driver Profile & Rank Card Section
  const cardY = 216;
  const cardH = 210;
  ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(68, cardY, width - 136, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // Driver Avatar Icon
  const avatarBg = ctx.createLinearGradient(96, cardY + 28, 96, cardY + 156);
  avatarBg.addColorStop(0, '#78350f');
  avatarBg.addColorStop(1, '#1c1917');
  ctx.fillStyle = avatarBg;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(96, cardY + 28, 150, 154, 20);
  ctx.fill();
  ctx.stroke();

  ctx.font = '72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.profile?.avatarIcon || '🛺', 171, cardY + 128);

  // Driver Name & License Details
  const driverName = data.profile?.name || 'Ustaad Highway Driver';
  const licenseNo = data.profile?.licenseNumber || 'DL-01-2025-00482';
  const city = data.profile?.city || 'Delhi NCR Highway Zone';
  const isGuest = data.profile?.isGuest ?? true;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px sans-serif';
  ctx.fillText(driverName, 276, cardY + 68);

  // Verified / Guest Tag
  ctx.fillStyle = isGuest ? 'rgba(82, 82, 91, 0.9)' : 'rgba(16, 185, 129, 0.25)';
  ctx.strokeStyle = isGuest ? '#71717a' : '#10b981';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(276, cardY + 86, isGuest ? 130 : 210, 30, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isGuest ? '#d4d4d8' : '#34d399';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(isGuest ? 'GUEST PERMIT' : '⭐ VERIFIED DRIVER', 288, cardY + 106);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`PERMIT: ${licenseNo}`, 276, cardY + 144);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '18px sans-serif';
  ctx.fillText(`RTO ZONE: ${city}`, 276, cardY + 172);

  // Rank Badge (Right Side of Card)
  const rankX = width - 210;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText('ALL-INDIA RANK', rankX, cardY + 54);

  // Huge Rank Number in Gold
  ctx.fillStyle = '#facc15';
  ctx.font = '900 68px monospace';
  ctx.fillText(`#${data.rank > 0 ? data.rank : 1}`, rankX, cardY + 128);

  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('🏆 TOP USTAAD', rankX, cardY + 164);

  // 7. Hero Metric: Lifetime & Shift Fares Collected
  const fareY = 452;
  const fareH = 140;
  const fareGrad = ctx.createLinearGradient(68, fareY, width - 68, fareY + fareH);
  fareGrad.addColorStop(0, '#1c1917');
  fareGrad.addColorStop(0.5, '#2e1065');
  fareGrad.addColorStop(1, '#1c1917');
  ctx.fillStyle = fareGrad;
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(68, fareY, width - 136, fareH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 18px monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText('💰 MAHA-LAKSHMI TOTAL FARES COLLECTED 💰', width / 2, fareY + 40);

  ctx.fillStyle = '#4ade80';
  ctx.font = '900 64px monospace';
  ctx.fillText(`₹ ${data.earnings.toLocaleString('en-IN')}`, width / 2, fareY + 104);

  // 8. Stats Grid: 4 Prominent Stat Badges
  const gridY = 618;
  const boxW = (width - 136 - 24) / 2;
  const boxH = 150;

  const statBoxes = [
    {
      title: '🛣️ HIGHWAY YATRA',
      value: `${data.distanceKm.toFixed(1)} km`,
      sub: 'NH-48 Distance Covered',
      borderColor: '#38bdf8',
      textColor: '#38bdf8',
    },
    {
      title: '⚡ TOP RAFTAAR SPEED',
      value: `${Math.round(data.topSpeedKmh)} km/h`,
      sub: 'Peak Highway Velocity',
      borderColor: '#f59e0b',
      textColor: '#fbbf24',
    },
    {
      title: '☕ KADAK CUTTING CHAI',
      value: `${data.chaiCount} Cups`,
      sub: 'Roadside Tapri Refuels',
      borderColor: '#fb923c',
      textColor: '#fdba74',
    },
    {
      title: '🛺 PASSENGERS SERVED',
      value: `${data.passengersServed} Trips`,
      sub: 'Verified Drop-Offs',
      borderColor: '#4ade80',
      textColor: '#86efac',
    },
  ];

  statBoxes.forEach((box, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = 68 + col * (boxW + 24);
    const by = gridY + row * (boxH + 20);

    ctx.fillStyle = 'rgba(24, 24, 27, 0.95)';
    ctx.strokeStyle = box.borderColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(box.title, bx + 24, by + 36);

    ctx.fillStyle = box.textColor;
    ctx.font = '900 42px monospace';
    ctx.fillText(box.value, bx + 24, by + 88);

    ctx.fillStyle = '#71717a';
    ctx.font = '14px sans-serif';
    ctx.fillText(box.sub, bx + 24, by + 120);
  });

  // 9. Auto-Rickshaw Paint Livery & Driver Rating Section
  const liveryY = 964;
  const liveryH = 110;
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(68, liveryY, width - 136, liveryH, 18);
  ctx.fill();
  ctx.stroke();

  const chosenLivery =
    RICKSHAW_LIVERIES.find((l) => l.id === data.profile?.liveryId) || RICKSHAW_LIVERIES[0];

  // Draw livery color swatch circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(126, liveryY + 55, 30, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = `#${chosenLivery.hoodHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(96, liveryY + 25, 60, 30);
  ctx.fillStyle = `#${chosenLivery.bodyHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(96, liveryY + 55, 60, 30);
  ctx.restore();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(126, liveryY + 55, 30, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`VEHICLE: ${chosenLivery.name}`, 176, liveryY + 50);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Class: 3W-AUTO-CNG • City: ${chosenLivery.city}`, 176, liveryY + 80);

  // Driver Stars Rating (Right)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('⭐⭐⭐⭐⭐ 4.9', width - 96, liveryY + 52);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px monospace';
  ctx.fillText('SAFETY RATING', width - 96, liveryY + 80);

  // 10. Classic Truck-Art Slogan Banner
  const sloganY = 1100;
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(140, sloganY, width - 280, 56, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#18181b';
  ctx.font = '900 22px sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('🎺 HORN OK PLEASE • BURI NAZAR WALE TERA MOOH KALA 🧿', width / 2, sloganY + 36);

  // 11. Official Stamp & Verified Hologram Seal
  ctx.save();
  ctx.translate(width - 180, 1220);
  ctx.rotate(-0.12);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BHARAT RTO', 0, -20);
  ctx.font = '900 16px sans-serif';
  ctx.fillText('VERIFIED', 0, 4);
  ctx.font = 'bold 11px monospace';
  ctx.fillText('5G FLEET', 0, 26);
  ctx.restore();

  // 12. Bottom Footer & Timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#71717a';
  ctx.font = '15px monospace';
  ctx.fillText(`ISSUED: ${dateStr} • ${timeStr} IST`, 68, 1210);
  ctx.fillText('PLAY BHARAT AUTO EXPRESS 5G • OPPO F27 HIGHWAY SIMULATOR', 68, 1238);

  ctx.fillStyle = '#52525b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Real-Physics Three.js Engine • Multi-Driver Highway Simulator', 68, 1264);

  // Convert to DataURL and Blob
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));

  return { dataUrl, blob };
}
