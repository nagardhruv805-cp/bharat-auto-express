export interface PhoneViewCaptureData {
  subTab: 'search' | 'weather' | 'rates' | 'speedtest' | 'ai' | 'scanner' | 'radio';
  effectiveOnline: boolean;
  isOfflineMode: boolean;
  qrScanTargetName?: string;
  qrScannedCouponsCount?: number;
  radioStation?: {
    name: string;
    frequency: string;
    genre: string;
    djName?: string;
    trackName?: string;
    tagline?: string;
    color?: string;
  } | null;
  searchQuery?: string;
  searchResult?: {
    title: string;
    extract: string;
    description?: string;
  } | null;
  selectedCity?: {
    city: string;
    state: string;
  };
  weatherData?: {
    temp: number;
    humidity: number;
    wind: number;
    conditionText: string;
    conditionIcon: string;
  } | null;
  speedMbps?: number | null;
  pingMs?: number | null;
  speedTestHistory?: Array<{
    id: string;
    speedMbps: number;
    pingMs: number;
    timestamp: string;
  }>;
  inrRates?: {
    USD: number;
    EUR: number;
    GBP: number;
    AED: number;
    CAD: number;
    updatedAt: string;
  } | null;
  fareKm?: string;
  fareResult?: { day: number; night: number };
  aiPersona?: string;
  lastAiMessage?: string;
  offlineWisdom?: string;
}

export async function capturePhoneInternetViewToCanvas(
  data: PhoneViewCaptureData
): Promise<{ canvas: HTMLCanvasElement; blob: Blob; dataUrl: string }> {
  const width = 720;
  const height = 1280;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. Base Gradient Background (Deep Slate/Zinc)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#09090b');
  bgGrad.addColorStop(0.5, '#121217');
  bgGrad.addColorStop(1, '#050507');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // 2. ColorOS 14 Phone Top Status Bar
  // Punch-hole camera
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(width / 2, 28, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Current Time
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(timeStr, 36, 36);

  // Status Icons (Right)
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = data.effectiveOnline ? '#22d3ee' : '#f43f5e';
  ctx.fillText(data.effectiveOnline ? '5G+ VoNR' : 'NO SERVICE', width - 110, 35);

  ctx.fillStyle = '#10b981';
  ctx.fillText('92% ⚡', width - 36, 35);

  // 3. Browser Omnibar Header
  const barY = 64;
  const barH = 58;
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(24, barY, width - 48, barH, 16);
  ctx.fill();
  ctx.stroke();

  // SSL Lock & URL
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  const urlText = data.effectiveOnline
    ? `🔒 https://desinet.in/${data.subTab}`
    : '⚠️ https://desinet.in/offline-mode';
  ctx.fillText(urlText, 40, barY + 36);

  // Connection indicator badge
  ctx.textAlign = 'right';
  ctx.fillStyle = data.effectiveOnline ? '#34d399' : '#f87171';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(data.effectiveOnline ? '● 5G ONLINE' : '● OFFLINE', width - 40, barY + 36);

  // Sub-status bar: AirJio Network info
  const subBarY = barY + barH + 12;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    data.effectiveOnline
      ? '📶 AirJio 5G+ VoNR • NH-48 Highway Gateway (100% Signal)'
      : '⚠️ Highway Blindspot • Simulated Offline Wisdom Active',
    32,
    subBarY
  );

  // 4. Sub-Navigation Tabs Bar
  const tabY = subBarY + 16;
  const tabH = 50;
  ctx.fillStyle = '#18181b';
  ctx.fillRect(24, tabY, width - 48, tabH);
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, tabY, width - 48, tabH);

  const tabs: Array<{ id: PhoneViewCaptureData['subTab']; label: string }> = [
    { id: 'radio', label: '📻 Radio' },
    { id: 'search', label: 'Wiki Web' },
    { id: 'weather', label: 'Weather' },
    { id: 'rates', label: 'Rates' },
    { id: 'speedtest', label: 'Speed 5G' },
    { id: 'ai', label: 'AI Sahayak' },
  ];

  const tabWidth = (width - 48) / tabs.length;
  tabs.forEach((tab, idx) => {
    const tx = 24 + idx * tabWidth;
    const isActive = data.subTab === tab.id;

    if (isActive) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(tx, tabY, tabWidth, tabH);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(tx, tabY + tabH - 4, tabWidth, 4);
    }

    ctx.textAlign = 'center';
    ctx.font = isActive ? 'bold 15px sans-serif' : '14px sans-serif';
    ctx.fillStyle = isActive ? '#fbbf24' : '#71717a';
    ctx.fillText(tab.label, tx + tabWidth / 2, tabY + 31);
  });

  // 5. Main Content Area Rendering Based on Active Tab
  const contentY = tabY + tabH + 20;
  const contentW = width - 48;

  // Background content container
  ctx.fillStyle = 'rgba(24, 24, 27, 0.7)';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(24, contentY, contentW, 900, 24);
  ctx.fill();
  ctx.stroke();

  // If in Offline Mode
  if (data.isOfflineMode) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, contentY + 20, contentW - 40, 140, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fb7185';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('⚠️ HIGHWAY NETWORK BLINDSPOT', width / 2, contentY + 60);

    ctx.fillStyle = '#fecdd3';
    ctx.font = '16px sans-serif';
    ctx.fillText('Offline mode simulated. Desi highway wisdom enabled!', width / 2, contentY + 95);

    ctx.fillStyle = '#fda4af';
    ctx.font = 'italic 16px sans-serif';
    const quote = data.offlineWisdom || '“Meter gira do, gaadi hai chalana! No 5G? No tension!” 🛺';
    ctx.fillText(quote, width / 2, contentY + 130);
  }

  // --- TAB 1: SPEEDTEST ---
  if (data.subTab === 'speedtest') {
    const startY = data.isOfflineMode ? contentY + 180 : contentY + 30;

    // Header Badge
    ctx.textAlign = 'center';
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('⚡ AIRJIO 5G ULTRA-WIDEBAND SPEEDTEST ⚡', width / 2, startY + 20);

    // Speedometer Dial Circle
    const dialY = startY + 160;
    const radius = 110;

    // Outer track arc
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(width / 2, dialY, radius, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();

    // Progress arc in cyan/emerald
    const speed = data.speedMbps ?? 128;
    const progress = Math.min(1, speed / 300);
    const endAngle = Math.PI * 0.8 + progress * (Math.PI * 1.4);
    const grad = ctx.createLinearGradient(width / 2 - radius, dialY, width / 2 + radius, dialY);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(1, '#10b981');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(width / 2, dialY, radius, Math.PI * 0.8, endAngle);
    ctx.stroke();

    // Giant Speed Number
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px monospace';
    ctx.fillText(`${Math.round(speed)}`, width / 2, dialY + 15);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('Mbps (5G DL)', width / 2, dialY + 48);

    // Metrics Pill Row
    const metricsY = dialY + 130;
    const ping = data.pingMs ?? 18;
    const statCards = [
      { label: 'PING LATENCY', val: `${ping} ms`, color: '#34d399' },
      { label: 'JITTER', val: '2 ms', color: '#38bdf8' },
      { label: 'BAND FREQ', val: 'n78 3.5GHz', color: '#fbbf24' },
    ];

    const cardW = (contentW - 60) / 3;
    statCards.forEach((c, i) => {
      const cx = 44 + i * (cardW + 10);
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx, metricsY, cardW, 80, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(c.label, cx + cardW / 2, metricsY + 30);

      ctx.fillStyle = c.color;
      ctx.font = '900 20px monospace';
      ctx.fillText(c.val, cx + cardW / 2, metricsY + 62);
    });

    // Recent 5G Test History Box
    const histY = metricsY + 105;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(44, histY, contentW - 40, 280, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('📋 RECENT 5G NETWORK TESTS (STORED)', 64, histY + 36);

    const records = data.speedTestHistory?.slice(0, 5) || [
      { id: '1', speedMbps: 128, pingMs: 18, timestamp: '11:42 AM' },
      { id: '2', speedMbps: 95, pingMs: 24, timestamp: '11:28 AM' },
      { id: '3', speedMbps: 142, pingMs: 15, timestamp: '11:05 AM' },
    ];

    records.forEach((rec, idx) => {
      const ry = histY + 70 + idx * 42;
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(39, 39, 42, 0.4)' : 'transparent';
      ctx.fillRect(54, ry - 22, contentW - 60, 36);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e4e4e7';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`Test #${records.length - idx} • ${rec.timestamp}`, 68, ry);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#34d399';
      ctx.font = '900 16px monospace';
      ctx.fillText(`${rec.speedMbps} Mbps`, width - 150, ry);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.fillText(`${rec.pingMs}ms`, width - 70, ry);
    });
  }

  // --- TAB 2: WEATHER ---
  else if (data.subTab === 'weather') {
    const startY = data.isOfflineMode ? contentY + 180 : contentY + 30;

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('🛰️ SATELLITE METEOROLOGICAL RADAR', width / 2, startY + 20);

    // City & Weather Card
    const cardY = startY + 45;
    const cardH = 240;
    const wGrad = ctx.createLinearGradient(44, cardY, width - 44, cardY + cardH);
    wGrad.addColorStop(0, '#0c4a6e');
    wGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = wGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(44, cardY, contentW - 40, cardH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px sans-serif';
    ctx.fillText(data.selectedCity?.city || 'Delhi NCR', 74, cardY + 54);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Highway Route Zone: ${data.selectedCity?.state || 'Northern India'}`, 74, cardY + 84);

    // Huge Temp
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 76px sans-serif';
    ctx.fillText(`${data.weatherData?.temp ?? 32}°C`, 74, cardY + 175);

    // Weather Condition Icon
    ctx.textAlign = 'right';
    ctx.font = '72px sans-serif';
    ctx.fillText(data.weatherData?.conditionIcon ?? '☀️', width - 80, cardY + 115);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(data.weatherData?.conditionText ?? 'Clear Skies', width - 80, cardY + 160);

    // Metrics bottom strip
    const stripY = cardY + cardH + 18;
    const stripW = (contentW - 50) / 2;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(44, stripY, stripW, 80, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('HUMIDITY', 64, stripY + 30);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 24px monospace';
    ctx.fillText(`${data.weatherData?.humidity ?? 55}%`, 64, stripY + 62);

    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(44 + stripW + 10, stripY, stripW, 80, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('WIND SPEED', 64 + stripW + 10, stripY + 30);
    ctx.fillStyle = '#34d399';
    ctx.font = '900 24px monospace';
    ctx.fillText(`${data.weatherData?.wind ?? 14} km/h`, 64 + stripW + 10, stripY + 62);

    // Indian Cities Grid
    const listY = stripY + 105;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(44, listY, contentW - 40, 270, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('📍 ALL-INDIA HIGHWAY CITY RADAR', 64, listY + 34);

    const cities = ['Mumbai (30°C 🌧️)', 'Bengaluru (26°C ⛅)', 'Jaipur (34°C ☀️)', 'Goa (29°C 🌴)', 'Kolkata (31°C ⛅)'];
    cities.forEach((c, idx) => {
      const cy = listY + 68 + idx * 40;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`• ${c}`, 68, cy);
    });
  }

  // --- TAB 3: WIKI WEB SEARCH ---
  else if (data.subTab === 'search') {
    const startY = data.isOfflineMode ? contentY + 180 : contentY + 30;

    // Search query box
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, startY, contentW - 40, 64, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`🔍 "${data.searchQuery || 'Auto rickshaw'}"`, 64, startY + 40);

    // Article Card
    const artY = startY + 84;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, artY, contentW - 40, 480, 20);
    ctx.fill();
    ctx.stroke();

    const title = data.searchResult?.title || 'Auto Rickshaw';
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 32px sans-serif';
    ctx.fillText(title, 68, artY + 54);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'italic 16px sans-serif';
    const desc = data.searchResult?.description || 'Motorised three-wheeled vehicle for public transport in India';
    ctx.fillText(desc, 68, artY + 90);

    // Extract text paragraph
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '17px sans-serif';
    const extract =
      data.searchResult?.extract ||
      'An auto rickshaw is a motorized development of the traditional pulled rickshaw or cycle rickshaw. In India, Bajaj Auto is the largest manufacturer. Widely used for affordable urban and semi-urban transportation with CNG & electric drivetrains across major highways and heritage corridors.';

    // Word wrap text
    const words = extract.split(' ');
    let line = '';
    let ty = artY + 140;
    const maxLineW = contentW - 88;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        ctx.fillText(line, 68, ty);
        line = words[n] + ' ';
        ty += 28;
        if (ty > artY + 420) break;
      } else {
        line = testLine;
      }
    }
    if (ty <= artY + 420) {
      ctx.fillText(line, 68, ty);
    }

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('✓ VERIFIED FROM WIKIPEDIA 5G ARCHIVE', 68, artY + 450);
  }

  // --- TAB 4: RATES & FARE CALCULATOR ---
  else if (data.subTab === 'rates') {
    const startY = data.isOfflineMode ? contentY + 180 : contentY + 30;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('💵 LIVE FOREX & GOVT FARE METER 🛺', width / 2, startY + 20);

    // Currency grid
    const fxY = startY + 45;
    const currencies = [
      { code: 'USD / INR', rate: `₹${data.inrRates?.USD ?? 86.65}` },
      { code: 'EUR / INR', rate: `₹${data.inrRates?.EUR ?? 93.40}` },
      { code: 'GBP / INR', rate: `₹${data.inrRates?.GBP ?? 110.80}` },
      { code: 'AED / INR', rate: `₹${data.inrRates?.AED ?? 23.58}` },
    ];

    const cWidth = (contentW - 50) / 2;
    currencies.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = 44 + col * (cWidth + 10);
      const cy = fxY + row * 90;

      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cWidth, 78, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(c.code, cx + 18, cy + 28);

      ctx.fillStyle = '#34d399';
      ctx.font = '900 24px monospace';
      ctx.fillText(c.rate, cx + 18, cy + 62);
    });

    // Auto Fare Calculator Box
    const calcY = fxY + 195;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, calcY, contentW - 40, 240, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('🛺 OFFICIAL AUTO FARE CALCULATOR', 68, calcY + 40);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Trip Distance: ${data.fareKm || '5'} Kilometers`, 68, calcY + 76);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 40px monospace';
    ctx.fillText(`Day: ₹${data.fareResult?.day ?? 82}`, 68, calcY + 140);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 40px monospace';
    ctx.fillText(`Night: ₹${data.fareResult?.night ?? 103}`, 68, calcY + 195);
  }

  // --- TAB 5: AI CHAT ---
  else if (data.subTab === 'ai') {
    const startY = data.isOfflineMode ? contentY + 180 : contentY + 30;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('🤖 RICKSHAW SAHAYAK 5G AI COPILOT', width / 2, startY + 20);

    // AI Message Bubble Box
    const chatY = startY + 50;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, chatY, contentW - 40, 360, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Persona: ${data.aiPersona?.toUpperCase() || 'RICKSHAW SAHAYAK 5G'}`, 68, chatY + 45);

    ctx.fillStyle = '#f3f4f6';
    ctx.font = '17px sans-serif';
    const aiText =
      data.lastAiMessage ||
      'Namaste Ustaad! On NH-48 or City Bazaars, keep tire pressure steady at 30 PSI, slow down before sharp curves, and enjoy adrak cutting chai every 50 kilometers! Chalo bindass!';

    const words = aiText.split(' ');
    let line = '';
    let ty = chatY + 95;
    const maxLineW = contentW - 88;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        ctx.fillText(line, 68, ty);
        line = words[n] + ' ';
        ty += 28;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 68, ty);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '13px monospace';
    ctx.fillText('⚡ POWERED BY GOOGLE GEMINI 3.8 FLASH', 68, chatY + 320);
  }

  // --- TAB 6: DIGITAL DHABA QR SCANNER ---
  else if (data.subTab === 'scanner') {
    const startY = data.isOfflineMode ? contentY + 180 : contentY + 30;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('📷 DIGITAL DHABA 5G QR SCANNER', width / 2, startY + 20);

    // Viewfinder Reticle Box
    const viewY = startY + 50;
    const viewSize = 340;
    const viewX = (width - viewSize) / 2;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(viewX, viewY, viewSize, viewSize);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(viewX, viewY, viewSize, viewSize);

    // Corner brackets
    const bLen = 30;
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(viewX, viewY + bLen);
    ctx.lineTo(viewX, viewY);
    ctx.lineTo(viewX + bLen, viewY);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(viewX + viewSize - bLen, viewY);
    ctx.lineTo(viewX + viewSize, viewY);
    ctx.lineTo(viewX + viewSize, viewY + bLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(viewX, viewY + viewSize - bLen);
    ctx.lineTo(viewX, viewY + viewSize);
    ctx.lineTo(viewX + bLen, viewY + viewSize);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(viewX + viewSize - bLen, viewY + viewSize);
    ctx.lineTo(viewX + viewSize, viewY + viewSize);
    ctx.lineTo(viewX + viewSize, viewY + viewSize - bLen);
    ctx.stroke();

    // Center Crosshair and Laser Beam
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(viewX + 20, viewY + viewSize / 2);
    ctx.lineTo(viewX + viewSize - 20, viewY + viewSize / 2);
    ctx.moveTo(viewX + viewSize / 2, viewY + 20);
    ctx.lineTo(viewX + viewSize / 2, viewY + viewSize - 20);
    ctx.stroke();

    // Glowing Green Laser Scan line
    const laserY = viewY + viewSize * 0.45;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(viewX + 10, laserY);
    ctx.lineTo(viewX + viewSize - 10, laserY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Viewfinder target status
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      data.qrScanTargetName ? `🎯 TARGET LOCKED: ${data.qrScanTargetName.toUpperCase()}` : '⚡ 3D RETICLE ACTIVE • SCANNING ROAD',
      width / 2,
      viewY + viewSize + 32
    );

    // Unlocked Rewards Badge Card
    const infoY = viewY + viewSize + 55;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, infoY, contentW - 40, 110, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🏷️ DIGITAL DHABA SECRET REWARDS WALLET', 68, infoY + 36);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px monospace';
    ctx.fillText(`Active Coupons Collected: ${data.qrScannedCouponsCount ?? 1} Unlocked`, 68, infoY + 68);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Point camera at 3D roadside dhabas to redeem rewards!', 68, infoY + 94);
  }

  // --- TAB 7: FM RADIO TUNER ---
  if (data.subTab === 'radio') {
    const startY = contentY + 28;

    // Header badge
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('📻 DESI HIGHWAY FM STEREO TUNER 📻', width / 2, startY + 16);

    // Cassette Player / Deck Box
    const deckY = startY + 45;
    const deckH = 260;
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, deckY, contentW - 40, deckH, 16);
    ctx.fill();
    ctx.stroke();

    // Spool 1 (Left)
    const spoolRadius = 40;
    const spool1X = 140;
    const spoolY = deckY + 80;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(spool1X, spoolY, spoolRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#18181b';
    ctx.fill();

    // Spool 2 (Right)
    const spool2X = width - 140;
    ctx.beginPath();
    ctx.arc(spool2X, spoolY, spoolRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Digital Frequency readout
    const currentFreq = data.radioStation?.frequency || '98.3 MHz FM';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#34d399';
    ctx.font = '900 48px monospace';
    ctx.fillText(currentFreq, width / 2, deckY + 95);

    // Station Name & Tagline
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(data.radioStation?.name || 'Radio Mirchi Nostalgia', width / 2, deckY + 160);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(data.radioStation?.tagline || 'Pehla Nasha • Evergreen 90s Kishore & Lata Hits', width / 2, deckY + 195);

    // Live Broadcast status
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText('● STEREO BROADCAST ACTIVE • DOLBY HIGHWAY SURROUND', width / 2, deckY + 230);

    // Station Genre & Track Details Card
    const infoY = deckY + deckH + 24;
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(44, infoY, contentW - 40, 180, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('🎵 NOW PLAYING METADATA', 68, infoY + 36);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(data.radioStation?.trackName || 'Pehla Nasha (1992 Remastered)', 68, infoY + 74);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(`DJ / Host: ${data.radioStation?.djName || 'RJ Naved'}`, 68, infoY + 110);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`GENRE: ${data.radioStation?.genre?.toUpperCase() || 'RETRO BOLLYWOOD'}`, 68, infoY + 146);

    // Equalizer Visual Bars
    const eqY = infoY + 215;
    const barCount = 24;
    const eqWidth = contentW - 60;
    const barW = eqWidth / barCount - 4;
    for (let i = 0; i < barCount; i++) {
      const bh = 20 + Math.sin(i * 0.8) * 35 + 25;
      const bx = 54 + i * (barW + 4);
      ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#10b981';
      ctx.fillRect(bx, eqY + (80 - bh), barW, bh);
    }
  }

  // 6. Watermark Footer & Capture Stamp
  const footY = height - 90;
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, footY, width, 90);
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, footY, width, 90);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#71717a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('OPPO F27 5G COSMOS RING • COLOROS 14 BROWSER', 36, footY + 34);

  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  ctx.fillText(`SCREENSHOT CAPTURE • ${dateStr} • ${timeStr}`, 36, footY + 62);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('BHARAT AUTO EXPRESS', width - 36, footY + 34);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('5G CONNECTED 🛺', width - 36, footY + 62);

  // Convert canvas to blob & dataUrl
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas blob generation failed'));
    }, 'image/png', 0.95);
  });

  return { canvas, blob, dataUrl };
}
