/**
 * Raydel Rating System - Core Algorithm Implementation
 * Comprehensive Performance Evaluation System for Padel Players
 * Based on 6 distinct performance factors with proper weightings
 */

export interface ShotData {
  type: 'forehand' | 'backhand' | 'volley' | 'smash' | 'serve';
  outcome: 'perfect' | 'good' | 'minor_error' | 'major_error' | 'winner' | 'forced_error';
  position: { x: number; y: number };
  timestamp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pressure: 'low' | 'medium' | 'high';
  consecutive: number;
  isOptimalPosition: boolean;
  formQuality: 'perfect' | 'good' | 'poor';
}

export interface MatchContext {
  gamePoint: boolean;
  setPoint: boolean;
  matchPoint: boolean;
  opponentRating: number;
  currentRating: number;
  currentSet: number;
  currentGame: number;
}

export interface RatingFactors {
  technicalExecution: number;    // 24.5% of total (35% of 70% technical)
  courtPositioning: number;      // 17.5% of total (25% of 70% technical)
  shotConsistency: number;       // 17.5% of total (25% of 70% technical)
  winnersImpact: number;         // 10.5% of total (15% of 70% technical)
  matchOutcome: number;          // 19.5% of total (65% of 30% competitive)
  opponentDifferential: number;  // 10.5% of total (35% of 30% competitive)
}

export interface PerformanceMetrics {
  technicalScore: number;
  positionScore: number;
  consistencyScore: number;
  winnerImpact: number;
  courtCoverage: number;
  strategicMovement: number;
  recoveryEfficiency: number;
  pressurePerformance: number;
  unforcedErrorRate: number;
  rallyMaintenance: number;
  rhythmBreaking: number;
}

export class RaydelRatingEngine {
  private static readonly BASE_RATING = 1500;
  private static readonly K_FACTOR = 32;
  
  // Primary Technical Factors (70% Total Weight)
  private static readonly TECHNICAL_WEIGHTS = {
    TECHNICAL_EXECUTION: 0.245,    // 24.5% (35% of 70%)
    COURT_POSITIONING: 0.175,      // 17.5% (25% of 70%)
    SHOT_CONSISTENCY: 0.175,       // 17.5% (25% of 70%)
    WINNERS_IMPACT: 0.105          // 10.5% (15% of 70%)
  };

  // Competitive Context Factors (30% Total Weight)
  private static readonly COMPETITIVE_WEIGHTS = {
    MATCH_OUTCOME: 0.195,          // 19.5% (65% of 30%)
    OPPONENT_DIFFERENTIAL: 0.105   // 10.5% (35% of 30%)
  };

  /**
   * Calculate Technical Execution Score (24.5% weight)
   */
  static calculateTechnicalExecution(
    shot: ShotData,
    context: MatchContext,
    recentShots: ShotData[]
  ): number {
    let baseScore = 0;

    // Shot quality scoring
    switch (shot.outcome) {
      case 'perfect':
        baseScore = 2;
        break;
      case 'good':
        baseScore = 1;
        break;
      case 'minor_error':
        baseScore = -0.5;
        break;
      case 'major_error':
        baseScore = -1;
        break;
      case 'winner':
        baseScore = 2;
        break;
      case 'forced_error':
        baseScore = 1; // Opponent error
        break;
    }

    // Apply difficulty multiplier
    const difficultyMultiplier = this.getDifficultyMultiplier(shot.difficulty);
    baseScore *= difficultyMultiplier;

    // Apply recency weight (more recent shots have higher impact)
    const recencyWeight = this.getRecencyWeight(shot.timestamp, context);
    baseScore *= recencyWeight;

    // Apply pressure multiplier
    const pressureMultiplier = this.getPressureMultiplier(context, shot.pressure);
    baseScore *= pressureMultiplier;

    return baseScore * this.TECHNICAL_WEIGHTS.TECHNICAL_EXECUTION;
  }

  /**
   * Calculate Court Positioning Score (17.5% weight)
   */
  static calculateCourtPositioning(
    shot: ShotData,
    playerMovement: Array<{x: number, y: number, timestamp: number}>,
    courtDimensions: {width: number, height: number}
  ): number {
    // Court Coverage (40% of positioning score)
    const courtCoverage = this.calculateCourtCoverage(playerMovement, courtDimensions);
    
    // Strategic Movement (30% of positioning score)
    const strategicMovement = this.calculateStrategicMovement(playerMovement, shot);
    
    // Recovery Efficiency (30% of positioning score)
    const recoveryEfficiency = this.calculateRecoveryEfficiency(playerMovement);

    const positionScore = (courtCoverage * 0.4) + (strategicMovement * 0.3) + (recoveryEfficiency * 0.3);

    // Apply position-based multipliers
    let multiplier = 1.0;
    if (shot.isOptimalPosition) {
      multiplier = 1.5; // Optimal position bonus
    } else if (!shot.isOptimalPosition && (shot.outcome === 'major_error' || shot.outcome === 'minor_error')) {
      multiplier = 0.5; // Poor positioning penalty
    }

    return positionScore * multiplier * this.TECHNICAL_WEIGHTS.COURT_POSITIONING;
  }

  /**
   * Calculate Shot Consistency Score (17.5% weight)
   */
  static calculateShotConsistency(
    shots: ShotData[],
    context: MatchContext
  ): number {
    if (shots.length === 0) return 0;

    const totalShots = shots.length;
    const unforcedErrors = shots.filter(s => s.outcome === 'major_error' || s.outcome === 'minor_error').length;
    
    // Base consistency score
    const baseConsistency = 1 - (unforcedErrors / totalShots);
    
    // Consecutive shot bonus
    const consecutiveBonus = this.calculateConsecutiveBonus(shots);
    
    // Rally maintenance bonus
    const rallyBonus = this.calculateRallyBonus(shots);
    
    // Rhythm breaking bonus
    const rhythmBonus = this.calculateRhythmBonus(shots);
    
    // Pressure performance multiplier
    const pressureMultiplier = this.calculatePressurePerformance(shots, context);

    const consistencyScore = (baseConsistency + consecutiveBonus + rallyBonus + rhythmBonus) * pressureMultiplier;

    return consistencyScore * this.TECHNICAL_WEIGHTS.SHOT_CONSISTENCY;
  }

  /**
   * Calculate Winners Impact Score (10.5% weight)
   */
  static calculateWinnersImpact(
    shot: ShotData,
    context: MatchContext,
    matchDuration: number
  ): number {
    let winnerScore = 0;

    // Base winner scoring
    switch (shot.outcome) {
      case 'winner':
        winnerScore = 2; // Clean winner
        break;
      case 'forced_error':
        winnerScore = 1; // Forced error from opponent
        break;
    }

    // Context multipliers
    let contextMultiplier = 1.0;
    if (context.matchPoint) {
      contextMultiplier = 5.0; // Match-winning point
    } else if (context.setPoint) {
      contextMultiplier = 3.0; // Set-winning point
    } else if (context.gamePoint) {
      contextMultiplier = 1.5; // Game point
    }

    // Frequency factor (normalize by match duration)
    const frequencyFactor = this.calculateFrequencyFactor(matchDuration);

    const winnerImpact = winnerScore * contextMultiplier * frequencyFactor;

    return winnerImpact * this.TECHNICAL_WEIGHTS.WINNERS_IMPACT;
  }

  /**
   * Calculate Match Outcome Score (19.5% weight)
   */
  static calculateMatchOutcome(
    gamesDifferential: number,
    setsDifferential: number,
    matchResult: 'win' | 'loss',
    basePerformance: number
  ): number {
    let outcomeScore = 0;

    // Game-level results (±1 point per game differential)
    outcomeScore += gamesDifferential * 1;

    // Set-level results (±3 points per set differential)
    outcomeScore += setsDifferential * 3;

    // Match result bonus/penalty
    const matchMultiplier = matchResult === 'win' ? 1.2 : 0.8;
    outcomeScore *= matchMultiplier;

    // Apply to base performance
    const finalOutcomeScore = basePerformance * (1 + (outcomeScore * 0.1));

    return finalOutcomeScore * this.COMPETITIVE_WEIGHTS.MATCH_OUTCOME;
  }

  /**
   * Calculate Opponent Rating Differential (10.5% weight)
   */
  static calculateOpponentDifferential(
    playerRating: number,
    opponentRating: number,
    performance: number
  ): number {
    const ratingDiff = opponentRating - playerRating;
    
    // Multiplier scale from 0.5x to 2.0x based on rating differential
    let multiplier = 1.0;
    if (ratingDiff > 0) {
      // Playing against higher-rated opponent
      multiplier = Math.min(2.0, 1.0 + (ratingDiff * 0.001));
    } else {
      // Playing against lower-rated opponent
      multiplier = Math.max(0.5, 1.0 + (ratingDiff * 0.001));
    }

    const adjustedPerformance = performance * multiplier;

    return adjustedPerformance * this.COMPETITIVE_WEIGHTS.OPPONENT_DIFFERENTIAL;
  }

  /**
   * Process complete match and return comprehensive rating analysis
   */
  static processMatch(
    currentRating: number,
    opponentRating: number,
    shots: ShotData[],
    playerMovement: Array<{x: number, y: number, timestamp: number}>,
    matchResult: 'win' | 'loss',
    sets: Array<{ playerScore: number; opponentScore: number }>,
    matchDuration: number
  ): { 
    newRating: number; 
    ratingChange: number; 
    breakdown: RatingFactors;
    metrics: PerformanceMetrics;
  } {
    let totalTechnicalScore = 0;
    let totalPositioningScore = 0;
    let totalConsistencyScore = 0;
    let totalWinnersScore = 0;

    const courtDimensions = { width: 800, height: 600 };

    // Process each shot for technical factors
    shots.forEach((shot, index) => {
      const context: MatchContext = {
        gamePoint: false, // Would need game state tracking
        setPoint: false,  // Would need set state tracking
        matchPoint: index === shots.length - 1 && matchResult === 'win',
        opponentRating,
        currentRating,
        currentSet: 1, // Simplified
        currentGame: 1  // Simplified
      };

      const recentShots = shots.slice(Math.max(0, index - 10), index + 1);

      // Calculate technical factors
      totalTechnicalScore += this.calculateTechnicalExecution(shot, context, recentShots);
      totalPositioningScore += this.calculateCourtPositioning(shot, playerMovement, courtDimensions);
      totalWinnersScore += this.calculateWinnersImpact(shot, context, matchDuration);
    });

    // Calculate consistency for all shots
    const mockContext: MatchContext = {
      gamePoint: false,
      setPoint: false,
      matchPoint: false,
      opponentRating,
      currentRating,
      currentSet: 1,
      currentGame: 1
    };
    totalConsistencyScore = this.calculateShotConsistency(shots, mockContext);

    // Calculate competitive factors
    const gamesDifferential = sets.reduce((diff, set) => 
      diff + (set.playerScore - set.opponentScore), 0
    );
    const setsDifferential = sets.reduce((diff, set) => {
      if (set.playerScore > set.opponentScore) return diff + 1;
      if (set.playerScore < set.opponentScore) return diff - 1;
      return diff;
    }, 0);

    const basePerformance = totalTechnicalScore + totalPositioningScore + totalConsistencyScore + totalWinnersScore;
    
    const matchOutcomeScore = this.calculateMatchOutcome(
      gamesDifferential,
      setsDifferential,
      matchResult,
      basePerformance
    );

    const opponentDifferentialScore = this.calculateOpponentDifferential(
      currentRating,
      opponentRating,
      basePerformance
    );

    // Calculate final rating change
    const totalRatingChange = basePerformance + matchOutcomeScore + opponentDifferentialScore;
    const newRating = Math.max(1000, currentRating + Math.round(totalRatingChange));

    // Create detailed breakdown
    const breakdown: RatingFactors = {
      technicalExecution: totalTechnicalScore,
      courtPositioning: totalPositioningScore,
      shotConsistency: totalConsistencyScore,
      winnersImpact: totalWinnersScore,
      matchOutcome: matchOutcomeScore,
      opponentDifferential: opponentDifferentialScore
    };

    // Calculate performance metrics
    const metrics: PerformanceMetrics = {
      technicalScore: totalTechnicalScore / shots.length,
      positionScore: totalPositioningScore / shots.length,
      consistencyScore: totalConsistencyScore,
      winnerImpact: totalWinnersScore,
      courtCoverage: this.calculateCourtCoverage(playerMovement, courtDimensions),
      strategicMovement: this.calculateAverageStrategicMovement(playerMovement, shots),
      recoveryEfficiency: this.calculateRecoveryEfficiency(playerMovement),
      pressurePerformance: this.calculatePressurePerformance(shots, mockContext),
      unforcedErrorRate: shots.filter(s => s.outcome === 'major_error' || s.outcome === 'minor_error').length / shots.length,
      rallyMaintenance: this.calculateRallyBonus(shots),
      rhythmBreaking: this.calculateRhythmBonus(shots)
    };

    return {
      newRating: Math.round(newRating),
      ratingChange: Math.round(totalRatingChange),
      breakdown,
      metrics
    };
  }

  // Helper methods for calculations
  private static getDifficultyMultiplier(difficulty: string): number {
    switch (difficulty) {
      case 'hard': return 1.5;
      case 'medium': return 1.0;
      case 'easy': return 0.8;
      default: return 1.0;
    }
  }

  private static getRecencyWeight(timestamp: number, context: MatchContext): number {
    // More recent shots have higher impact (simplified)
    return 1.0; // Would implement time-based weighting
  }

  private static getPressureMultiplier(context: MatchContext, shotPressure: string): number {
    let multiplier = 1.0;

    // Context pressure
    if (context.matchPoint) multiplier *= 2.0;
    else if (context.setPoint) multiplier *= 1.5;
    else if (context.gamePoint) multiplier *= 1.2;

    // Shot-specific pressure
    switch (shotPressure) {
      case 'high': multiplier *= 1.3; break;
      case 'low': multiplier *= 0.8; break;
    }

    return multiplier;
  }

  private static calculateCourtCoverage(
    movement: Array<{x: number, y: number, timestamp: number}>,
    court: {width: number, height: number}
  ): number {
    if (movement.length === 0) return 0;
    
    // Calculate coverage as percentage of court area covered
    const gridSize = 10;
    const visited = new Set<string>();
    
    movement.forEach(pos => {
      const gridX = Math.floor((pos.x / court.width) * gridSize);
      const gridY = Math.floor((pos.y / court.height) * gridSize);
      visited.add(`${gridX},${gridY}`);
    });
    
    return visited.size / (gridSize * gridSize);
  }

  private static calculateStrategicMovement(
    movement: Array<{x: number, y: number, timestamp: number}>,
    shot: ShotData
  ): number {
    // Simplified strategic movement calculation
    return shot.isOptimalPosition ? 1.0 : 0.5;
  }

  private static calculateAverageStrategicMovement(
    movement: Array<{x: number, y: number, timestamp: number}>,
    shots: ShotData[]
  ): number {
    if (shots.length === 0) return 0;
    const total = shots.reduce((sum, shot) => sum + (shot.isOptimalPosition ? 1 : 0), 0);
    return total / shots.length;
  }

  private static calculateRecoveryEfficiency(
    movement: Array<{x: number, y: number, timestamp: number}>
  ): number {
    // Simplified recovery efficiency calculation
    return 0.8; // Would calculate based on movement patterns
  }

  private static calculateConsecutiveBonus(shots: ShotData[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    shots.forEach(shot => {
      if (shot.outcome === 'perfect' || shot.outcome === 'good' || shot.outcome === 'winner') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return Math.min(maxStreak * 0.1, 1.5); // Up to 1.5x multiplier
  }

  private static calculateRallyBonus(shots: ShotData[]): number {
    // +0.25 points per exchange maintained
    let rallyLength = 0;
    let totalBonus = 0;
    
    shots.forEach(shot => {
      if (shot.outcome !== 'major_error') {
        rallyLength++;
      } else {
        totalBonus += rallyLength * 0.25;
        rallyLength = 0;
      }
    });
    
    return totalBonus / shots.length;
  }

  private static calculateRhythmBonus(shots: ShotData[]): number {
    // +1 point for breaking opponent's rhythm (simplified)
    const rhythmBreaks = shots.filter(shot => shot.outcome === 'winner').length;
    return rhythmBreaks * 1.0;
  }

  private static calculatePressurePerformance(shots: ShotData[], context: MatchContext): number {
    const pressureShots = shots.filter(shot => shot.pressure === 'high');
    if (pressureShots.length === 0) return 1.0;
    
    const successfulPressureShots = pressureShots.filter(shot => 
      shot.outcome === 'perfect' || shot.outcome === 'good' || shot.outcome === 'winner'
    ).length;
    
    return successfulPressureShots / pressureShots.length;
  }

  private static calculateFrequencyFactor(matchDuration: number): number {
    // Normalize by match duration (simplified)
    return Math.max(0.5, Math.min(2.0, 60 / matchDuration));
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
}