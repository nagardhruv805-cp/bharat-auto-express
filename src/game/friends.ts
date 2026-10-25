import { sounds } from './audio';
import { RICKSHAW_LIVERIES } from './multiplayer';

export interface FriendDriver {
  id: string;
  name: string;
  driverCode: string;
  status: 'online' | 'racing' | 'chai_break' | 'offline';
  statusText: string;
  speedKmh: number;
  location: string;
  city: string;
  liveryId: string;
  rating: number;
  avatarIcon: string;
  lastSeen: string;
  isFavorite?: boolean;
  tripsTogether: number;
  chaiShared: number;
}

const STORAGE_KEYS = {
  FRIENDS: 'bharat_driver_friends',
  MY_CODE: 'bharat_driver_my_code',
};

const DEFAULT_FRIENDS: FriendDriver[] = [
  {
    id: 'f_raju_delhi',
    name: 'Ustaad Raju (Delhi)',
    driverCode: 'YAAR-DL44',
    status: 'online',
    statusText: 'Cruising on Delhi-Agra Expressway • 62 km/h',
    speedKmh: 62,
    location: 'Mathura Sector (NH-44)',
    city: 'Delhi NCR',
    liveryId: 'classic_green_yellow',
    rating: 4.9,
    avatarIcon: '🛺',
    lastSeen: 'Active now',
    isFavorite: true,
    tripsTogether: 14,
    chaiShared: 8,
  },
  {
    id: 'f_babu_jaipur',
    name: 'Bullet Babu',
    driverCode: 'YAAR-RJ14',
    status: 'racing',
    statusText: 'Overtaking trucks at 74 km/h with Nitro boost!',
    speedKmh: 74,
    location: 'Pink City Bypass (NH-48)',
    city: 'Jaipur',
    liveryId: 'rajasthan_royal_blue',
    rating: 4.8,
    avatarIcon: '⚡',
    lastSeen: 'Active now',
    isFavorite: true,
    tripsTogether: 9,
    chaiShared: 5,
  },
  {
    id: 'f_sultan_mumbai',
    name: 'Highway Sultan',
    driverCode: 'YAAR-MH02',
    status: 'chai_break',
    statusText: 'Cutting Chai break at Lonavala Ghat Dhaba ☕',
    speedKmh: 0,
    location: 'Mumbai-Pune Expressway',
    city: 'Mumbai',
    liveryId: 'mumbai_black_yellow',
    rating: 5.0,
    avatarIcon: '👑',
    lastSeen: '2m ago',
    isFavorite: false,
    tripsTogether: 6,
    chaiShared: 12,
  },
  {
    id: 'f_chhotu_dhaba',
    name: 'Chhotu Chaiwala',
    driverCode: 'YAAR-CHAI',
    status: 'offline',
    statusText: 'Resting at Royal Punjab Dhaba rest stop',
    speedKmh: 0,
    location: 'Agra Highway',
    city: 'Agra',
    liveryId: 'saffron_flame',
    rating: 4.7,
    avatarIcon: '☕',
    lastSeen: '15m ago',
    isFavorite: false,
    tripsTogether: 3,
    chaiShared: 19,
  },
];

/**
 * Get or initialize the user's personal Yaar Driver Code
 */
export function getMyDriverFriendCode(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.MY_CODE);
    if (existing) return existing;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `YAAR-${randomSuffix}`;
    localStorage.setItem(STORAGE_KEYS.MY_CODE, code);
    return code;
  } catch {
    return 'YAAR-7788';
  }
}

/**
 * Retrieve current saved friends list
 */
export function getSavedFriends(): FriendDriver[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(DEFAULT_FRIENDS));
      return DEFAULT_FRIENDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FRIENDS;
  } catch {
    return DEFAULT_FRIENDS;
  }
}

/**
 * Save friends list to local storage
 */
export function saveFriends(friends: FriendDriver[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Add a new friend by Code or Profile data
 */
export function addNewFriend(friendData: {
  name: string;
  driverCode?: string;
  city?: string;
  liveryId?: string;
}): { success: boolean; message: string; friend?: FriendDriver } {
  const friends = getSavedFriends();
  const code = (friendData.driverCode || `YAAR-${Math.floor(1000 + Math.random() * 9000)}`)
    .trim()
    .toUpperCase();

  const existing = friends.find(
    (f) =>
      f.driverCode.toUpperCase() === code ||
      f.name.toLowerCase() === friendData.name.trim().toLowerCase()
  );

  if (existing) {
    return { success: false, message: `Driver "${existing.name}" is already in your Yaar network!` };
  }

  const randomLivery =
    friendData.liveryId ||
    RICKSHAW_LIVERIES[Math.floor(Math.random() * RICKSHAW_LIVERIES.length)].id;

  const newFriend: FriendDriver = {
    id: `friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: friendData.name.trim(),
    driverCode: code,
    status: 'online',
    statusText: 'Cruising on NH-48 Highway',
    speedKmh: Math.floor(40 + Math.random() * 35),
    location: 'NH-48 Sector',
    city: friendData.city || 'Delhi NCR',
    liveryId: randomLivery,
    rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
    avatarIcon: '🛺',
    lastSeen: 'Active now',
    isFavorite: false,
    tripsTogether: 1,
    chaiShared: 1,
  };

  const updated = [newFriend, ...friends];
  saveFriends(updated);
  sounds.playCoin();

  return {
    success: true,
    message: `🤝 Added ${newFriend.name} (${newFriend.driverCode}) to your Driver Yaar Network!`,
    friend: newFriend,
  };
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(friendId: string): FriendDriver[] {
  const friends = getSavedFriends().map((f) => {
    if (f.id === friendId) {
      return { ...f, isFavorite: !f.isFavorite };
    }
    return f;
  });
  saveFriends(friends);
  sounds.playPhoneClick();
  return friends;
}

/**
 * Remove a friend from list
 */
export function removeFriend(friendId: string): FriendDriver[] {
  const friends = getSavedFriends().filter((f) => f.id !== friendId);
  saveFriends(friends);
  sounds.playPhoneClick();
  return friends;
}

/**
 * Send virtual cutting chai to friend
 */
export function giftChaiToFriend(friendId: string): { success: boolean; message: string } {
  const friends = getSavedFriends();
  const friend = friends.find((f) => f.id === friendId);
  if (!friend) return { success: false, message: 'Friend not found' };

  friend.chaiShared = (friend.chaiShared || 0) + 1;
  saveFriends(friends);
  sounds.playChaiBoost();

  return {
    success: true,
    message: `☕ Sent hot Ginger Cutting Chai to ${friend.name}! Chai score +1!`,
  };
}

/**
 * Send convoy ride invite to friend
 */
export function inviteToConvoy(friendId: string): { success: boolean; message: string } {
  const friends = getSavedFriends();
  const friend = friends.find((f) => f.id === friendId);
  if (!friend) return { success: false, message: 'Friend not found' };

  sounds.playHorn('bulb');
  return {
    success: true,
    message: `🛺💨 Convoy Invite sent to ${friend.name}! Horn sounded!`,
  };
}
