import { sounds } from './audio';

export type GoalCategory = 'silence' | 'passengers' | 'chai' | 'cow' | 'speed' | 'distance';

export interface DailyGoal {
  id: string;
  title: string;
  hindiTitle: string;
  description: string;
  target: number;
  current: number;
  rewardRupees: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
  category: GoalCategory;
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
    // 3 Curated Daily Goals as requested:
    // 1. "Reach the temple without honking" (Silent Pilgrimage)
    // 2. "Deliver passengers before sunset / safely" (Evening Express)
    // 3. "Drink cutting chai / boost goals" (Chai Lover)
    this.goals = [
      {
        id: 'temple_silence',
        title: 'Silent Pilgrimage',
        hindiTitle: 'शांति यात्रा',
        description: 'Reach the next roadside temple without honking your horn once.',
        target: 1,
        current: 0,
        rewardRupees: 350,
        completed: false,
        claimed: false,
        icon: '🛕',
        category: 'silence',
      },
      {
        id: 'deliver_passengers',
        title: 'Sunset Express',
        hindiTitle: 'संध्या सवारी',
        description: 'Safely deliver 3 passengers to their destinations.',
        target: 3,
        current: 0,
        rewardRupees: 500,
        completed: false,
        claimed: false,
        icon: '👥',
        category: 'passengers',
      },
      {
        id: 'chai_boost',
        title: 'Cutting Chai Lover',
        hindiTitle: 'कटिंग चाय प्रेमी',
        description: 'Collect 4 steaming cups of Cutting Chai on the highway.',
        target: 4,
        current: 0,
        rewardRupees: 250,
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

  // Claim bonus fare reward
  public claimReward(goalId: string): number {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal && goal.completed && !goal.claimed) {
      goal.claimed = true;
      sounds.playCoin();
      return goal.rewardRupees;
    }
    return 0;
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
