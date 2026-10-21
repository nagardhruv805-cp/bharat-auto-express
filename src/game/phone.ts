// Indian Auto-Rickshaw In-Game Mobile Phone System
// Simulated virtual smartphone / feature phone allowing calls to fictional characters ("not in real")
// with speech synthesis, audio DTMF, dialogues, and interactive gameplay perks!

import { sounds } from './audio';

export interface PhoneContact {
  id: string;
  name: string;
  relation: string;
  number: string;
  avatar: string; // Emoji or icon key
  color: string;
  tagline: string;
  dialogues: CallerDialogue[];
  voicePitch: number;
  voiceRate: number;
  perk?: {
    type: 'repair' | 'chai' | 'money' | 'stunt';
    label: string;
    cost: number;
    effectDescription: string;
  };
}

export interface DialogueChoice {
  text: string;
  reply: string;
  perkTrigger?: 'repair' | 'chai' | 'blessing' | 'police_pass';
  soundEffect?: 'repair' | 'chai' | 'bell' | 'police';
}

export interface CallerDialogue {
  greeting: string;
  choices: DialogueChoice[];
}

export interface PhoneMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  time: string;
  snippet: string;
  fullText: string;
  isUnread: boolean;
}

export interface CallLog {
  id: string;
  name: string;
  number: string;
  avatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration?: string;
}

export const PHONE_CONTACTS: PhoneContact[] = [
  {
    id: 'maa',
    name: 'Maa (Mom)',
    relation: 'Family ❤️',
    number: '98200-10800',
    avatar: '👵',
    color: 'from-amber-500 to-rose-600',
    tagline: 'Calls 8 times a day to check if you had roti.',
    voicePitch: 1.25,
    voiceRate: 0.95,
    dialogues: [
      {
        greeting:
          'Arrey beta! Where are you right now? Listen, the sun is going down, turn on your auto headlight! Did you eat lunch or just drinking chai with other auto drivers?',
        choices: [
          {
            text: 'Maa, I had hot samosa and chai, driving carefully!',
            reply: 'Samosa is not food! Come home early. I made hot dal makhani and parathas. Drive slowly, don\'t race with DTC buses! Bhagwan bless my beta! 🙏',
            perkTrigger: 'blessing',
            soundEffect: 'bell',
          },
          {
            text: 'Maa, earning good rupees today on NH-48 highway!',
            reply: 'Money is fine, but safety is everything! Keep your headlight clean, and don\'t take more than 3 passengers in the back! Nazar na lage mera beta! ❤️',
            perkTrigger: 'blessing',
            soundEffect: 'bell',
          },
          {
            text: 'Maa, bringing fresh ginger and vegetables when returning!',
            reply: 'Bahut ache! Also bring some coriander leaves from the mandi. Stay safe, see you soon beta!',
            perkTrigger: 'blessing',
          },
        ],
      },
    ],
  },
  {
    id: 'ramesh_mechanic',
    name: 'Ramesh Mistri (Auto Garage)',
    relation: 'Master Mechanic 🔧',
    number: '98450-44221',
    avatar: '👨‍🔧',
    color: 'from-blue-600 to-indigo-800',
    tagline: 'NH-48 Garage. Fixes any Bajaj 2-stroke with a 12mm wrench.',
    voicePitch: 0.85,
    voiceRate: 1.05,
    perk: {
      type: 'repair',
      label: 'Emergency Mobile Service',
      cost: 30,
      effectDescription: 'Dispatches Chhotu on motorbike to restore +50% Rickshaw Condition!',
    },
    dialogues: [
      {
        greeting:
          'Haan bhaiya! Ramesh Auto Works speaking. Is your carburetor coughing again or did you hit a giant highway pothole at 60 km/h?',
        choices: [
          {
            text: 'Ramesh bhai! Suspension is vibrating badly, need quick service! (₹30)',
            reply: 'Pakad ke baitho! Sending my chhotu on his bike right to your coordinate! *Clank clank* Spark plugs cleaned, axle grease replenished! Your rickshaw is ready for action!',
            perkTrigger: 'repair',
            soundEffect: 'repair',
          },
          {
            text: 'Bhaiya, how do I keep the 2-stroke engine from overheating?',
            reply: 'Always mix 20ml 2T oil per litre of petrol! And don\'t keep the accelerator pinned on high gear when climbing flyovers. Rest at chai tapri every hour!',
          },
        ],
      },
    ],
  },
  {
    id: 'munna_chai',
    name: 'Munna Chaiwala (Kadak Tapri)',
    relation: 'Chai Guru ☕',
    number: '98990-77882',
    avatar: '☕',
    color: 'from-amber-600 to-orange-700',
    tagline: 'Best adrak elaichi cutting chai on the highway.',
    voicePitch: 1.1,
    voiceRate: 1.1,
    perk: {
      type: 'chai',
      label: 'Super Cutting Chai Express',
      cost: 15,
      effectDescription: 'Instant piping hot cutting chai delivers 100% Chai Boost energy!',
    },
    dialogues: [
      {
        greeting:
          'Ram Ram bhai! Munna Chai Tapri at Mile 14. Fresh buffalo milk, crushed ginger, extra elaichi bubbling right now! What can I pour for you?',
        choices: [
          {
            text: 'Munna bhai! Urgent special cutting chai delivery! (₹15)',
            reply: 'Bhaiya cycle boy is already pedaling towards your auto with the kettle! *Gulp gulp* Full adrak power! Nitro chai boost charged to 100%!',
            perkTrigger: 'chai',
            soundEffect: 'chai',
          },
          {
            text: 'Munna, keep 2 bun-maskas ready, crossing in 2 minutes!',
            reply: 'Double butter already toasted on the tawa, bhaiya! Honk your loud horn when you pass the banyan tree!',
          },
        ],
      },
    ],
  },
  {
    id: 'traffic_patil',
    name: 'Hawaldar Patil (Traffic Police)',
    relation: 'NH-48 Chowki 👮',
    number: '103',
    avatar: '👮‍♂️',
    color: 'from-emerald-700 to-teal-900',
    tagline: 'Eagle eye on 2-wheel stunts, lane-cutting, and meter cheats.',
    voicePitch: 0.9,
    voiceRate: 1.0,
    dialogues: [
      {
        greeting:
          'Control Room Chowki. Hawaldar Patil speaking! Auto number MH-02-B-1234, I am watching you from the flyover! Why are you zigzagging between the trucks?!',
        choices: [
          {
            text: 'Sir! Emergency passenger on board, rushing to railway station!',
            reply: 'Acha, passenger emergency hai? Theek hai, proceed with caution! But no loud airhorn near the hospital zone, and watch for holy cows in the middle lane! Jai Hind!',
            perkTrigger: 'police_pass',
            soundEffect: 'police',
          },
          {
            text: 'Sir, I have valid license, PUC, and meter is calibrated!',
            reply: 'Shabash! Good honest driver. It is rare to see an auto with working meter! Keep left lane and drive safely!',
          },
        ],
      },
    ],
  },
  {
    id: 'kallu_don',
    name: 'Kallu Don (Station Rival)',
    relation: 'Rival Auto Driver 🛺',
    number: '99222-33445',
    avatar: '😎',
    color: 'from-purple-600 to-pink-800',
    tagline: 'Claims to have the fastest chrome-bumper rickshaw in the city.',
    voicePitch: 0.8,
    voiceRate: 1.15,
    dialogues: [
      {
        greeting:
          'Arey oye hero! You think your yellow roof is fast? I saw you overtaking that overloaded Tata truck! Station stand belongs to Kallu Bhai!',
        choices: [
          {
            text: 'Catch me if you can, Kallu! My 2-stroke engine roars like a tiger!',
            reply: 'Hahaha! Big words, chotey! Race me past the dhaba milestones! Whoever delivers more passengers pays for dinner at the highway restaurant!',
          },
          {
            text: 'Come on Kallu, there are plenty of passengers for everyone!',
            reply: 'Hahaha you have a big heart brother! Okay, truce for today. If my tyre punctures, don\'t laugh at me!',
          },
        ],
      },
    ],
  },
  {
    id: 'sharma_passenger',
    name: 'Sharma Ji (VIP Passenger)',
    relation: 'High-Paying Customer 💼',
    number: '98765-43210',
    avatar: '👨‍💼',
    color: 'from-cyan-600 to-blue-800',
    tagline: 'Always in a hurry to catch the 6:45 PM Shatabdi Express.',
    voicePitch: 1.15,
    voiceRate: 1.2,
    dialogues: [
      {
        greeting:
          'Hello?! Auto driver?! Where are you?! My watch says 6:30! The train will leave the platform in 15 minutes! Are you stuck in traffic or drinking chai?!',
        choices: [
          {
            text: 'Sharma Ji, stepping on the gas right now! Auto arriving in 60 seconds!',
            reply: 'Good! If you get me to Platform 1 before the guard waves the green flag, I will give you ₹50 extra bonus tip on the meter!',
          },
          {
            text: 'Relax Sharma Ji, shortcut through the temple road is totally clear!',
            reply: 'God bless you! Please dodge the potholes, my laptop is bouncing in my briefcase!',
          },
        ],
      },
    ],
  },
  {
    id: 'pandit_ji',
    name: 'Pandit Vidyanath (Astrologer)',
    relation: 'Auspicious Muhurat 🕉️',
    number: '98333-00108',
    avatar: '🧘‍♂️',
    color: 'from-yellow-500 to-amber-700',
    tagline: 'Tells your vehicle horoscope based on license plate numbers.',
    voicePitch: 0.95,
    voiceRate: 0.9,
    dialogues: [
      {
        greeting:
          'Hari Om! Pandit Vidyanath speaking. I checked your planetary stars: Today Mars and Rahu are aligning with your front wheel bearing!',
        choices: [
          {
            text: 'Pandit Ji, will I earn high fares and tips today?',
            reply: 'Tathastu! Auspicious stars predict fat wallets if you stay polite with elderly passengers and keep your hanging Nimbu-Mirchi charm swaying freely!',
            perkTrigger: 'blessing',
            soundEffect: 'bell',
          },
          {
            text: 'Is it safe to perform the 2-wheel stunt today?',
            reply: 'Beware of black cows and slippery speed breakers near sunset! Bow your head when passing the temple and luck shall guide your handlebar!',
          },
        ],
      },
    ],
  },
  {
    id: 'auto_union',
    name: 'Gupta Ji (Auto Union President)',
    relation: 'Union Leader 📢',
    number: '98100-55443',
    avatar: '🧔',
    color: 'from-red-600 to-rose-800',
    tagline: 'Fights for CNG price subsidies and fair meter rates.',
    voicePitch: 0.88,
    voiceRate: 1.0,
    dialogues: [
      {
        greeting:
          'Inquilab Zindabad, driver brother! Union office here. We just filed a petition with municipal council to fix the gigantic highway potholes at Sector 4!',
        choices: [
          {
            text: 'Zindabad Gupta Ji! When will CNG prices come down?',
            reply: 'We are holding a peace rally next Monday! Until then, keep your tyres inflated to 32 PSI to save fuel. Unity is strength!',
          },
          {
            text: 'Thanks Gupta Ji, keeping the rickshaw meter calibrated!',
            reply: 'You make our union proud! Honest service is the real pride of Indian auto drivers!',
          },
        ],
      },
    ],
  },
  {
    id: 'bollywood_director',
    name: 'Rocky Kapoor (Action Director)',
    relation: 'Bollywood Film City 🎬',
    number: '98222-77777',
    avatar: '🕶️',
    color: 'from-fuchsia-600 to-purple-800',
    tagline: 'Shooting a high-octane auto rickshaw chase scene.',
    voicePitch: 1.05,
    voiceRate: 1.1,
    dialogues: [
      {
        greeting:
          'Darling! Fabulous! Tremendous! I spotted your auto rickshaw drifting around the roundabout! I need a stunt driver for "Dhoom 5: Rickshaw Velocity"!',
        choices: [
          {
            text: 'Sir! I can do 2-wheel stunt and drift past any truck!',
            reply: 'Superb! Fantastic energy! You are going to be a superstar! Put on dark sunglasses and hit the highway with full throttle!',
          },
          {
            text: 'Will there be explosive action and helicopter chasing me?',
            reply: 'Yes! And background dancers at the petrol pump! Keep your horn buzzing, darling!',
          },
        ],
      },
    ],
  },
  {
    id: 'police_100',
    name: 'Police Emergency (100)',
    relation: 'Helpline 🚨',
    number: '100',
    avatar: '🚔',
    color: 'from-blue-700 to-red-600',
    tagline: 'State Highway Emergency Police Helpline.',
    voicePitch: 1.0,
    voiceRate: 1.0,
    dialogues: [
      {
        greeting:
          'Police Control Room 100. Highway emergency dispatch. What is your location and emergency?',
        choices: [
          {
            text: 'Reporting clear traffic and peaceful driving on NH-48!',
            reply: 'Thank you driver! Keep within speed limits, wear high-vis reflector, and have a safe journey!',
          },
          {
            text: 'There is a sacred cow resting comfortably in the right lane!',
            reply: 'Standard Indian highway condition! Please slow down, do not honk aggressively, and let Gau Mata pass peacefully!',
          },
        ],
      },
    ],
  },
  {
    id: 'telecom_198',
    name: 'AirJio Telecom (198 IVR)',
    relation: 'Customer Support 🤖',
    number: '198',
    avatar: '📶',
    color: 'from-blue-500 to-indigo-600',
    tagline: 'Automated 24x7 IVR Helpline.',
    voicePitch: 1.2,
    voiceRate: 0.95,
    dialogues: [
      {
        greeting:
          'Welcome to AirJio 5G Auto Driver Helpline! Press 1 for Hindi, Press 2 for English. Press 9 to complain about network drops under the flyover...',
        choices: [
          {
            text: 'Press 1 (Hindi) / Samosa combo plan enquiry',
            reply: 'Apka daily 2GB data pack active hai! Enjoy unlimited streaming of old Kishore Kumar hits on your auto radio!',
          },
          {
            text: 'Press 9 (Talk to Executive)',
            reply: 'All customer service executives are currently having hot samosa and chai. Your estimated wait time is 47 minutes. Dhanyawad!',
          },
        ],
      },
    ],
  },
  {
    id: 'ambulance_108',
    name: 'Ambulance Highway SOS (108)',
    relation: 'Emergency 🚑',
    number: '108',
    avatar: '🚑',
    color: 'from-red-600 to-rose-700',
    tagline: '24/7 National Emergency Medical Rescue.',
    voicePitch: 1.05,
    voiceRate: 1.05,
    dialogues: [
      {
        greeting:
          '108 National Emergency Response! Highway ambulance dispatched from Mile 18. Auto drivers, please make way on the right lane with dipper blinking!',
        choices: [
          {
            text: 'Giving clearance, keeping my rickshaw on the far left lane!',
            reply: 'Thank you brother! Excellent road discipline! You are a hero of the Indian roads!',
            perkTrigger: 'blessing',
          },
        ],
      },
    ],
  },
  {
    id: 'pooja_passenger',
    name: 'Pooja (College Student Regular)',
    relation: 'Regular Passenger 🎒',
    number: '98111-22334',
    avatar: '👩‍🎓',
    color: 'from-pink-500 to-rose-600',
    tagline: 'Takes auto daily from Metro Gate 3 to University.',
    voicePitch: 1.3,
    voiceRate: 1.1,
    dialogues: [
      {
        greeting:
          'Bhaiya ji hello! Are you near Metro Gate 3? Professor is giving surprise attendance quiz in 10 minutes! Can you pick me up quickly?',
        choices: [
          {
            text: 'Arriving in 30 seconds! Put your helmet strap on, Pooja bitiya!',
            reply: 'Yay bhaiya best! I will pay by UPI and give you 5-star rating on the auto meter app!',
            perkTrigger: 'blessing',
          },
          {
            text: 'Don\'t worry, auto shortcut through university lane beats all traffic!',
            reply: 'Superb! Keep the Bollywood radio playing, my favorite song is on!',
          },
        ],
      },
    ],
  },
  {
    id: 'chachi_marriage',
    name: 'Chachi Ji (Rishta Aunty)',
    relation: 'Matchmaker Aunty 💍',
    number: '98400-99887',
    avatar: '🧕',
    color: 'from-fuchsia-700 to-purple-900',
    tagline: 'Has matrimonial biodatas for every auto driver in the colony.',
    voicePitch: 1.25,
    voiceRate: 1.15,
    dialogues: [
      {
        greeting:
          'Arrey beta suno! Sharma Ji\'s cousin sister has a lovely daughter! Government job, knows how to make round rotis! When are you buying a new green CNG auto for the wedding procession?',
        choices: [
          {
            text: 'Chachi ji, first let me pay off the rickshaw meter loan!',
            reply: 'Loans will come and go beta! But good auspicious marriage date won\'t wait! Keep earning well today, I am sending the photo on WhatsApp!',
          },
          {
            text: 'Chachi ji, right now concentrating on highway driving!',
            reply: 'Always working hard, very good boy! I tell everyone my nephew drives the fastest, cleanest rickshaw in Delhi-NCR!',
            perkTrigger: 'blessing',
          },
        ],
      },
    ],
  },
  {
    id: 'priya_spam_loan',
    name: 'Priya (QuickPaisa Spam Loan)',
    relation: 'Spam Caller 📞',
    number: '022-68991234',
    avatar: '🤖',
    color: 'from-zinc-600 to-slate-800',
    tagline: 'Calls daily offering pre-approved ₹10 Lakh auto loans with 0% paperwork.',
    voicePitch: 1.35,
    voiceRate: 1.25,
    dialogues: [
      {
        greeting:
          'Good afternoon sir! Am I speaking with the esteemed owner of Bajaj Rickshaw? Sir, congratulations! You are pre-approved for an instant personal loan of ₹15 Lakhs at zero interest!',
        choices: [
          {
            text: 'Madam, can this loan buy a gold-plated auto rickshaw with AC?',
            reply: 'Sir... hello sir? Our financial policy covers standard vehicle upgrades only... Sir are you honking your horn in the speaker?! *Click*',
          },
          {
            text: 'Madam, I am driving at 70 km/h, please don\'t disturb on highway!',
            reply: 'Oh sorry sir! But if you need credit card just press 1... *Beep beep*',
          },
        ],
      },
    ],
  },
  {
    id: 'halwai_kaka',
    name: 'Kaka Halwai (Fresh Jalebi)',
    relation: 'Sweet Master 🥨',
    number: '98777-66554',
    avatar: '👨‍🍳',
    color: 'from-amber-600 to-yellow-700',
    tagline: 'Crispy thin jalebis fried in desi ghee right by the toll plaza.',
    voicePitch: 1.0,
    voiceRate: 1.0,
    dialogues: [
      {
        greeting:
          'Jai Shri Krishna! Kaka Halwai near Toll Plaza. Big batch of piping hot saffron jalebis and spicy kachori just came out of the kadhai!',
        choices: [
          {
            text: 'Kaka, keep 250g hot jalebi packed, stopping my auto in 2 minutes!',
            reply: 'Packed in fresh paper box with rabri! Perfect fuel for a long highway drive, driver bhai!',
            perkTrigger: 'chai',
          },
        ],
      },
    ],
  },
];

// Hilarious Random Numbers for when the user dials unknown numbers on the dial pad!
export const RANDOM_CALL_PERSONAS = [
  {
    name: 'Wrong Number Uncle',
    number: 'Custom',
    avatar: '👴🏽',
    greeting: 'Haan hello?! Murli?! Arrey I told you thrice, this is Gupta Kirana Store! Why are you calling for auto rickshaw booking? We sell basmati rice and mustard oil here!',
    reply: 'Next time check the dialpad before pressing call! Now let me finish my ledger book!',
  },
  {
    name: 'Chor Bazar Battery Shop',
    number: 'Custom',
    avatar: '🔋',
    greeting: 'Salam bhai! Special discount today on Exide auto batteries and chrome side mirrors! Fresh shipment arrived from Mumbai!',
    reply: 'Drive by our shop near the junction, we will tune your horn so loud it wakes up the next town!',
  },
  {
    name: 'Lottery Scam Uncle',
    number: 'Custom',
    avatar: '🎰',
    greeting: 'Congratulations bhai sahab! Your SIM card won 25 Lakh Rupees in Kaun Banega Crorepati lucky draw! Send ₹200 processing fee on UPI!',
    reply: 'Arrey wait! Don\'t cut the phone! At least give me free auto ride to the bank!',
  },
  {
    name: 'Irritated Sweet Shop Owner',
    number: 'Custom',
    avatar: '🍬',
    greeting: 'Bikaner Sweets! Fresh hot jalebis and gulab jamuns coming out of pure ghee! Are you picking up the wedding order?!',
    reply: 'Oh you are an auto driver? Well drop by and have two jalebis with rabri! Best energy for driving!',
  },
  {
    name: 'Highway Sher-e-Punjab Dhaba',
    number: 'Custom',
    avatar: '🥘',
    greeting: 'Oye Sher-e-Punjab Dhaba! Tandoori roti, butter chicken, and lassi glasses as big as a flower pot! Table ready for you driver ji!',
    reply: 'Park your auto in front of the cot, driver gets 20% discount on dal tadka!',
  },
  {
    name: 'Sleepy College Student',
    number: 'Custom',
    avatar: '😴',
    greeting: 'Mmmph... hello? Mom please, five more minutes, my engineering lecture starts at 10... Wait, who are you? Why is your phone making tuk-tuk noises?!',
    reply: 'Dude, you\'re an auto driver?! Please don\'t hang up, can you come pick me up outside Boys Hostel right now?!',
  },
  {
    name: 'Indian Telecom Automated IVR',
    number: 'Custom',
    avatar: '🤖',
    greeting: 'Aapke dwara dial kiya gaya number vartamaan me apyashya hai. The dialed customer is currently driving an auto-rickshaw or out of coverage area. Kripya thodi der baad prayas karein.',
    reply: 'Thank you for choosing Bharat 5G Cellular Network. Shubh Yatra!',
  },
  {
    name: 'Cricket Commentator Fan',
    number: 'Custom',
    avatar: '🏏',
    greeting: 'SIX RUNS! What a shot over mid-wicket! Hello?! Yes, who is this?! India needs 14 runs in 8 balls, talk fast before the bowler runs in!',
    reply: 'Turn on your auto radio on Vividh Bharati, Virat Kohli is batting like a master!',
  },
  {
    name: 'Towing Crane Dispatcher',
    number: 'Custom',
    avatar: '🏗️',
    greeting: 'Highway Crane Salvage Control. Did your rickshaw slide into the monsoon ditch or did your chassis snap on a speed bump?',
    reply: 'Drive gently over the flyovers, brother! Keep your tyre pressure 30 PSI and stay out of the ditch!',
  },
];

export const INITIAL_PHONE_MESSAGES: PhoneMessage[] = [
  {
    id: 'msg-1',
    senderId: 'maa',
    senderName: 'Maa (Mom)',
    senderAvatar: '👵',
    time: '5:42 PM',
    snippet: 'Beta bring 1kg aloo & tomatoes when coming home...',
    fullText: 'Beta bring 1kg aloo and fresh red tomatoes from the highway subzi mandi when coming home! Also drive safely, the fog starts at sunset.',
    isUnread: true,
  },
  {
    id: 'msg-2',
    senderId: 'ramesh_mechanic',
    senderName: 'Ramesh Mistri',
    senderAvatar: '👨‍🔧',
    time: '4:15 PM',
    snippet: 'Bhaiya your spare spark plug has arrived at garage...',
    fullText: 'Bhaiya, that imported Bosch spark plug for your Bajaj RE arrived today. Come by whenever your meter is free!',
    isUnread: false,
  },
  {
    id: 'msg-3',
    senderId: 'munna_chai',
    senderName: 'Munna Chaiwala',
    senderAvatar: '☕',
    time: '2:30 PM',
    snippet: 'Hot samosas fresh out of kadhai! Come fast!',
    fullText: 'Bhaiya, fresh batch of crispy samosa with spicy mint chutney just taken out! First 2 samosas free with 1 cutting chai for auto drivers!',
    isUnread: false,
  },
  {
    id: 'msg-4',
    senderId: 'auto_union',
    senderName: 'Gupta Ji (Union)',
    senderAvatar: '📢',
    time: 'Yesterday',
    snippet: 'Reminder: New fare revision circular issued...',
    fullText: 'All brothers please note: Minimum fare updated to ₹25. Keep your electronic meter calibrated and receipt rolls loaded. Jai Rickshaw!',
    isUnread: false,
  },
];

export const INITIAL_CALL_LOGS: CallLog[] = [
  { id: 'log-1', name: 'Maa (Mom)', number: '98200-10800', avatar: '👵', type: 'incoming', time: '5:40 PM', duration: '1m 24s' },
  { id: 'log-2', name: 'Ramesh Mistri', number: '98450-44221', avatar: '👨‍🔧', type: 'outgoing', time: '4:10 PM', duration: '45s' },
  { id: 'log-3', name: 'Sharma Ji', number: '98765-43210', avatar: '💼', type: 'missed', time: '3:05 PM' },
  { id: 'log-4', name: 'Munna Chaiwala', number: '98990-77882', avatar: '☕', type: 'outgoing', time: '1:50 PM', duration: '28s' },
];

// Helper to speak speech safely using browser Web Speech API
export function speakCallerVoice(text: string, pitch = 1.0, rate = 1.0) {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;

      // Try finding Indian English or Hindi voice if supported
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('India')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export function stopCallerVoice() {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore
  }
}
