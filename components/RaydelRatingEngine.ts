/**
 * Raydel Rating System - Core Algorithm Implementation
 * Proprietary Performance Analytics Algorithm for Padel
 */

export interface ShotData {
  type: 'forehand' | 'backhand' | 'volley' | 'smash' | 'serve';
  outcome: 'winner' | 'error' | 'good' | 'forced_error';
  position: { x: number; y: number };
  timestamp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pressure: 'low' | 'medium' | 'high';
  consecutive: number; // consecutive shots of same type
}

export interface MatchContext {
  gamePoint: boolean;
  setPoint: boolean;
  matchPoint: boolean;
  opponentRating: number;
  currentRating: number;
}

export interface RatingFactors {
  technicalExecution: number;    // 24.5% of total
  courtPositioning: number;      // 17.5% of total
  shotConsistency: number;       // 17.5% of total
  winnersImpact: number;         // 10.5% of total
  matchOutcome: number;          // 19.5% of total
  opponentDifferential: number;  // 10.5% of total
}

export class RaydelRatingEngine {
  private static readonly BASE_RATING = 1500;
  private static readonly K_FACTOR = 32;
  
  // Weight percentages for rating factors
  private static readonly WEIGHTS = {
    TECHNICAL_EXECUTION: 0.245,
    COURT_POSITIONING: 0.175,
    SHOT_CONSISTENCY: 0.175,
    WINNERS_IMPACT: 0.105,
    MATCH_OUTCOME: 0.195,
    OPPONENT_DIFFERENTIAL: 0.105
  };

  /**
   * Calculate rating change for a single shot
   */
  static calculateShotRating(
    shot: ShotData, 
    context: MatchContext,
    currentStreak: number = 0
  ): number {
    let baseChange = 0;

    // Technical Execution (24.5%)
    switch (shot.outcome) {
      case 'winner':
        baseChange = 2;
        break;
      case 'good':
        baseChange = 1;
        break;
      case 'error':
        baseChange = shot.difficulty === 'easy' ? -1.5 : -1;
        break;
      case 'forced_error':
        baseChange = 1; // Opponent error gives positive points
        break;
    }

    // Apply difficulty modifier
    if (shot.difficulty === 'hard' && shot.outcome === 'good') {
      baseChange *= 1.5;
    } else if (shot.difficulty === 'easy' && shot.outcome === 'error') {
      baseChange *= 1.5; // Penalize easy errors more
    }

    // Pressure situation modifier
    const pressureMultiplier = this.getPressureMultiplier(context, shot.pressure);
    baseChange *= pressureMultiplier;

    // Consecutive error penalty
    if (shot.outcome === 'error' && currentStreak > 0) {
      const streakPenalty = Math.min(currentStreak * 0.5, 2);
      baseChange -= streakPenalty;
    }

    // Consistency bonus for good shots
    if (shot.outcome === 'good' || shot.outcome === 'winner') {
      const consistencyBonus = Math.min(currentStreak * 0.25, 1);
      baseChange += consistencyBonus;
    }

    return baseChange * this.WEIGHTS.TECHNICAL_EXECUTION;
  }

  /**
   * Calculate match-level rating change
   */
  static calculateMatchRating(
    playerRating: number,
    opponentRating: number,
    matchResult: 'win' | 'loss',
    setsDifferential: number,
    gamesDifferential: number,
    shotPerformance: number
  ): number {
    // Expected score based on rating difference
    const ratingDiff = opponentRating - playerRating;
    const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
    
    // Actual score (1 for win, 0 for loss)
    const actualScore = matchResult === 'win' ? 1 : 0;
    
    // Base rating change using ELO formula
    const baseChange = this.K_FACTOR * (actualScore - expectedScore);
    
    // Apply set and game differentials
    const setBonus = setsDifferential * 3;
    const gameBonus = gamesDifferential * 1;
    
    // Combine all factors
    const totalChange = baseChange + setBonus + gameBonus + shotPerformance;
    
    return Math.round(totalChange);
  }

  /**
   * Get pressure multiplier based on match context
   */
  private static getPressureMultiplier(context: MatchContext, shotPressure: string): number {
    let multiplier = 1;

    // Context pressure
    if (context.matchPoint) multiplier *= 2;
    else if (context.setPoint) multiplier *= 1.5;
    else if (context.gamePoint) multiplier *= 1.2;

    // Shot-specific pressure
    switch (shotPressure) {
      case 'high':
        multiplier *= 1.3;
        break;
      case 'low':
        multiplier *= 0.8;
        break;
    }

    return multiplier;
  }

  /**
   * Calculate position-based rating modifier
   */
  static calculatePositionRating(
    position: { x: number; y: number },
    shotOutcome: string,
    courtDimensions: { width: number; height: number }
  ): number {
    // Normalize position (0-1 range)
    const normalizedX = position.x / courtDimensions.width;
    const normalizedY = position.y / courtDimensions.height;

    // Optimal positions (center court, near net for volleys)
    const isOptimalPosition = this.isOptimalPosition(normalizedX, normalizedY);
    
    if (isOptimalPosition && (shotOutcome === 'winner' || shotOutcome === 'good')) {
      return 0.5; // Bonus for good positioning
    } else if (!isOptimalPosition && shotOutcome === 'error') {
      return -0.25; // Penalty for poor positioning leading to error
    }

    return 0;
  }

  /**
   * Determine if position is optimal for padel
   */
  private static isOptimalPosition(x: number, y: number): boolean {
    // Center court positions (0.3-0.7 range) are generally optimal
    // Near net positions (y < 0.3) are good for volleys
    return (x >= 0.3 && x <= 0.7) || y < 0.3;
  }

  /**
   * Get rating level description
   */
  static getRatingLevel(rating: number): string {
    if (rating >= 2200) return 'Competition Player (6.0-7.0)';
    if (rating >= 2000) return 'High Advanced (5.5)';
    if (rating >= 1800) return 'Advanced (5.0)';
    if (rating >= 1600) return 'High Intermediate (4.0-4.5)';
    if (rating >= 1500) return 'Intermediate (3.0-3.5)';
    if (rating >= 1400) return 'Low Intermediate (2.5)';
    if (rating >= 1300) return 'High Beginner (2.0)';
    return 'Beginner (0-1.5)';
  }

  /**
   * Get rating color for UI display
   */
  static getRatingColor(rating: number): string {
    if (rating >= 2200) return '#9D4EDD'; // Purple for elite
    if (rating >= 2000) return '#00FF88'; // Green for high advanced
    if (rating >= 1800) return '#00D4FF'; // Blue for advanced
    if (rating >= 1600) return '#FFD700'; // Gold for high intermediate
    if (rating >= 1400) return '#FFA500'; // Orange for intermediate
    return '#FF6B6B'; // Red for beginner
  }

  /**
   * Process complete match data and return new rating
   */
  static processMatch(
    currentRating: number,
    opponentRating: number,
    shots: ShotData[],
    matchResult: 'win' | 'loss',
    sets: Array<{ playerScore: number; opponentScore: number }>
  ): { newRating: number; ratingChange: number; breakdown: RatingFactors } {
    let shotPerformanceTotal = 0;
    let currentStreak = 0;
    let lastShotOutcome = '';

    // Process each shot
    shots.forEach((shot, index) => {
      // Update streak
      if (shot.outcome === lastShotOutcome && (shot.outcome === 'good' || shot.outcome === 'winner')) {
        currentStreak++;
      } else if (shot.outcome === 'error' && lastShotOutcome === 'error') {
        currentStreak++;
      } else {
        currentStreak = 0;
      }

      const context: MatchContext = {
        gamePoint: false, // Would need game state tracking
        setPoint: false,  // Would need set state tracking
        matchPoint: false, // Would need match state tracking
        opponentRating,
        currentRating
      };

      const shotRating = this.calculateShotRating(shot, context, currentStreak);
      shotPerformanceTotal += shotRating;
      lastShotOutcome = shot.outcome;
    });

    // Calculate set and game differentials
    const setsDifferential = sets.reduce((diff, set) => {
      if (set.playerScore > set.opponentScore) return diff + 1;
      if (set.playerScore < set.opponentScore) return diff - 1;
      return diff;
    }, 0);

    const gamesDifferential = sets.reduce((diff, set) => 
      diff + (set.playerScore - set.opponentScore), 0
    );

    // Calculate final rating change
    const ratingChange = this.calculateMatchRating(
      currentRating,
      opponentRating,
      matchResult,
      setsDifferential,
      gamesDifferential,
      shotPerformanceTotal
    );

    const newRating = Math.max(1000, currentRating + ratingChange);

    // Create breakdown for display
    const breakdown: RatingFactors = {
      technicalExecution: shotPerformanceTotal,
      courtPositioning: 0, // Would calculate from position data
      shotConsistency: 0,  // Would calculate from streak data
      winnersImpact: 0,    // Would calculate from winner shots
      matchOutcome: ratingChange - shotPerformanceTotal,
      opponentDifferential: 0 // Included in match outcome calculation
    };

    return {
      newRating: Math.round(newRating),
      ratingChange: Math.round(ratingChange),
      breakdown
    };
  }
}