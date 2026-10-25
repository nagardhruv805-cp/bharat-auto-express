import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Award,
  Sparkles,
  Zap,
  Coffee,
  Clock,
  Compass,
  MapPin,
  Flame,
  Check,
  ChevronRight,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { DailyGoal } from '../game/missions';

interface MissionLogModalProps {
  goals: DailyGoal[];
  onClaimReward: (goalId: string) => void;
  onClose: () => void;
  currentSpeedKmh?: number;
  activeSpeedBuff?: {
    active: boolean;
    label: string;
    remainingSeconds: number;
    speedBonusKmh: number;
  } | null;
}

export const MissionLogModal: React.FC<MissionLogModalProps> = ({
  goals,
  onClaimReward,
  onClose,
  currentSpeedKmh = 0,
  activeSpeedBuff = null,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'dynamic' | 'claimable'>('all');

  const completedCount = goals.filter((g) => g.completed).length;
  const unclaimedCount = goals.filter((g) => g.completed && !g.claimed).length;
  const totalRupeePool = goals.reduce((acc, g) => acc + g.rewardRupees, 0);

  const filteredGoals = goals.filter((g) => {
    if (activeTab === 'claimable') return g.completed && !g.claimed;
    if (activeTab === 'dynamic') return g.category === 'dhaba_visit' || g.category === 'maintain_speed';
    return true;
  });

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none pointer-events-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-4 sm:p-6 shadow-2xl text-stone-100 flex flex-col gap-3.5 relative overflow-hidden max-h-[92vh]">
        {/* Tricolor Festive Header Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-200 to-emerald-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pt-1 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📋</span>
              <h2 className="text-lg sm:text-2xl font-black text-amber-300 font-['Cinzel',sans-serif] tracking-wide uppercase">
                Daily Mission Log
              </h2>
            </div>
            <p className="text-xs text-amber-200/80 font-medium mt-0.5">
              दैनिक लक्ष्य • Dynamic highway objectives for bonus cash & speed buffs!
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Speed Buff Notification Card (If Active) */}
        {activeSpeedBuff?.active && (
          <div className="bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-amber-400 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-lg shadow-amber-500/20 shrink-0 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-lg animate-pulse">
                ⚡
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-400 font-mono tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  Speed Buff Currently Active!
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {activeSpeedBuff.label}
                </h4>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">
                +{activeSpeedBuff.speedBonusKmh} km/h
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {activeSpeedBuff.remainingSeconds}s remaining
              </span>
            </div>
          </div>
        )}

        {/* Daily Summary Progress Banner */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-stone-300">Goals Completed</span>
              <span className="text-sm font-black font-mono text-amber-400">
                {completedCount} of {goals.length} Completed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end text-right mr-1">
              <span className="text-[9px] text-zinc-400 uppercase font-mono">Total Bounties</span>
              <span className="text-xs font-black text-emerald-400 font-mono">₹{totalRupeePool}</span>
            </div>

            {unclaimedCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{unclaimedCount} Ready to Claim!</span>
              </div>
            ) : (
              <span className="text-[10px] text-stone-400 font-mono bg-stone-900 px-2 py-1 rounded-lg">
                Daily Objectives Reset at Midnight
              </span>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="grid grid-cols-3 bg-stone-950 border border-stone-800 rounded-xl p-1 gap-1 text-[11px] font-bold shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All Goals ({goals.length})
          </button>

          <button
            onClick={() => setActiveTab('dynamic')}
            className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'dynamic'
                ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>⚡ Dhaba & Speed (2)</span>
          </button>

          <button
            onClick={() => setActiveTab('claimable')}
            className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'claimable'
                ? 'bg-emerald-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>🎁 Claimable ({unclaimedCount})</span>
          </button>
        </div>

        {/* Goals List Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 scrollbar-thin">
          {filteredGoals.map((goal) => {
            const progressRatio = Math.min(1, goal.current / goal.target);
            const percent = Math.round(progressRatio * 100);

            return (
              <div
                key={goal.id}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col gap-2.5 ${
                  goal.completed
                    ? goal.claimed
                      ? 'bg-stone-950/60 border-stone-800 opacity-80'
                      : 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : 'bg-stone-950/90 border-stone-800 hover:border-amber-500/40'
                }`}
              >
                {/* Goal Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-2xl p-2 rounded-xl bg-stone-900 border border-stone-800 leading-none shrink-0 shadow-inner">
                      {goal.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-amber-300">
                          {goal.title}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400/70">
                          ({goal.hindiTitle})
                        </span>
                        {goal.category === 'dhaba_visit' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                            DHABA ODYSSEY
                          </span>
                        )}
                        {goal.category === 'maintain_speed' && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-500/40">
                            SPEED CHALLENGE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                        {goal.description}
                      </p>
                    </div>
                  </div>

                  {/* Dual Rewards Badges (Cash + Speed Buff) */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">
                        Cash Bonus
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-400 tabular-nums">
                        +₹{goal.rewardRupees}
                      </span>
                    </div>

                    {goal.rewardBuff && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/60 text-[9px] font-bold text-amber-300 shadow-sm"
                        title={goal.rewardBuff.description}
                      >
                        <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        <span>+{goal.rewardBuff.speedBonusKmh}k ({goal.rewardBuff.durationSeconds}s)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SPECIAL OBJECTIVE 1: Specific Dhabas Sub-Items Checkbox List */}
                {goal.category === 'dhaba_visit' && goal.dhabaItems && (
                  <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider flex items-center justify-between">
                      <span>3 Specific Dhabas to Visit:</span>
                      <span className="text-stone-300 font-bold">
                        {goal.dhabaItems.filter((d) => d.visited).length} / 3 Visited
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                      {goal.dhabaItems.map((dhaba) => (
                        <div
                          key={dhaba.id}
                          className={`p-2 rounded-lg border text-left flex flex-col justify-between gap-1 transition ${
                            dhaba.visited
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                              : 'bg-stone-950/80 border-stone-800 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black leading-tight truncate">
                              {dhaba.name.split(' ')[0]}
                            </span>
                            {dhaba.visited ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-stone-600 shrink-0" />
                            )}
                          </div>
                          <span className="text-[8px] text-amber-300/80 font-mono block">
                            {dhaba.landmark}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SPECIAL OBJECTIVE 2: Maintain 40 km/h Live Cruise Gauge */}
                {goal.category === 'maintain_speed' && (
                  <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 flex flex-col gap-1.5 mt-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-stone-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Cruise Timer:</span>
                        <strong className="text-white font-bold">
                          {Math.floor(goal.current / 60)}m {Math.round(goal.current % 60)}s / 2m 00s
                        </strong>
                      </span>

                      {currentSpeedKmh >= 40 ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>40+ KM/H HELD! ({currentSpeedKmh} km/h)</span>
                        </span>
                      ) : (
                        <span className="text-stone-400">
                          Current: {currentSpeedKmh} km/h (Drive &gt;40 km/h)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Bar & Status */}
                <div className="flex flex-col gap-1 pt-1 border-t border-stone-800/80">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-stone-400">
                      Progress:{' '}
                      <strong className="text-stone-200">
                        {goal.category === 'maintain_speed'
                          ? `${Math.round(goal.current)}s / 120s`
                          : `${goal.current} / ${goal.target} ${goal.unit || ''}`}
                      </strong>
                    </span>
                    <span className={goal.completed ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700/50">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        goal.completed
                          ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                          : 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-amber-300/80 italic font-sans truncate pr-2">
                    {goal.completed
                      ? 'Goal Complete! Claim your bounty!'
                      : goal.category === 'dhaba_visit'
                      ? 'Pull up to the 3 roadside dhabas on NH-48...'
                      : goal.category === 'maintain_speed'
                      ? 'Throttle up on open asphalt and maintain speed...'
                      : goal.category === 'silence'
                      ? 'Approach next temple in silence...'
                      : goal.category === 'passengers'
                      ? 'Pick up waiting travelers at road stands...'
                      : 'Keep driving and collect roadside cups...'}
                  </span>

                  {goal.completed && !goal.claimed && (
                    <button
                      onClick={() => onClaimReward(goal.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        Claim ₹{goal.rewardRupees}
                        {goal.rewardBuff ? ' + ⚡ Buff!' : '!'}
                      </span>
                    </button>
                  )}

                  {goal.claimed && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>
                        Reward Claimed (+₹{goal.rewardRupees}
                        {goal.rewardBuff ? ` & ${goal.rewardBuff.label}` : ''})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-stone-400 font-mono">
            🇮🇳 Complete all 5 objectives to earn maximum daily rewards & speed boosts!
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer"
          >
            Back to Driving
          </button>
        </div>
      </div>
    </div>
  );
};
