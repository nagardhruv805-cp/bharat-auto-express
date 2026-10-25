import { sounds } from './audio';

export type GoalCategory =
  | 'silence'
  | 'passengers'
  | 'chai'
  | 'dhaba_visit'
  | 'maintain_speed'
  | 'cow'
  | 'speed'
  | 'distance';

export interface DhabaSubItem {
  id: string;
  name: string;
  hindiName: string;
  landmark: string;
  sectorKm: number;
  visited: boolean;
}

export interface SpeedBuffReward {
  label: string;
  durationSeconds: number;
  speedBonusKmh: number;
  description: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  hindiTitle: string;
  description: string;
  target: number;
  current: number;
  unit?: string; // 'dhabas' | 'seconds' | 'passengers' | 'cups' | 'temple'
  rewardRupees: number;
  rewardBuff?: SpeedBuffReward;
  completed: boolean;
  claimed: boolean;
  icon: string;
  category: GoalCategory;
  dhabaItems?: DhabaSubItem[];
}

export class MissionManager {
  public goals: DailyGoal[] = [];
  public honkedSinceLastTemple: boolean = false;
  public cowsPassedSafely: number = 0;
  public onGoalCompletedCallback: ((goal: DailyGoal) => void) | null = null;

  constructor() {
    this.initDailyGoals();
  }

  public initDailyGoals() {
    this.goals = [
      {
        id: 'dhaba_hop',
        title: 'Grand Dhaba Food Hop',
        hindiTitle: 'महा ढाबा यात्रा',
        description: 'Pull up and visit 3 iconic roadside dhabas along the NH-48 corridor.',
        target: 3,
        current: 0,
        unit: 'dhabas',
        rewardRupees: 650,
        rewardBuff: {
          label: 'Adrak Chai Overdrive',
          durationSeconds: 45,
          speedBonusKmh: 18,
          description: '+18 km/h Top Speed & Infinite Stamina boost for 45s!',
        },
        completed: false,
        claimed: false,
        icon: '🏪',
        category: 'dhaba_visit',
        dhabaItems: [
          {
            id: 'sharma_dhaba',
            name: 'Sharmaji Chai & Nashta Tapri',
            hindiName: 'शर्माजी चाय नाश्ता',
            landmark: 'Left Highway Shoulder (Km 1.5)',
            sectorKm: 1.5,
            visited: false,
          },
          {
            id: 'punjab_dhaba',
            name: 'Sher-e-Punjab Highway Dhaba',
            hindiName: 'शेर-ए-पंजाब ढाबा',
            landmark: 'Right Highway Oasis (Km 3.5)',
            sectorKm: 3.5,
            visited: false,
          },
          {
            id: 'munna_samosa',
            name: 'Munna Samosa Pullover Bay',
            hindiName: 'मुन्ना समोसा ढाबा',
            landmark: 'Truck Rest Stop (Km 5.5)',
            sectorKm: 5.5,
            visited: false,
          },
        ],
      },
      {
        id: 'maintain_40_speed',
        title: 'Highway Speed Master',
        hindiTitle: 'हाईवे रफ्तार मास्टर',
        description: 'Maintain steady 40+ km/h cruising speed for 2 minutes (120s) without dropping speed.',
        target: 120,
        current: 0,
        unit: 'seconds',
        rewardRupees: 750,
        rewardBuff: {
          label: 'Golden Bullet Nitro Surge',
          durationSeconds: 60,
          speedBonusKmh: 24,
          description: '+24 km/h Rocket Surge & HyperBoost for 60s!',
        },
        completed: false,
        claimed: false,
        icon: '⚡',
        category: 'maintain_speed',
      },
      {
        id: 'temple_silence',
        title: 'Silent Pilgrimage',
        hindiTitle: 'शांति यात्रा',
        description: 'Reach the next roadside temple without honking your horn once.',
        target: 1,
        current: 0,
        unit: 'temple',
        rewardRupees: 400,
        rewardBuff: {
          label: 'Sacred Swiftness Blessing',
          durationSeconds: 30,
          speedBonusKmh: 14,
          description: '+14 km/h Smooth Sacred Glide for 30s!',
        },
        completed: false,
        claimed: false,
        icon: '🛕',
        category: 'silence',
      },
      {
        id: 'deliver_passengers',
        title: 'Sunset Express',
        hindiTitle: 'संध्या सवारी',
        description: 'Safely pick up and deliver 3 passengers to their highway destinations.',
        target: 3,
        current: 0,
        unit: 'passengers',
        rewardRupees: 500,
        completed: false,
        claimed: false,
        icon: '👥',
        category: 'passengers',
      },
      {
        id: 'chai_boost',
        title: 'Cutting Chai Lover',
        hindiTitle: 'कड़क चाय प्रेमी',
        description: 'Collect 4 steaming cups of Cutting Chai on the highway.',
        target: 4,
        current: 0,
        unit: 'cups',
        rewardRupees: 350,
        rewardBuff: {
          label: 'Kadak Caffeine Rush',
          durationSeconds: 35,
          speedBonusKmh: 16,
          description: '+16 km/h Acceleration Surge for 35s!',
        },
        completed: false,
        claimed: false,
        icon: '☕',
        category: 'chai',
      },
    ];

    this.honkedSinceLastTemple = false;
    this.cowsPassedSafely = 0;
  }

  // --- Event: Player presses horn ---
  public onHonk(): { brokenSilence: boolean } {
    const silenceGoal = this.goals.find((g) => g.id === 'temple_silence' && !g.completed);
    if (silenceGoal) {
      if (!this.honkedSinceLastTemple) {
        this.honkedSinceLastTemple = true;
        return { brokenSilence: true };
      }
    }
    return { brokenSilence: false };
  }

  // --- Event: Player passes a roadside temple ---
  public onTemplePassed(): DailyGoal | null {
    const silenceGoal = this.goals.find((g) => g.id === 'temple_silence' && !g.completed);
    if (silenceGoal) {
      if (!this.honkedSinceLastTemple) {
        silenceGoal.current = 1;
        silenceGoal.completed = true;
        this.triggerGoalComplete(silenceGoal);
        return silenceGoal;
      } else {
        // Reset silence counter for the next temple approach
        this.honkedSinceLastTemple = false;
      }
    }
    return null;
  }

  // --- Event: Cruise Speed Tick (40+ km/h maintenance) ---
  public onCruiseSpeedTick(speedKmh: number, dt: number): DailyGoal | null {
    const goal = this.goals.find((g) => g.id === 'maintain_40_speed' && !g.completed);
    if (!goal) return null;

    if (speedKmh >= 40) {
      goal.current = Math.min(goal.target, Math.round((goal.current + dt) * 10) / 10);
      if (goal.current >= goal.target) {
        goal.completed = true;
        this.triggerGoalComplete(goal);
        return goal;
      }
    } else {
      // Gentle decay if dropping below 40 km/h (allows slight adjustments without losing all progress)
      if (goal.current > 0) {
        goal.current = Math.max(0, Math.round((goal.current - dt * 0.35) * 10) / 10);
      }
    }
    return null;
  }

  // --- Event: Specific Dhaba Visited ---
  public onDhabaVisited(dhabaId: string): DailyGoal | null {
    const goal = this.goals.find((g) => g.id === 'dhaba_hop' && !g.completed);
    if (!goal || !goal.dhabaItems) return null;

    const item = goal.dhabaItems.find((d) => d.id === dhabaId);
    if (item && !item.visited) {
      item.visited = true;
      goal.current = goal.dhabaItems.filter((d) => d.visited).length;
      if (goal.current >= goal.target) {
        goal.completed = true;
        this.triggerGoalComplete(goal);
        return goal;
      }
    }
    return null;
  }

  // --- Event: Passenger dropped off ---
  public onPassengerDelivered(totalDelivered: number): DailyGoal | null {
    const passengerGoal = this.goals.find((g) => g.id === 'deliver_passengers' && !g.completed);
    if (passengerGoal) {
      passengerGoal.current = Math.min(passengerGoal.target, totalDelivered);
      if (passengerGoal.current >= passengerGoal.target) {
        passengerGoal.completed = true;
        this.triggerGoalComplete(passengerGoal);
        return passengerGoal;
      }
    }
    return null;
  }

  // --- Event: Cutting Chai collected ---
  public onChaiCollected(totalChai: number): DailyGoal | null {
    const chaiGoal = this.goals.find((g) => g.id === 'chai_boost' && !g.completed);
    if (chaiGoal) {
      chaiGoal.current = Math.min(chaiGoal.target, totalChai);
      if (chaiGoal.current >= chaiGoal.target) {
        chaiGoal.completed = true;
        this.triggerGoalComplete(chaiGoal);
        return chaiGoal;
      }
    }
    return null;
  }

  // --- Event: Speed milestone reached ---
  public onSpeedCheck(speedKmh: number): DailyGoal | null {
    const speedGoal = this.goals.find((g) => g.id === 'high_speed' && !g.completed);
    if (speedGoal && speedKmh >= speedGoal.target) {
      speedGoal.current = speedGoal.target;
      speedGoal.completed = true;
      this.triggerGoalComplete(speedGoal);
      return speedGoal;
    }
    return null;
  }

  // --- Event: Distance milestone ---
  public onDistanceCheck(distanceKm: number): DailyGoal | null {
    const distGoal = this.goals.find((g) => g.id === 'distance_goal' && !g.completed);
    if (distGoal) {
      distGoal.current = Math.min(distGoal.target, Math.floor(distanceKm * 10) / 10);
      if (distGoal.current >= distGoal.target) {
        distGoal.completed = true;
        this.triggerGoalComplete(distGoal);
        return distGoal;
      }
    }
    return null;
  }

  private triggerGoalComplete(goal: DailyGoal) {
    sounds.playMissionComplete();
    if (this.onGoalCompletedCallback) {
      this.onGoalCompletedCallback(goal);
    }
  }

  // Claim reward (returns rupees and sets claimed)
  public claimReward(goalId: string): DailyGoal | null {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal && goal.completed && !goal.claimed) {
      goal.claimed = true;
      sounds.playCoin();
      return goal;
    }
    return null;
  }

  public getUnclaimedRewardsCount(): number {
    return this.goals.filter((g) => g.completed && !g.claimed).length;
  }

  public getCompletedCount(): number {
    return this.goals.filter((g) => g.completed).length;
  }

  public reset() {
    this.initDailyGoals();
  }
}
