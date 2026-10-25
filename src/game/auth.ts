export interface DriverProfile {
  uid: string;
  name: string;
  email?: string;
  isGuest: boolean;
  rating: number;
  licenseNumber: string;
  city: string;
  liveryId: string;
  totalTrips: number;
  totalEarnings: number;
  chaiCups: number;
  avatarIcon: string;
  joinedAt: string;
}

interface StoredAccount {
  email: string;
  passwordHash: string; // Simple mock hash for browser persistence
  profile: DriverProfile;
}

const STORAGE_KEYS = {
  SESSION: 'bharat_driver_session',
  ACCOUNTS: 'bharat_driver_accounts',
  LEGACY_NAME: 'bharat_driver_name',
  LEGACY_LIVERY: 'bharat_rickshaw_livery',
};

const DESI_NICKNAMES = [
  'Ustaad Raju',
  'Bullet Babu',
  'Highway Sultan',
  'Pink City Pilot',
  'Dilli King',
  'Konkan Cruiser',
  'Bengaluru Boss',
  'Kolkata Tiger',
  'Punjab Da Sher',
  'Mumbai Ka Don',
  'Jaipur Express',
  'Deccan Charioteer',
  'Namma Driver',
  'Banarasi Babu',
  'Goa Beach Cruiser',
  'Lucknowi Nawab',
  'Ahmedabad Rocket',
  'Indori Poha King',
  'Speedy Sardarji',
  'Bhaijaan Pilot',
];

const DESI_CITIES = [
  { id: 'delhi', name: 'Delhi NCR', rtoCode: 'DL-01' },
  { id: 'mumbai', name: 'Mumbai Metro', rtoCode: 'MH-02' },
  { id: 'bengaluru', name: 'Bengaluru Tech Corridor', rtoCode: 'KA-04' },
  { id: 'jaipur', name: 'Jaipur Pink City', rtoCode: 'RJ-14' },
  { id: 'ahmedabad', name: 'Ahmedabad Heritage', rtoCode: 'GJ-01' },
  { id: 'goa', name: 'Goa Coastal Zone', rtoCode: 'GA-07' },
  { id: 'kolkata', name: 'Kolkata City of Joy', rtoCode: 'WB-02' },
];

export const AVAILABLE_CITIES = DESI_CITIES;

export function getRandomGuestName(): string {
  const name = DESI_NICKNAMES[Math.floor(Math.random() * DESI_NICKNAMES.length)];
  const num = Math.floor(100 + Math.random() * 899);
  return `${name} #${num}`;
}

export function generateLicenseNumber(cityId: string, isGuest: boolean): string {
  const city = DESI_CITIES.find((c) => c.id === cityId) || DESI_CITIES[0];
  const year = new Date().getFullYear();
  const serial = Math.floor(1000 + Math.random() * 9000);
  if (isGuest) {
    return `GST-${city.rtoCode}-${serial}`;
  }
  return `${city.rtoCode}-${year}-${serial}`;
}

// Pre-seed demo accounts if none exist in localStorage
function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }

  // Initial Demo Accounts
  const defaultAccounts: StoredAccount[] = [
    {
      email: 'ustaad@bharat.in',
      passwordHash: 'auto123',
      profile: {
        uid: 'acc_demo_ustaad',
        name: 'Ustaad Vikram Singh',
        email: 'ustaad@bharat.in',
        isGuest: false,
        rating: 4.9,
        licenseNumber: 'DL-01-2025-00482',
        city: 'Delhi NCR',
        liveryId: 'classic_green_yellow',
        totalTrips: 42,
        totalEarnings: 8450,
        chaiCups: 18,
        avatarIcon: '👳🏽‍♂️',
        joinedAt: 'January 2025',
      },
    },
    {
      email: 'mumbai@speed.in',
      passwordHash: 'auto123',
      profile: {
        uid: 'acc_demo_mumbai',
        name: 'Babu Kaali-Peeli',
        email: 'mumbai@speed.in',
        isGuest: false,
        rating: 4.8,
        licenseNumber: 'MH-02-2025-09812',
        city: 'Mumbai Metro',
        liveryId: 'mumbai_black_yellow',
        totalTrips: 68,
        totalEarnings: 14200,
        chaiCups: 31,
        avatarIcon: '🕶️',
        joinedAt: 'November 2024',
      },
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(defaultAccounts));
  } catch {
    // Ignore
  }

  return defaultAccounts;
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch {
    // Ignore
  }
}

export function getSavedSession(): DriverProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (raw) {
      const profile = JSON.parse(raw) as DriverProfile;
      // Sync legacy multiplayer keys
      localStorage.setItem(STORAGE_KEYS.LEGACY_NAME, profile.name);
      localStorage.setItem(STORAGE_KEYS.LEGACY_LIVERY, profile.liveryId);
      return profile;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function saveSession(profile: DriverProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.LEGACY_NAME, profile.name);
      localStorage.setItem(STORAGE_KEYS.LEGACY_LIVERY, profile.liveryId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch {
    // Ignore
  }
}

export function createGuestDriver(
  customName?: string,
  liveryId = 'classic_green_yellow',
  cityId = 'delhi'
): DriverProfile {
  const chosenCity = DESI_CITIES.find((c) => c.id === cityId) || DESI_CITIES[0];
  const name = customName?.trim() || getRandomGuestName();
  const guestProfile: DriverProfile = {
    uid: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    isGuest: true,
    rating: 4.7,
    licenseNumber: generateLicenseNumber(chosenCity.id, true),
    city: chosenCity.name,
    liveryId,
    totalTrips: 0,
    totalEarnings: 0,
    chaiCups: 0,
    avatarIcon: '🛺',
    joinedAt: 'Today (Guest Session)',
  };

  saveSession(guestProfile);
  return guestProfile;
}

export function loginDriver(
  emailInput: string,
  passwordInput: string
): { success: boolean; profile?: DriverProfile; error?: string } {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) {
    return { success: false, error: 'Please enter both Email and Password.' };
  }

  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === email);

  if (!account) {
    return {
      success: false,
      error: 'No driver account found with this email. Please register below or try demo account.',
    };
  }

  if (account.passwordHash !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  saveSession(account.profile);
  return { success: true, profile: account.profile };
}

export function registerDriver(params: {
  name: string;
  email: string;
  password: string;
  cityId: string;
  liveryId: string;
  existingGuestProfile?: DriverProfile | null;
}): { success: boolean; profile?: DriverProfile; error?: string } {
  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();

  if (!name || name.length < 3) {
    return { success: false, error: 'Please provide a valid Driver Name (at least 3 characters).' };
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please provide a valid Email address.' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  const accounts = getStoredAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  const city = DESI_CITIES.find((c) => c.id === params.cityId) || DESI_CITIES[0];
  const guest = params.existingGuestProfile;

  const newProfile: DriverProfile = {
    uid: `dl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    email,
    isGuest: false,
    rating: 5.0,
    licenseNumber: generateLicenseNumber(city.id, false),
    city: city.name,
    liveryId: params.liveryId || 'classic_green_yellow',
    totalTrips: guest ? guest.totalTrips : 0,
    totalEarnings: guest ? guest.totalEarnings : 0,
    chaiCups: guest ? guest.chaiCups : 0,
    avatarIcon: '🪪',
    joinedAt: new Date().toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    }),
  };

  accounts.push({
    email,
    passwordHash: password,
    profile: newProfile,
  });

  saveStoredAccounts(accounts);
  saveSession(newProfile);

  return { success: true, profile: newProfile };
}

export function logoutDriver() {
  saveSession(null);
}

export function updateSessionStats(delta: {
  earnings?: number;
  trips?: number;
  chai?: number;
}) {
  const current = getSavedSession();
  if (!current) return;

  if (delta.earnings) current.totalEarnings += Math.max(0, Math.round(delta.earnings));
  if (delta.trips) current.totalTrips += delta.trips;
  if (delta.chai) current.chaiCups += delta.chai;

  // Slowly boost rating as more trips are completed
  if (current.totalTrips > 5 && current.rating < 4.95) {
    current.rating = Math.min(5.0, +(current.rating + 0.01).toFixed(2));
  }

  saveSession(current);

  // Also update registered account if not guest
  if (!current.isGuest && current.email) {
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === current.email?.toLowerCase());
    if (idx !== -1) {
      accounts[idx].profile = current;
      saveStoredAccounts(accounts);
    }
  }
}
