import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  MessageSquare,
  Clock,
  Delete,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  Sparkles,
  Wrench,
  Coffee,
  ShieldCheck,
  Send,
  Search,
  Wifi,
  BatteryCharging,
  Sliders,
  Flame,
  Globe,
} from 'lucide-react';
import { GameEngine, IncomingCallAlert } from '../game/engine';
import { sounds } from '../game/audio';
import { PhoneInternetApp } from './PhoneInternetApp';
import {
  PHONE_CONTACTS,
  RANDOM_CALL_PERSONAS,
  INITIAL_PHONE_MESSAGES,
  INITIAL_CALL_LOGS,
  PhoneContact,
  PhoneMessage,
  CallLog,
  DialogueChoice,
  speakCallerVoice,
  stopCallerVoice,
} from '../game/phone';

interface DesiPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine | null;
  incomingCallAlert: IncomingCallAlert | null;
  onDismissIncomingAlert: () => void;
}

export const DesiPhoneModal: React.FC<DesiPhoneModalProps> = ({
  isOpen,
  onClose,
  engine,
  incomingCallAlert,
  onDismissIncomingAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'dialer' | 'contacts' | 'messages' | 'recents' | 'sos' | 'internet'>('contacts');
  const [dialNumber, setDialNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // OPPO F27 5G Hardware Themes: Amber Orange & Emerald Green
  const [phoneColor, setPhoneColor] = useState<'amber' | 'emerald'>('amber');
  const [haloMode, setHaloMode] = useState<'breathing' | 'party' | 'steady'>('breathing');
  const [isUltraVolume, setIsUltraVolume] = useState(true);

  // Call session states
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'dialing' | 'connected' | 'ended'>('idle');
  const [activeContact, setActiveContact] = useState<{
    id?: string;
    name: string;
    number: string;
    avatar: string;
    relation: string;
    voicePitch: number;
    voiceRate: number;
  } | null>(null);

  const [callTimer, setCallTimer] = useState(0);
  const [currentDialogueText, setCurrentDialogueText] = useState('');
  const [currentChoices, setCurrentChoices] = useState<DialogueChoice[]>([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Messages and Logs state
  const [messages, setMessages] = useState<PhoneMessage[]>(INITIAL_PHONE_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState<PhoneMessage | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);

  const callIntervalRef = useRef<number | null>(null);
  const ringbackTimeoutRef = useRef<number | null>(null);

  // If an incoming call is received and modal is open (or opened from incoming banner)
  useEffect(() => {
    if (incomingCallAlert && isOpen) {
      const contact = PHONE_CONTACTS.find((c) => c.id === incomingCallAlert.contactId) || {
        id: incomingCallAlert.contactId,
        name: incomingCallAlert.name,
        number: incomingCallAlert.number,
        avatar: incomingCallAlert.avatar,
        relation: incomingCallAlert.relation,
        voicePitch: 1.0,
        voiceRate: 1.0,
        dialogues: [],
      };
      setActiveContact(contact);
      setCallState('incoming');
    }
  }, [incomingCallAlert, isOpen]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      handleCutCall(false);
    };
  }, []);

  // Keyboard shortcut: Press ESC or 'C' key while on call / incoming call to Cut Call
  useEffect(() => {
    const handlePhoneKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (callState !== 'idle' && (e.key === 'Escape' || e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        handleCutCall(true);
      }
    };
    window.addEventListener('keydown', handlePhoneKeyDown);
    return () => window.removeEventListener('keydown', handlePhoneKeyDown);
  }, [callState, activeContact]);

  // Call timer effect
  useEffect(() => {
    if (callState === 'connected') {
      callIntervalRef.current = window.setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [callState]);

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start outgoing or answer incoming call
  const startCallSession = (
    contact: {
      id?: string;
      name: string;
      number: string;
      avatar: string;
      relation: string;
      voicePitch: number;
      voiceRate: number;
      dialogues?: PhoneContact['dialogues'];
    },
    isIncoming = false
  ) => {
    sounds.playPhoneClick();
    setActiveContact(contact);
    setCallTimer(0);

    if (isIncoming) {
      // Incoming ringing mode
      setCallState('incoming');
    } else {
      // Outgoing call
      setCallState('dialing');
      sounds.playRingbackTone();

      // Log call
      const newLog: CallLog = {
        id: `call-${Date.now()}`,
        name: contact.name,
        number: contact.number,
        avatar: contact.avatar,
        type: 'outgoing',
        time: 'Just now',
      };
      setCallLogs((prev) => [newLog, ...prev]);

      ringbackTimeoutRef.current = window.setTimeout(() => {
        sounds.playCallConnected();
        setCallState('connected');

        const fullContact = PHONE_CONTACTS.find((c) => c.id === contact.id);
        if (fullContact && fullContact.dialogues.length > 0) {
          const dialogue = fullContact.dialogues[0];
          setCurrentDialogueText(dialogue.greeting);
          setCurrentChoices(dialogue.choices);
          speakCallerVoice(dialogue.greeting, fullContact.voicePitch, fullContact.voiceRate);
        } else {
          // Unknown / Random dialed number response
          const randomPersona =
            RANDOM_CALL_PERSONAS[Math.floor(Math.random() * RANDOM_CALL_PERSONAS.length)];
          setCurrentDialogueText(randomPersona.greeting);
          setCurrentChoices([
            {
              text: 'Sorry wrong number uncle ji, driving auto right now!',
              reply: randomPersona.reply,
            },
          ]);
          speakCallerVoice(randomPersona.greeting, 0.95, 1.05);
        }
      }, 2200);
    }
  };

  // Answer an incoming call
  const handleAnswerIncomingCall = () => {
    if (!activeContact) return;
    sounds.stopPhoneRingtone();
    sounds.playCallConnected();
    onDismissIncomingAlert();
    engine?.dismissIncomingCall();
    setCallState('connected');
    setCallTimer(0);

    // Log call
    const newLog: CallLog = {
      id: `call-${Date.now()}`,
      name: activeContact.name,
      number: activeContact.number,
      avatar: activeContact.avatar,
      type: 'incoming',
      time: 'Just now',
    };
    setCallLogs((prev) => [newLog, ...prev]);

    // Trigger dialogue
    const fullContact = PHONE_CONTACTS.find((c) => c.id === activeContact.id);
    const dialogue = fullContact?.dialogues[0];
    const greeting =
      dialogue?.greeting ||
      `Haan hello! ${activeContact.name} here. Auto chalate waqt phone uthane ka shukriya! Drive carefully!`;
    setCurrentDialogueText(greeting);
    setCurrentChoices(dialogue?.choices || []);
    speakCallerVoice(greeting, activeContact.voicePitch, activeContact.voiceRate);
  };

  // Cut call - ends incoming, dialing, or connected calls
  const handleCutCall = (playHangupSound = true) => {
    if (ringbackTimeoutRef.current) {
      clearTimeout(ringbackTimeoutRef.current);
      ringbackTimeoutRef.current = null;
    }
    sounds.stopPhoneRingtone();
    stopCallerVoice();
    if (playHangupSound) {
      sounds.playCallHangup();
    }

    if (callState === 'incoming') {
      if (activeContact) {
        const missedLog: CallLog = {
          id: `call-${Date.now()}`,
          name: activeContact.name,
          number: activeContact.number,
          avatar: activeContact.avatar,
          type: 'missed',
          time: 'Just now',
        };
        setCallLogs((prev) => [missedLog, ...prev]);
      }
      onDismissIncomingAlert();
      engine?.dismissIncomingCall();
    }

    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setActiveContact(null);
      setCurrentDialogueText('');
      setCurrentChoices([]);
    }, 1100);
  };

  const endCallSession = handleCutCall;

  const handleSelectChoice = (choice: DialogueChoice) => {
    sounds.playPhoneClick();
    setCurrentDialogueText(choice.reply);
    setCurrentChoices([]); // Clear further choices for this response

    if (activeContact) {
      speakCallerVoice(choice.reply, activeContact.voicePitch, activeContact.voiceRate);
    }

    // Trigger associated in-game perk
    if (choice.perkTrigger === 'repair' && engine) {
      engine.repairVehicle(55, 30);
    } else if (choice.perkTrigger === 'chai' && engine) {
      engine.boostChai(75, 15);
    } else if (choice.perkTrigger === 'blessing' && engine) {
      engine.grantBlessing();
    } else if (choice.perkTrigger === 'police_pass' && engine) {
      engine.setStateMessage('👮 Hawaldar Patil granted highway clearance! Keep left.');
    }
  };

  // Dialpad handlers
  const handleDialKey = (key: string) => {
    if (dialNumber.length >= 14) return;
    sounds.playDtmf(key);
    setDialNumber((prev) => prev + key);
  };

  const handleDialDelete = () => {
    sounds.playPhoneClick();
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const handleStartDialCall = () => {
    if (!dialNumber) return;
    const cleanNum = dialNumber.replace(/[^0-9]/g, '');
    const matched = PHONE_CONTACTS.find((c) => c.number.replace(/[^0-9]/g, '') === cleanNum);

    if (matched) {
      startCallSession(matched);
    } else {
      // Dial custom persona
      const randomPersona =
        RANDOM_CALL_PERSONAS[Math.floor(Math.random() * RANDOM_CALL_PERSONAS.length)];
      startCallSession({
        name: `${randomPersona.name}`,
        number: dialNumber,
        avatar: randomPersona.avatar,
        relation: 'Simulated In-Game Citizen (Not Real)',
        voicePitch: 1.0,
        voiceRate: 1.0,
      });
    }
    setDialNumber('');
  };

  // Quick SOS service trigger
  const handleTriggerPerk = (type: 'repair' | 'chai' | 'police' | 'blessing') => {
    sounds.playPhoneClick();
    if (type === 'repair') {
      const ramesh = PHONE_CONTACTS.find((c) => c.id === 'ramesh_mechanic');
      if (ramesh) startCallSession(ramesh);
    } else if (type === 'chai') {
      const munna = PHONE_CONTACTS.find((c) => c.id === 'munna_chai');
      if (munna) startCallSession(munna);
    } else if (type === 'police') {
      const police = PHONE_CONTACTS.find((c) => c.id === 'traffic_patil');
      if (police) startCallSession(police);
    } else {
      const pandit = PHONE_CONTACTS.find((c) => c.id === 'pandit_ji');
      if (pandit) startCallSession(pandit);
    }
  };

  const handleSendMessage = () => {
    if (!replyInput.trim() || !selectedMessage) return;
    sounds.playPhoneClick();
    const newMsg: PhoneMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: 'You (Auto Driver)',
      senderAvatar: '🛺',
      time: 'Just now',
      snippet: replyInput,
      fullText: replyInput,
      isUnread: false,
    };
    setMessages((prev) => [newMsg, ...prev]);
    setReplyInput('');
    if (engine) {
      engine.setStateMessage('💬 SMS sent from OPPO F27 5G!');
    }
  };

  if (!isOpen) return null;

  // Filtered contacts based on search query or keypad digits
  const filteredContacts = PHONE_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.relation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.number.includes(searchQuery)
  );

  // Smart T9 Keypad Matcher: matches digits to letters or numbers
  const t9Matches = dialNumber
    ? PHONE_CONTACTS.filter((c) => {
        const clean = c.number.replace(/[^0-9]/g, '');
        return clean.includes(dialNumber) || c.name.toLowerCase().includes(dialNumber.toLowerCase());
      }).slice(0, 3)
    : [];

  // Theme styles based on Amber Orange vs Emerald Green
  const phoneThemeStyles =
    phoneColor === 'amber'
      ? {
          casingBg: 'bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-950/80',
          borderAccent: 'border-amber-600/70',
          glowRing: 'rgba(245, 158, 11, 0.45)',
          haloColor: '#f59e0b',
          badgeText: 'Amber Orange Leatherette',
        }
      : {
          casingBg: 'bg-gradient-to-br from-emerald-950 via-zinc-900 to-teal-950/80',
          borderAccent: 'border-emerald-600/70',
          glowRing: 'rgba(16, 185, 129, 0.45)',
          haloColor: '#10b981',
          badgeText: 'Emerald Green Glass',
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* OPPO F27 5G Smartphone Hardware Casing */}
      <div
        className={`relative w-full max-w-[380px] h-[700px] max-h-[94vh] ${phoneThemeStyles.casingBg} rounded-[46px] p-3 shadow-2xl border-4 ${phoneThemeStyles.borderAccent} flex flex-col overflow-hidden ring-2 ring-white/10`}
        style={{
          boxShadow: `0 25px 60px -15px ${phoneThemeStyles.glowRing}, inset 0 0 20px rgba(0,0,0,0.8)`,
        }}
      >
        {/* OPPO F27 5G Signature Breathing Halo Light Ring along top rim */}
        <div
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full ${
            haloMode === 'party'
              ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 animate-pulse'
              : haloMode === 'breathing'
              ? 'bg-amber-400/90 animate-pulse'
              : 'bg-amber-400/70'
          } shadow-lg shadow-amber-500/50 z-30 transition-all`}
        />

        {/* Top Hardware bezel: Central Punch-hole Camera & Ear Speaker Grill */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 bg-black/90 rounded-b-2xl z-30 flex items-center justify-center space-x-3">
          <div className="w-12 h-1 bg-zinc-700/80 rounded-full" />
          <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
          </div>
        </div>

        {/* Top Bar Branding: OPPO F27 5G Badge & Color Selector */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1 z-30 text-[10px]">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold tracking-wider text-amber-300 font-sans">OPPO F27 5G</span>
            <span className="text-zinc-400 font-mono text-[9px] bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
              ColorOS 14
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Color Switcher */}
            <button
              onClick={() => {
                sounds.playPhoneClick();
                setPhoneColor(phoneColor === 'amber' ? 'emerald' : 'amber');
              }}
              className="px-1.5 py-0.5 rounded-md bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer border border-zinc-700 text-[9px]"
              title="Toggle OPPO F27 5G Finish"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  phoneColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span className="capitalize">{phoneColor}</span>
            </button>

            {/* Put in Pocket / Close */}
            <button
              onClick={() => {
                endCallSession(false);
                onClose();
              }}
              className="p-1 rounded-full bg-zinc-800/90 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer"
              title="Close Phone (Press P)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Smartphone Inner Screen (FHD+ OLED 120Hz Style) */}
        <div className="relative w-full flex-1 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 rounded-[34px] overflow-hidden flex flex-col border border-zinc-800/90">
          {/* ColorOS Status Bar with Aqua Dynamics Capsule */}
          <div className="pt-2 px-4 pb-1 flex justify-between items-center text-[10px] font-semibold text-zinc-300 select-none z-20 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/40">
            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-zinc-200">06:42 PM</span>
              {/* Dynamic Capsule Island */}
              <button
                onClick={() => {
                  sounds.playPhoneClick();
                  setActiveTab('internet');
                }}
                className="px-2 py-0.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[9px] text-cyan-300 flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                title="Tap to Open 5G Web & Internet App"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{callState === 'connected' ? `Call: ${formatCallTime(callTimer)}` : 'AirJio 5G 🌐'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('internet');
              }}
              className="flex items-center space-x-2 text-[10px] cursor-pointer hover:opacity-80 transition"
              title="Tap to Launch 5G Internet Browser"
            >
              <span className="text-cyan-400 font-bold tracking-tight">5G+ VoNR</span>
              <Wifi className="w-3 h-3 text-cyan-300" />
              {isUltraVolume && (
                <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                  300%
                </span>
              )}
              <div className="flex items-center space-x-0.5 text-emerald-400 font-mono">
                <span>94%</span>
                <BatteryCharging className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Fictional Virtual Network Notice Badge */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-amber-950/30 to-cyan-950/40 px-3 py-1 border-b border-cyan-500/20 flex items-center justify-between text-[9px] text-cyan-200 select-none">
            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('internet');
              }}
              className="flex items-center gap-1 hover:text-white cursor-pointer transition text-left"
            >
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">5G Internet Live • Wikipedia, Weather, Rates & AI</span>
            </button>
            <span className="text-amber-400 font-mono shrink-0 ml-1">ColorOS 14</span>
          </div>

          {/* ========================================================= */}
          {/* ACTIVE CALL OVERLAY SCREEN (When Dialing or Connected) */}
          {/* ========================================================= */}
          {callState !== 'idle' && activeContact && (
            <div className="absolute inset-0 z-30 bg-gradient-to-b from-slate-950 via-zinc-950 to-zinc-950 flex flex-col p-4 justify-between animate-in zoom-in-95 duration-200">
              {/* Header with Glowing Halo Effect */}
              <div className="pt-4 text-center relative">
                {/* Simulated Halo Light effect ring around avatar */}
                <div className="relative mx-auto w-24 h-24 mb-3 flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full border-2 ${
                      callState === 'connected'
                        ? 'border-amber-400/60 animate-ping'
                        : 'border-cyan-400/40 animate-pulse'
                    }`}
                  />
                  {/* Oppo Cosmos Ring Outer Bezel */}
                  <div className="absolute -inset-1 rounded-full border border-amber-500/50 shadow-lg shadow-amber-500/20" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-700 shadow-xl flex items-center justify-center text-4xl border-2 border-white/20">
                    {activeContact.avatar}
                  </div>
                </div>

                <div className="inline-block px-3 py-0.5 rounded-full bg-white/10 text-emerald-300 font-medium text-xs mb-1 border border-white/10">
                  {callState === 'incoming' && '🔔 Incoming Call • AirJio 5G'}
                  {callState === 'dialing' && 'Connecting on AirJio 5G...'}
                  {callState === 'connected' && `In Call • ${formatCallTime(callTimer)}`}
                  {callState === 'ended' && 'Call Cut / Disconnected'}
                </div>

                <h3 className="text-lg font-bold text-white tracking-wide">{activeContact.name}</h3>
                <p className="text-xs text-amber-300 font-medium">{activeContact.relation}</p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{activeContact.number}</p>
              </div>

              {/* Spoken Dialogue Speech Subtitles & Animated Audio Wave */}
              <div className="flex-1 flex flex-col justify-center my-2 px-1">
                {callState === 'incoming' && (
                  <div className="text-center py-4 bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 my-2 backdrop-blur-md">
                    <p className="text-xs text-amber-300 font-bold animate-pulse mb-1 flex items-center justify-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-emerald-400" /> Incoming Voice Call...
                    </p>
                    <p className="text-[11px] text-zinc-300">
                      Auto-rickshaw driver! Tap Answer to talk or Cut Call to decline.
                    </p>
                  </div>
                )}

                {callState === 'connected' && (
                  <div className="bg-zinc-900/90 border border-white/15 rounded-2xl p-3.5 backdrop-blur-md shadow-inner max-h-[200px] overflow-y-auto scrollbar-thin">
                    {/* Simulated Voice Waveform */}
                    <div className="flex items-center justify-center space-x-1 mb-2.5 opacity-90">
                      {[14, 26, 18, 30, 22, 16, 28, 20, 24].map((height, i) => (
                        <div
                          key={i}
                          className="w-1 bg-amber-400 rounded-full animate-pulse"
                          style={{
                            height: `${height}px`,
                            animationDuration: `${0.35 + (i % 4) * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-zinc-100 leading-relaxed italic text-center font-sans">
                      &ldquo;{currentDialogueText}&rdquo;
                    </p>

                    {/* Interactive Response Choices */}
                    {currentChoices.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2.5">
                        <p className="text-[10px] text-amber-300 uppercase tracking-wider font-bold text-center">
                          Choose Rickshaw Driver Reply:
                        </p>
                        {currentChoices.map((choice, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectChoice(choice)}
                            className="w-full text-left text-[11px] p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/30 text-amber-100 font-medium transition-all active:scale-[0.98] cursor-pointer"
                          >
                            💬 {choice.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {callState === 'dialing' && (
                  <div className="text-center py-6">
                    <div className="inline-block w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-zinc-300 animate-pulse">
                      Calling fictional persona on OPPO F27 5G...
                    </p>
                  </div>
                )}

                {callState === 'ended' && (
                  <div className="text-center py-6 text-rose-400 font-bold text-sm bg-rose-950/20 rounded-2xl border border-rose-900/30 p-3">
                    ❌ Call Cut. Shubh Yatra!
                  </div>
                )}
              </div>

              {/* Call Controls: Answer or Cut Call */}
              <div className="pb-3">
                {callState === 'incoming' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center gap-4 w-full px-2">
                      {/* Green Answer Call Button */}
                      <button
                        onClick={handleAnswerIncomingCall}
                        className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/80 border border-emerald-400/40 active:scale-95 transition cursor-pointer"
                        title="Answer Incoming Call"
                      >
                        <PhoneCall className="w-4 h-4 fill-current animate-bounce" />
                        <span>Answer</span>
                      </button>

                      {/* Red Cut Call Button */}
                      <button
                        onClick={() => handleCutCall(true)}
                        className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/80 border border-rose-400/40 active:scale-95 transition cursor-pointer group"
                        title="Cut Call (Reject)"
                      >
                        <PhoneOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="uppercase tracking-wider">Cut Call</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">Press [ESC] or Tap to Cut Call</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center items-center space-x-6 mb-4">
                      <button
                        onClick={() => setIsMicMuted(!isMicMuted)}
                        className={`p-3 rounded-full transition-colors cursor-pointer ${
                          isMicMuted
                            ? 'bg-rose-500/30 text-rose-300'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="Mute Mic"
                      >
                        {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => {
                          sounds.playPhoneClick();
                          setIsSpeakerOn(!isSpeakerOn);
                        }}
                        className={`p-3 rounded-full transition-colors cursor-pointer ${
                          isSpeakerOn
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="Toggle Speakerphone (Ultra Volume 300%)"
                      >
                        {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => {
                          sounds.playPhoneClick();
                          setHaloMode(haloMode === 'breathing' ? 'party' : 'breathing');
                        }}
                        className="p-3 rounded-full bg-white/10 text-amber-300 hover:bg-white/20 transition-colors cursor-pointer"
                        title="Toggle Halo Light Effect"
                      >
                        <Flame className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Big Dedicated Red Cut Call Button */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => handleCutCall(true)}
                        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-rose-950/80 border border-rose-400/40 active:scale-95 transition-all cursor-pointer group"
                        title="Cut Call (Disconnect)"
                      >
                        <div className="w-7 h-7 rounded-full bg-rose-700/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                          <PhoneOff className="w-4 h-4 fill-current" />
                        </div>
                        <span className="tracking-wider uppercase">Cut Call</span>
                      </button>
                      <span className="text-[10px] text-zinc-400 font-mono">Press [ESC] to Cut Call</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB CONTENT (Contacts, Keypad Dialer, SMS, Logs, Services) */}
          {/* ========================================================= */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 1. CONTACTS TAB */}
            {activeTab === 'contacts' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" /> ColorOS Contacts
                  </h2>
                  <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
                    {PHONE_CONTACTS.length} Fictional Contacts
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Maa, Mechanic, Police, Spam..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="group flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 transition-all hover:border-zinc-700"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-tr ${contact.color} flex items-center justify-center text-lg shadow-sm shrink-0`}
                        >
                          {contact.avatar}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                            {contact.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate">{contact.tagline}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => startCallSession(contact)}
                        className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-sm active:scale-95 transition-transform ml-2 cursor-pointer"
                        title={`Call ${contact.name}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. KEYPAD DIALER TAB (Call Anyone - Not In Real) */}
            {activeTab === 'dialer' && (
              <div className="flex-1 flex flex-col px-3 py-1.5 justify-between overflow-hidden">
                {/* Number Display */}
                <div className="text-center py-1 min-h-[44px] flex items-center justify-center relative">
                  <span className="text-2xl font-mono font-bold tracking-wider text-white">
                    {dialNumber || (
                      <span className="text-zinc-600 text-sm">Dial Any Number (Procedural)...</span>
                    )}
                  </span>
                  {dialNumber && (
                    <button
                      onClick={handleDialDelete}
                      className="absolute right-2 p-1.5 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Smart T9 Contact Match Preview */}
                {t9Matches.length > 0 && (
                  <div className="flex items-center gap-1.5 py-1 px-1 overflow-x-auto scrollbar-none">
                    <span className="text-[9px] text-amber-400 font-bold uppercase shrink-0">Match:</span>
                    {t9Matches.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => startCallSession(m)}
                        className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <span>{m.avatar}</span>
                        <span className="truncate max-w-[80px]">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Keypad Grid 1-9, *, 0, # */}
                <div className="grid grid-cols-3 gap-2 max-w-[270px] mx-auto w-full my-auto">
                  {[
                    { key: '1', sub: '' },
                    { key: '2', sub: 'ABC' },
                    { key: '3', sub: 'DEF' },
                    { key: '4', sub: 'GHI' },
                    { key: '5', sub: 'JKL' },
                    { key: '6', sub: 'MNO' },
                    { key: '7', sub: 'PQRS' },
                    { key: '8', sub: 'TUV' },
                    { key: '9', sub: 'WXYZ' },
                    { key: '*', sub: '' },
                    { key: '0', sub: '+' },
                    { key: '#', sub: '' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => handleDialKey(btn.key)}
                      className="h-11 rounded-full bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/50 text-white flex flex-col items-center justify-center transition-all active:scale-95 active:bg-amber-600/40 cursor-pointer shadow-sm"
                    >
                      <span className="text-base font-bold leading-tight">{btn.key}</span>
                      {btn.sub && (
                        <span className="text-[7px] text-zinc-400 font-mono tracking-widest">
                          {btn.sub}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Call Action Button */}
                <div className="flex justify-center pt-1 pb-1">
                  <button
                    onClick={handleStartDialCall}
                    disabled={!dialNumber}
                    className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      dialNumber
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 active:scale-95 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                    }`}
                    title="Dial Number on OPPO F27 5G"
                  >
                    <Phone className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. MESSAGES TAB (ColorOS Desi Messages) */}
            {activeTab === 'messages' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                {selectedMessage ? (
                  /* Message Detail Thread */
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="text-xs text-amber-400 hover:underline cursor-pointer"
                      >
                        ← Back
                      </button>
                      <span className="text-base">{selectedMessage.senderAvatar}</span>
                      <span className="text-xs font-semibold text-white truncate">
                        {selectedMessage.senderName}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto py-3 space-y-2">
                      <div className="p-3 bg-zinc-800/90 rounded-2xl rounded-tl-sm text-xs text-zinc-200 leading-relaxed border border-zinc-700/60">
                        {selectedMessage.fullText}
                        <div className="text-[9px] text-zinc-500 text-right mt-1">
                          {selectedMessage.time}
                        </div>
                      </div>
                    </div>

                    {/* Quick Reply Bar */}
                    <div className="pt-2 border-t border-zinc-800 flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Reply as Auto Driver..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!replyInput.trim()}
                        className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Message List */
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> ColorOS SMS Inbox
                      </h2>
                      <span className="text-[10px] text-zinc-400">Jio 5G</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => {
                            sounds.playPhoneClick();
                            setSelectedMessage(msg);
                          }}
                          className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 transition-all cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-base shrink-0 border border-zinc-700">
                            {msg.senderAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-zinc-200 truncate">
                                {msg.senderName}
                              </h4>
                              <span className="text-[9px] text-zinc-500">{msg.time}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 line-clamp-1">{msg.snippet}</p>
                          </div>
                          {msg.isUnread && (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 self-center" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. RECENTS TAB */}
            {activeTab === 'recents' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" /> Call Logs
                  </h2>
                  <span className="text-[10px] text-zinc-400">OPPO F27 5G</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {callLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-base shrink-0">
                          {log.avatar}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-semibold text-zinc-200 truncate">{log.name}</h4>
                          <p className="text-[9px] text-zinc-400 font-mono">
                            {log.type === 'incoming' && '📥 Incoming'}
                            {log.type === 'outgoing' && '📤 Outgoing'}
                            {log.type === 'missed' && '❌ Missed'} • {log.time}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const contact = PHONE_CONTACTS.find((c) => c.number === log.number) || {
                            name: log.name,
                            number: log.number,
                            avatar: log.avatar,
                            relation: 'Recent Caller',
                            voicePitch: 1.0,
                            voiceRate: 1.0,
                          };
                          startCallSession(contact);
                        }}
                        className="p-1.5 rounded-full bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. QUICK SERVICES TAB */}
            {activeTab === 'sos' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden justify-between">
                <div>
                  <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Highway Auto Services
                  </h2>
                  <p className="text-[10px] text-zinc-400 mb-3">
                    Call emergency services & highway roadside helpers directly on your OPPO F27 5G:
                  </p>

                  <div className="space-y-2">
                    {/* 5G High-Speed DesiNet Internet Browser */}
                    <button
                      onClick={() => {
                        sounds.playPhoneClick();
                        setActiveTab('internet');
                      }}
                      className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/60 to-cyan-950/70 hover:from-cyan-900/80 hover:to-indigo-900/80 border border-cyan-500/40 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group shadow-lg"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-cyan-600/30 text-cyan-300 group-hover:scale-110 transition-transform">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-cyan-200">5G DesiNet Internet Browser</h4>
                            <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-bold font-mono">
                              ONLINE
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400">Wikipedia search, live weather, forex rates & AI</p>
                        </div>
                      </div>
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    </button>

                    {/* Mechanic Repair */}
                    <button
                      onClick={() => handleTriggerPerk('repair')}
                      className="w-full p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 group-hover:scale-110 transition-transform">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-blue-200">Ramesh Auto Works (₹30)</h4>
                          <p className="text-[10px] text-zinc-400">Mobile mechanic restores +55% Condition</p>
                        </div>
                      </div>
                      <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
                    </button>

                    {/* Cutting Chai Delivery */}
                    <button
                      onClick={() => handleTriggerPerk('chai')}
                      className="w-full p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-amber-600/30 text-amber-400 group-hover:scale-110 transition-transform">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-amber-200">Munna Chai Tapri (₹15)</h4>
                          <p className="text-[10px] text-zinc-400">Fresh adrak cutting chai refills Chai Boost</p>
                        </div>
                      </div>
                      <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                    </button>

                    {/* Police Chowki */}
                    <button
                      onClick={() => handleTriggerPerk('police')}
                      className="w-full p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-200">Hawaldar Patil (NH-48 Chowki)</h4>
                          <p className="text-[10px] text-zinc-400">Highway speed clearance & route report</p>
                        </div>
                      </div>
                      <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                    </button>

                    {/* Pandit Ji Blessing */}
                    <button
                      onClick={() => handleTriggerPerk('blessing')}
                      className="w-full p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-purple-600/30 text-purple-400 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-purple-200">Pandit Vidyanath (Astrology)</h4>
                          <p className="text-[10px] text-zinc-400">Auspicious vehicle blessing & divine luck</p>
                        </div>
                      </div>
                      <PhoneCall className="w-4 h-4 text-purple-400 shrink-0" />
                    </button>

                    {/* Test Incoming Call (Simulate) */}
                    <button
                      onClick={() => {
                        sounds.playPhoneClick();
                        const possibleCallers = [
                          { contactId: 'maa', name: 'Maa (Mom)', avatar: '👵', relation: 'Family ❤️', number: '98200-10800' },
                          { contactId: 'munna_chai', name: 'Munna Chaiwala', avatar: '☕', relation: 'Chai Guru ☕', number: '98990-77882' },
                          { contactId: 'traffic_patil', name: 'Hawaldar Patil', avatar: '👮‍♂️', relation: 'NH-48 Chowki 👮', number: '103' },
                          { contactId: 'sharma_passenger', name: 'Sharma Ji', avatar: '💼', relation: 'VIP Passenger 💼', number: '98765-43210' },
                        ];
                        const chosen = possibleCallers[Math.floor(Math.random() * possibleCallers.length)];
                        engine?.triggerIncomingCall(chosen);
                      }}
                      className="w-full p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-rose-600/30 text-rose-400 group-hover:scale-110 transition-transform">
                          <PhoneOff className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-rose-200">Test Incoming Call & Cut Call</h4>
                          <p className="text-[10px] text-zinc-400">Trigger test incoming call to practice answering or cutting</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono font-bold">
                        RING 🔔
                      </span>
                    </button>
                  </div>
                </div>

                {/* Oppo Hardware Specs Card */}
                <div className="mt-2 p-2 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[9px] text-zinc-400 flex items-center justify-between">
                  <span>OPPO F27 5G • Dimensity 6300</span>
                  <span className="text-amber-400 font-mono">Cosmos Halo Light</span>
                </div>
              </div>
            )}

            {/* 6. 5G INTERNET & COLOROS BROWSER TAB */}
            {activeTab === 'internet' && (
              <PhoneInternetApp engine={engine} />
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM COLOROS NAVIGATION BAR */}
          {/* ========================================================= */}
          <div className="h-14 bg-zinc-950/95 border-t border-zinc-800/90 px-1 flex justify-around items-center z-20">
            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('contacts');
              }}
              className={`flex flex-col items-center p-1 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'contacts' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Contacts</span>
            </button>

            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('dialer');
              }}
              className={`flex flex-col items-center p-1 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'dialer' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Keypad</span>
            </button>

            {/* Prominent 5G Web Browser Tab */}
            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('internet');
              }}
              className={`flex flex-col items-center p-1 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'internet'
                  ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 shadow-md shadow-cyan-500/20'
                  : 'text-zinc-500 hover:text-cyan-300'
              }`}
              title="5G Internet & Web Browser"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-[9px] font-bold mt-0.5 flex items-center gap-0.5 text-cyan-300">
                5G Web
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </span>
            </button>

            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('messages');
              }}
              className={`flex flex-col items-center p-1 rounded-xl transition-colors relative cursor-pointer ${
                activeTab === 'messages' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">SMS</span>
              <div className="absolute top-0.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>

            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('recents');
              }}
              className={`flex flex-col items-center p-1 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'recents' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Logs</span>
            </button>

            <button
              onClick={() => {
                sounds.playPhoneClick();
                setActiveTab('sos');
              }}
              className={`flex flex-col items-center p-1 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'sos' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[9px] font-medium mt-0.5">Services</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
