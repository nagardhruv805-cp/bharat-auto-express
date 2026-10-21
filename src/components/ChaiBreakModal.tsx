import React, { useState, useEffect } from 'react';
import { Coffee, Sparkles, Heart, Zap, ChevronRight, CheckCircle2, Flame, Award } from 'lucide-react';
import { sounds } from '../game/audio';

interface ChaiBreakModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

interface ChaiStep {
  stepIndex: number;
  hindiTitle: string;
  englishTitle: string;
  tagline: string;
  description: string;
  soundType: 'mortar' | 'boil' | 'pour' | 'sip';
  icon: string;
  color: string;
  bgGradient: string;
}

const CHAI_STEPS: ChaiStep[] = [
  {
    stepIndex: 1,
    hindiTitle: 'अदरक-इलायची कुटाई',
    englishTitle: 'Crushing Ginger & Elaichi',
    tagline: 'Fresh mountain ginger & green cardamom crushed in brass mortar',
    description:
      'The Chaiwala crushes knobby ginger and fragrant green cardamom in the heavy brass hamam-dasta. The aromatic spices release pure natural oils that give cutting chai its fiery kick.',
    soundType: 'mortar',
    icon: '🧄',
    color: 'text-amber-300',
    bgGradient: 'from-amber-900/40 via-yellow-950/30 to-zinc-950',
  },
  {
    stepIndex: 2,
    hindiTitle: 'उबाल और खुशबू (Rolling Boil)',
    englishTitle: 'Bubbling Spiced Buffalo Milk',
    tagline: 'Rich creamy milk, CTC Assam tea & spices bubbling violently on blue flame',
    description:
      'Rich buffalo milk, strong Assam tea granules, crushed spices, and cane sugar come to a rolling boil over the blue kerosene burner. Simmered until rich terracotta tan.',
    soundType: 'boil',
    icon: '🔥',
    color: 'text-orange-400',
    bgGradient: 'from-orange-950/40 via-amber-950/30 to-zinc-950',
  },
  {
    stepIndex: 3,
    hindiTitle: 'एक मीटर लम्बी धार (The Long Pour)',
    englishTitle: '1-Meter High Aerating Pour',
    tagline: 'Strained through muslin cloth & aerated from high above with velvety foam',
    description:
      'The Chaiwala raises the heavy brass kettle high into the air, streaming hot chai from 1 meter height straight into the classic fluted cutting glasses. This aerates the brew, creating a rich malai head.',
    soundType: 'pour',
    icon: '☕',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-950/40 via-amber-900/30 to-zinc-950',
  },
  {
    stepIndex: 4,
    hindiTitle: 'गरमा-गरम कटिंग चाय (Cutting Chai Ready!)',
    englishTitle: 'Hot Kadak Cutting Chai & Chuski!',
    tagline: 'Piping hot cutting glass served with Osmania biscuits — 100% Stamina!',
    description:
      '"Lijiye bhaiya, ek number kadak cutting!" You sip the piping hot glass (*Chuski*). Pure energy surges through your veins, engine cools down, and you are ready to conquer NH-48!',
    soundType: 'sip',
    icon: '✨',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-950/40 via-amber-950/30 to-zinc-950',
  },
];

export const ChaiBreakModal: React.FC<ChaiBreakModalProps> = ({ isOpen, onFinish }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Play audio on step change
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIdx(0);
      return;
    }
    const current = CHAI_STEPS[currentStepIdx];
    if (current) {
      sounds.playChaiPreparationStep(current.soundType);
    }
  }, [isOpen, currentStepIdx]);

  // Auto-advance step every 3 seconds if not completed
  useEffect(() => {
    if (!isOpen) return;
    if (currentStepIdx < CHAI_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIdx((prev) => prev + 1);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStepIdx]);

  if (!isOpen) return null;

  const currentStep = CHAI_STEPS[currentStepIdx];
  const isFinalStep = currentStepIdx === CHAI_STEPS.length - 1;

  const handleNext = () => {
    if (isFinalStep) {
      onFinish();
    } else {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none pointer-events-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border-2 border-amber-500/60 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden flex flex-col text-white font-sans">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 px-5 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shadow-md">
              ☕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-300 font-['Cinzel',sans-serif]">
                  रोडसाइड ढाबा कटिंग चाय
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 uppercase">
                  Chai Break
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                NH-48 Mile 14 • Munna Kadak Chai Tapri
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-400">
              STEP {currentStepIdx + 1} / 4
            </span>
          </div>
        </div>

        {/* 4-Step Visual Progress Bars */}
        <div className="grid grid-cols-4 gap-1.5 px-5 pt-3">
          {CHAI_STEPS.map((s, idx) => (
            <div
              key={s.stepIndex}
              onClick={() => setCurrentStepIdx(idx)}
              className="cursor-pointer group flex flex-col gap-1"
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx <= currentStepIdx
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-zinc-800'
                }`}
              />
              <span
                className={`text-[9px] font-mono truncate text-center transition-colors ${
                  idx === currentStepIdx
                    ? 'text-amber-300 font-bold'
                    : idx < currentStepIdx
                    ? 'text-zinc-400'
                    : 'text-zinc-600'
                }`}
              >
                {s.englishTitle.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Interactive Animated Stage Card */}
        <div className={`p-5 sm:p-6 flex flex-col items-center text-center gap-4 bg-gradient-to-b ${currentStep.bgGradient} transition-colors duration-500`}>
          {/* Animated Visual Hero Icon */}
          <div className="relative my-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-500/10 border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)] relative overflow-hidden group">
              <span className="text-5xl sm:text-6xl animate-bounce drop-shadow-lg">
                {currentStep.icon}
              </span>
              {/* Animated steam rings for boiling and pouring steps */}
              {(currentStepIdx === 1 || currentStepIdx === 2 || currentStepIdx === 3) && (
                <div className="absolute inset-x-0 -top-1 flex justify-center gap-1 opacity-80 pointer-events-none">
                  <span className="text-xs text-amber-200 animate-pulse">~</span>
                  <span className="text-sm text-amber-300 animate-pulse delay-100">~</span>
                  <span className="text-xs text-amber-200 animate-pulse delay-200">~</span>
                </div>
              )}
            </div>
            {/* Sparkle badge */}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 p-1.5 rounded-full shadow-md animate-spin-slow">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Titles & Vernacular Copy */}
          <div className="max-w-md">
            <h3 className="text-lg sm:text-2xl font-black text-amber-300 font-['Cinzel',sans-serif]">
              {currentStep.hindiTitle}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-amber-200/90 mt-0.5">
              {currentStep.englishTitle}
            </p>
            <p className="text-[11px] sm:text-xs text-zinc-300 mt-2 leading-relaxed font-sans">
              {currentStep.description}
            </p>
          </div>

          {/* Per-Step Perks & Stamina Refuel Summary Bar */}
          <div className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Stamina Nitro</div>
                <div className="text-xs font-mono font-bold text-amber-300">100% REFILLED</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <div>
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Engine Condition</div>
                <div className="text-xs font-mono font-bold text-emerald-400">+25% COOLED</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Chai Count</div>
                <div className="text-xs font-mono font-bold text-zinc-100">+1 Tapri Cup</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Good Karma Tip</div>
                <div className="text-xs font-mono font-bold text-yellow-300">+₹15 Rupee Tip</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={() => sounds.playChaiPreparationStep(currentStep.soundType)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Replay step audio sound"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Replay Sound
          </button>

          <div className="flex items-center gap-2">
            {!isFinalStep ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onFinish}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Drink Chai & Resume Drive (100% Boost)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
