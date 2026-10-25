import { DriverProfile } from './auth';

export type LeaderboardCategory = 'earnings' | 'distance' | 'speed' | 'chai' | 'passengers';

export interface LeaderboardDriver {
  rank: number;
  id: string;
  driverName: string;
  licenseNumber: string;
  city: string;
  earnings: number;
  distanceKm: number;
  topSpeedKmh: number;
  chaiCount: number;
  passengersServed: number;
  rating: number;
  liveryId: string;
  isGuest: boolean;
  avatarIcon: string;
  updatedAt: number;
}

export interface LeaderboardResponse {
  category: LeaderboardCategory;
  city: string;
  totalDrivers: number;
  entries: LeaderboardDriver[];
  podium: LeaderboardDriver[];
  updatedAt: number;
}

const STORAGE_KEY = 'bharat_leaderboard_cache';

const FALLBACK_DRIVERS: LeaderboardDriver[] = [
  {
    rank: 1,
    id: 'legend_1',
    driverName: 'Ustaad Vikram Singh',
    licenseNumber: 'DL-01-2025-00482',
    city: 'Delhi NCR',
    earnings: 48250,
    distanceKm: 142.5,
    topSpeedKmh: 98,
    chaiCount: 52,
    passengersServed: 74,
    rating: 4.95,
    liveryId: 'classic_green_yellow',
    isGuest: false,
    avatarIcon: '👳🏽‍♂️',
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    rank: 2,
    id: 'legend_2',
    driverName: 'Babu Kaali-Peeli',
    licenseNumber: 'MH-02-2025-09812',
    city: 'Mumbai Metro',
    earnings: 42100,
    distanceKm: 128.0,
    topSpeedKmh: 94,
    chaiCount: 45,
    passengersServed: 68,
    rating: 4.88,
    liveryId: 'mumbai_black_yellow',
    isGuest: false,
    avatarIcon: '🕶️',
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    rank: 3,
    id: 'legend_3',
    driverName: 'Ramesh "Raftaar" Patil',
    licenseNumber: 'MH-12-2025-04190',
    city: 'Mumbai Metro',
    earnings: 38900,
    distanceKm: 115.4,
    topSpeedKmh: 96,
    chaiCount: 38,
    passengersServed: 59,
    rating: 4.82,
    liveryId: 'saffron_flame',
    isGuest: false,
    avatarIcon: '⚡',
    updatedAt: Date.now() - 3600000 * 8,
  },
  {
    rank: 4,
    id: 'legend_4',
    driverName: 'Pink City Bullet',
    licenseNumber: 'RJ-14-2025-07712',
    city: 'Jaipur Pink City',
    earnings: 34750,
    distanceKm: 102.0,
    topSpeedKmh: 92,
    chaiCount: 34,
    passengersServed: 51,
    rating: 4.79,
    liveryId: 'rajasthan_royal_blue',
    isGuest: false,
    avatarIcon: '👑',
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    rank: 5,
    id: 'legend_5',
    driverName: 'Namma Auto Guru',
    licenseNumber: 'KA-04-2025-03211',
    city: 'Bengaluru Tech Corridor',
    earnings: 31200,
    distanceKm: 95.8,
    topSpeedKmh: 91,
    chaiCount: 29,
    passengersServed: 46,
    rating: 4.75,
    liveryId: 'electric_violet',
    isGuest: false,
    avatarIcon: '💻',
    updatedAt: Date.now() - 3600000 * 18,
  },
  {
    rank: 6,
    id: 'legend_6',
    driverName: 'Coastal Konkan King',
    licenseNumber: 'GA-07-2025-01948',
    city: 'Goa Coastal Zone',
    earnings: 28400,
    distanceKm: 88.2,
    topSpeedKmh: 89,
    chaiCount: 27,
    passengersServed: 42,
    rating: 4.71,
    liveryId: 'goa_crimson',
    isGuest: false,
    avatarIcon: '🌴',
    updatedAt: Date.now() - 3600000 * 24,
  },
];

export async function fetchLeaderboard(
  category: LeaderboardCategory = 'earnings',
  city = 'all'
): Promise<LeaderboardResponse> {
  try {
    const url = `/api/leaderboard?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
      } catch {
        // Ignore
      }
      return data;
    }
  } catch {
    // Network fallback
  }

  // Fallback to local cache or defaults
  let cached: LeaderboardDriver[] = FALLBACK_DRIVERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
    }
  } catch {
    // Ignore
  }

  let filtered = [...cached];
  if (city !== 'all') {
    filtered = filtered.filter(
      (e) => e.city.toLowerCase() === city.toLowerCase() || e.licenseNumber.includes(city)
    );
  }

  filtered.sort((a, b) => {
    if (category === 'distance') return b.distanceKm - a.distanceKm;
    if (category === 'speed') return b.topSpeedKmh - a.topSpeedKmh;
    if (category === 'chai') return b.chaiCount - a.chaiCount;
    if (category === 'passengers') return b.passengersServed - a.passengersServed;
    return b.earnings - a.earnings;
  });

  const entriesWithRank = filtered.map((e, idx) => ({ ...e, rank: idx + 1 }));

  return {
    category,
    city,
    totalDrivers: entriesWithRank.length,
    entries: entriesWithRank,
    podium: entriesWithRank.slice(0, 3),
    updatedAt: Date.now(),
  };
}

export async function submitDriverScore(params: {
  profile: DriverProfile;
  earnings: number;
  distanceKm: number;
  topSpeedKmh: number;
  chaiCount: number;
  passengersServed: number;
}): Promise<{ success: boolean; rank?: number }> {
  const payload = {
    id: params.profile.uid,
    driverName: params.profile.name,
    licenseNumber: params.profile.licenseNumber,
    city: params.profile.city,
    earnings: Math.max(params.profile.totalEarnings, params.earnings),
    distanceKm: params.distanceKm,
    topSpeedKmh: params.topSpeedKmh,
    chaiCount: Math.max(params.profile.chaiCups, params.chaiCount),
    passengersServed: Math.max(params.profile.totalTrips, params.passengersServed),
    rating: params.profile.rating,
    liveryId: params.profile.liveryId,
    isGuest: params.profile.isGuest,
    avatarIcon: params.profile.avatarIcon,
  };

  try {
    const res = await fetch('/api/leaderboard/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Ignore
  }

  // Update local cache fallback
  try {
    let cached: LeaderboardDriver[] = FALLBACK_DRIVERS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cached = JSON.parse(raw);

    const matchIdx = cached.findIndex((e) => e.licenseNumber === payload.licenseNumber || e.id === payload.id);
    if (matchIdx !== -1) {
      cached[matchIdx] = { ...cached[matchIdx], ...payload, rank: 0, updatedAt: Date.now() };
    } else {
      cached.push({ ...payload, rank: 0, updatedAt: Date.now() });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore
  }

  return { success: true, rank: 1 };
}
