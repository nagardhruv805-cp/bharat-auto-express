export interface IndiaStop {
  id: string;
  name: string;
  hindiName: string;
  state: string;
  km: number;
  x: number; // 0-400 SVG coordinate space
  y: number; // 0-500 SVG coordinate space
  lat: number; // Real GPS latitude
  lng: number; // Real GPS longitude
  landmark: string;
  icon: string;
  foodOrHighlight: string;
  highwayCode: string;
}

export const INDIA_STOPS: IndiaStop[] = [
  {
    id: 'delhi',
    name: 'Delhi NCR',
    hindiName: 'दिल्ली',
    state: 'National Capital',
    km: 0,
    x: 168,
    y: 155,
    lat: 28.6139,
    lng: 77.209,
    landmark: 'India Gate & Red Fort',
    icon: '🏛️',
    foodOrHighlight: 'Paranthe Wali Gali & Cutting Chai',
    highwayCode: 'NH-44',
  },
  {
    id: 'mathura',
    name: 'Mathura & Vrindavan',
    hindiName: 'मथुरा-वृंदावन',
    state: 'Uttar Pradesh',
    km: 2.5,
    x: 174,
    y: 170,
    lat: 27.4924,
    lng: 77.6737,
    landmark: 'Yamuna Ghats & Krishna Mandir',
    icon: '🛕',
    foodOrHighlight: 'Mathura Peda & Kesar Rabdi',
    highwayCode: 'NH-19',
  },
  {
    id: 'agra',
    name: 'Agra',
    hindiName: 'आगरा',
    state: 'Uttar Pradesh',
    km: 5.0,
    x: 182,
    y: 182,
    lat: 27.1767,
    lng: 78.0081,
    landmark: 'Taj Mahal & Agra Fort',
    icon: '🕌',
    foodOrHighlight: 'Agra Petha & Ginger Masala Chai',
    highwayCode: 'Yamuna Exp',
  },
  {
    id: 'jaipur',
    name: 'Jaipur (Pink City)',
    hindiName: 'जयपुर',
    state: 'Rajasthan',
    km: 8.0,
    x: 142,
    y: 190,
    lat: 26.9124,
    lng: 75.7873,
    landmark: 'Hawa Mahal & Amber Fort',
    icon: '🏰',
    foodOrHighlight: 'Pyaaz Kachori & Gulab Lassi',
    highwayCode: 'NH-48',
  },
  {
    id: 'ajmer',
    name: 'Ajmer & Pushkar',
    hindiName: 'अजमेर-पुष्कर',
    state: 'Rajasthan',
    km: 11.5,
    x: 126,
    y: 210,
    lat: 26.4499,
    lng: 74.6399,
    landmark: 'Dargah Sharif & Sacred Lake',
    icon: '✨',
    foodOrHighlight: 'Rabdi Malpua & Rose Tea',
    highwayCode: 'NH-58',
  },
  {
    id: 'udaipur',
    name: 'Udaipur (City of Lakes)',
    hindiName: 'उदयपुर',
    state: 'Rajasthan',
    km: 15.0,
    x: 122,
    y: 245,
    lat: 24.5854,
    lng: 73.7125,
    landmark: 'City Palace & Lake Pichola',
    icon: '⛵',
    foodOrHighlight: 'Dal Baati Churma & Dhaba Chai',
    highwayCode: 'NH-48',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    hindiName: 'अहमदाबाद',
    state: 'Gujarat',
    km: 19.0,
    x: 106,
    y: 270,
    lat: 23.0225,
    lng: 72.5714,
    landmark: 'Sabarmati Riverfront & Sidi Saiyyed',
    icon: '🪁',
    foodOrHighlight: 'Khaman Dhokla & Fafda Jalebi',
    highwayCode: 'NE-1',
  },
  {
    id: 'surat',
    name: 'Surat (Diamond City)',
    hindiName: 'सूरत',
    state: 'Gujarat',
    km: 23.0,
    x: 112,
    y: 300,
    lat: 21.1702,
    lng: 72.8311,
    landmark: 'Tapi River & Dutch Garden',
    icon: '💎',
    foodOrHighlight: 'Surti Locho & Ghari Sweets',
    highwayCode: 'NH-48',
  },
  {
    id: 'mumbai',
    name: 'Mumbai (Aamchi Mumbai)',
    hindiName: 'मुंबई',
    state: 'Maharashtra',
    km: 28.0,
    x: 108,
    y: 334,
    lat: 18.922,
    lng: 72.8347,
    landmark: 'Marine Drive & Gateway of India',
    icon: '🏙️',
    foodOrHighlight: 'Cutting Chai & Mumbai Vada Pav',
    highwayCode: 'NH-48',
  },
  {
    id: 'pune',
    name: 'Pune & Lonavala Ghats',
    hindiName: 'पुणे',
    state: 'Maharashtra',
    km: 33.0,
    x: 128,
    y: 350,
    lat: 18.5204,
    lng: 73.8567,
    landmark: 'Western Ghats & Shaniwar Wada',
    icon: '⛰️',
    foodOrHighlight: 'Puneri Misal Pav & Chikki',
    highwayCode: 'Mumbai-Pune Exp',
  },
  {
    id: 'goa',
    name: 'Goa (Konkan Coast)',
    hindiName: 'गोवा',
    state: 'Goa',
    km: 39.0,
    x: 120,
    y: 395,
    lat: 15.2993,
    lng: 74.124,
    landmark: 'Calangute Palm Coast & Old Goa Churches',
    icon: '🏖️',
    foodOrHighlight: 'Bebinca & Spiced Coconut Tea',
    highwayCode: 'NH-66',
  },
  {
    id: 'hampi',
    name: 'Hampi (Heritage Ruins)',
    hindiName: 'हम्पी',
    state: 'Karnataka',
    km: 45.0,
    x: 152,
    y: 390,
    lat: 15.335,
    lng: 76.46,
    landmark: 'Stone Chariot & Tungabhadra River',
    icon: '🪨',
    foodOrHighlight: 'Bisi Bele Bath & Filter Kaapi',
    highwayCode: 'NH-50',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru (Garden City)',
    hindiName: 'बेंगलुरु',
    state: 'Karnataka',
    km: 52.0,
    x: 168,
    y: 424,
    lat: 12.9716,
    lng: 77.5946,
    landmark: 'Vidhana Soudha & Lalbagh',
    icon: '💻',
    foodOrHighlight: 'Crispy Benne Dosa & Filter Coffee',
    highwayCode: 'NH-44',
  },
  {
    id: 'mysuru',
    name: 'Mysuru (Palace City)',
    hindiName: 'मैसूरु',
    state: 'Karnataka',
    km: 58.0,
    x: 154,
    y: 436,
    lat: 12.2958,
    lng: 76.6394,
    landmark: 'Mysore Palace & Chamundi Hill',
    icon: '👑',
    foodOrHighlight: 'Mysore Pak & Cardamom Tea',
    highwayCode: 'NH-275',
  },
  {
    id: 'kochi',
    name: 'Kochi & Alappuzha',
    hindiName: 'कोच्चि-अलेप्पी',
    state: 'Kerala',
    km: 65.0,
    x: 150,
    y: 458,
    lat: 9.9312,
    lng: 76.2673,
    landmark: 'Kerala Backwaters & Houseboats',
    icon: '🌴',
    foodOrHighlight: 'Appam Stew & Sulaimani Chai',
    highwayCode: 'NH-66',
  },
  {
    id: 'kanyakumari',
    name: 'Kanyakumari (Southern Tip)',
    hindiName: 'कन्याकुमारी',
    state: 'Tamil Nadu',
    km: 75.0,
    x: 165,
    y: 482,
    lat: 8.0883,
    lng: 77.5385,
    landmark: 'Triveni Sangam & Vivekananda Rock',
    icon: '🌅',
    foodOrHighlight: 'Sunset Tender Coconut & Banana Chips',
    highwayCode: 'NH-44 End',
  },
];

export interface PlayerMapLocation {
  currentStop: IndiaStop;
  nextStop: IndiaStop;
  progressPercent: number; // 0 to 100 within current leg
  totalProgressPercent: number; // 0 to 100 across full Bharat journey
  x: number; // Current player SVG position
  y: number; // Current player SVG position
  lat: number; // Real GPS latitude
  lng: number; // Real GPS longitude
  headingDeg: number;
  remainingKmToNext: number;
  totalKmTraveled: number;
  expeditionLap: number;
  stopsCompletedCount: number;
}

export function getPlayerMapLocation(distanceKm: number): PlayerMapLocation {
  const maxDistance = INDIA_STOPS[INDIA_STOPS.length - 1].km; // 75 km
  const safeDistance = Math.max(0, distanceKm);
  const expeditionLap = Math.floor(safeDistance / maxDistance) + 1;
  const loopDistance = safeDistance % maxDistance;

  // Find the segment [stopA, stopB]
  let stopAIndex = 0;
  for (let i = 0; i < INDIA_STOPS.length - 1; i++) {
    if (loopDistance >= INDIA_STOPS[i].km && loopDistance <= INDIA_STOPS[i + 1].km) {
      stopAIndex = i;
      break;
    }
  }

  const stopA = INDIA_STOPS[stopAIndex];
  const stopB = INDIA_STOPS[Math.min(stopAIndex + 1, INDIA_STOPS.length - 1)];

  const legTotalKm = stopB.km - stopA.km;
  const legDoneKm = loopDistance - stopA.km;
  const ratio = legTotalKm > 0 ? Math.min(1, Math.max(0, legDoneKm / legTotalKm)) : 0;

  const currentX = stopA.x + (stopB.x - stopA.x) * ratio;
  const currentY = stopA.y + (stopB.y - stopA.y) * ratio;
  const currentLat = stopA.lat + (stopB.lat - stopA.lat) * ratio;
  const currentLng = stopA.lng + (stopB.lng - stopA.lng) * ratio;

  // Calculate compass heading between Stop A and Stop B
  const dx = stopB.x - stopA.x;
  const dy = stopB.y - stopA.y;
  const headingRad = Math.atan2(dy, dx);
  const headingDeg = (headingRad * 180) / Math.PI;

  const remainingKmToNext = Math.max(0, stopB.km - loopDistance);
  const progressPercent = Math.round(ratio * 100);
  const totalProgressPercent = Math.round((loopDistance / maxDistance) * 100);

  return {
    currentStop: stopA,
    nextStop: stopB,
    progressPercent,
    totalProgressPercent,
    x: currentX,
    y: currentY,
    lat: currentLat,
    lng: currentLng,
    headingDeg,
    remainingKmToNext,
    totalKmTraveled: safeDistance,
    expeditionLap,
    stopsCompletedCount: stopAIndex + (expeditionLap - 1) * INDIA_STOPS.length,
  };
}
