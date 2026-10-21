import React from 'react';
import { X, CheckCircle, Award, Sparkles } from 'lucide-react';
import { DailyGoal } from '../game/missions';

interface MissionLogModalProps {
  goals: DailyGoal[];
  onClaimReward: (goalId: string) => void;
  onClose: () => void;
}

export const MissionLogModal: React.FC<MissionLogModalProps> = ({
  goals,
  onClaimReward,
  onClose,
}) => {
  const completedCount = goals.filter((g) => g.completed).length;
  const unclaimedCount = goals.filter((g) => g.completed && !g.claimed).length;

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none pointer-events-auto">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-7 shadow-2xl text-stone-100 flex flex-col gap-4 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Tricolor Festive Header Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-200 to-emerald-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📋</span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-['Cinzel',sans-serif] tracking-wide uppercase">
                Daily Mission Log
              </h2>
            </div>
            <p className="text-xs text-amber-200/80 font-medium mt-0.5">
              दैनिक लक्ष्य • Complete 3 daily goals for heavy bonus fare!
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

        {/* Daily Summary Progress Banner */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-stone-300">Goals Completed</span>
              <span className="text-sm font-black font-mono text-amber-400">
                {completedCount} of {goals.length} Completed
              </span>
            </div>
          </div>

          {unclaimedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{unclaimedCount} Unclaimed!</span>
            </div>
          )}
        </div>

        {/* 3 Daily Goals List */}
        <div className="flex flex-col gap-3">
          {goals.map((goal) => {
            const progressRatio = Math.min(1, goal.current / goal.target);
            const percent = Math.round(progressRatio * 100);

            return (
              <div
                key={goal.id}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col gap-2.5 ${
                  goal.completed
                    ? goal.claimed
                      ? 'bg-stone-950/60 border-stone-800 opacity-80'
                      : 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'bg-stone-950/90 border-stone-800'
                }`}
              >
                {/* Goal Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl p-1.5 rounded-xl bg-stone-900 border border-stone-800 leading-none">
                      {goal.icon}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-amber-300">
                          {goal.title}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400/70">
                          ({goal.hindiTitle})
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                        {goal.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Bonus</span>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-400 tabular-nums">
                      +₹{goal.rewardRupees}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Status */}
                <div className="flex flex-col gap-1 pt-1 border-t border-stone-800/80">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-stone-400">
                      Progress: <strong className="text-stone-200">{goal.current} / {goal.target}</strong>
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
                          : 'bg-gradient-to-r from-amber-600 to-amber-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-end pt-1">
                  {goal.completed && !goal.claimed && (
                    <button
                      onClick={() => onClaimReward(goal.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim ₹{goal.rewardRupees} Bonus!</span>
                    </button>
                  )}

                  {goal.claimed && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Reward Claimed (+₹{goal.rewardRupees})</span>
                    </div>
                  )}

                  {!goal.completed && (
                    <span className="text-[11px] font-semibold text-amber-300/80 italic font-sans">
                      {goal.id === 'temple_silence'
                        ? 'Approach next temple in silence...'
                        : 'Drive and fulfill goal on highway'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 mt-1 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          Back to Highway
        </button>
      </div>
    </div>
  );
};
