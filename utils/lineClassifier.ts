import type { DetectedLine, CourtLine } from '../types/computerVision';

/**
 * Line Classification and Filtering for Court Line Detection
 * Phase 2: Core computer vision algorithms
 * 
 * Features:
 * - Classify lines by orientation
 * - Filter for padel court specific lines
 * - Expected positions and orientations
 * - Confidence scoring and validation
 */
export class LineClassifier {
  
  /**
   * Classify lines by orientation (horizontal/vertical)
   * @param lines - Array of detected lines
   * @returns Object with horizontal and vertical line arrays
   */
  static classifyLines(lines: DetectedLine[]): {
    horizontal: DetectedLine[];
    vertical: DetectedLine[];
  } {
    const horizontal: DetectedLine[] = [];
    const vertical: DetectedLine[] = [];
    
    for (const line of lines) {
      if (line.type === 'horizontal') {
        horizontal.push(line);
      } else if (line.type === 'vertical') {
        vertical.push(line);
      }
    }
    
    // Sort by confidence (descending)
    horizontal.sort((a, b) => b.confidence - a.confidence);
    vertical.sort((a, b) => b.confidence - a.confidence);
    
    return { horizontal, vertical };
  }
  
  /**
   * Filter lines for padel court specific characteristics
   * @param lines - Array of detected lines
   * @param frameWidth - Width of the frame
   * @param frameHeight - Height of the frame
   * @returns Array of lines that could be court lines
   */
  static filterCourtLines(
    lines: DetectedLine[],
    frameWidth: number,
    frameHeight: number
  ): DetectedLine[] {
    return lines.filter(line => {
      // Filter by length - court lines should be reasonably long
      const minLength = Math.min(frameWidth, frameHeight) * 0.15; // At least 15% of image dimension
      const maxLength = Math.max(frameWidth, frameHeight) * 1.2;  // At most 120% of image dimension
      
      if (line.length < minLength || line.length > maxLength) {
        return false;
      }
      
      // Filter by confidence - require reasonable confidence
      if (line.confidence < 0.4) {
        return false;
      }
      
      // Filter by angle - court lines should be nearly horizontal or vertical
      const angle = Math.abs(line.angle);
      const horizontalThreshold = 15; // ±15 degrees for horizontal
      const verticalThreshold = 15;   // ±15 degrees for vertical
      
      if (line.type === 'horizontal') {
        if (angle > horizontalThreshold && angle < (180 - horizontalThreshold)) {
          return false;
        }
      } else if (line.type === 'vertical') {
        if (Math.abs(angle - 90) > verticalThreshold) {
          return false;
        }
      }
      
      // Filter very short lines that might be noise
      if (line.length < 30) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Identify potential court lines based on position and characteristics
   * @param lines - Filtered court lines
   * @param frameWidth - Width of the frame
   * @param frameHeight - Height of the frame
   * @returns Array of identified court lines with scores
   */
  static identifyCourtLines(
    lines: DetectedLine[],
    frameWidth: number,
    frameHeight: number
  ): CourtLine[] {
    const { horizontal, vertical } = this.classifyLines(lines);
    const courtLines: CourtLine[] = [];
    
    // Identify top back wall line (horizontal, around 15% from top)
    const topWallLine = this.findLineNearPosition(
      horizontal,
      frameHeight * 0.15,
      'y',
      frameHeight * 0.1, // 10% tolerance
      'topBackWall'
    );
    
    if (topWallLine) {
      courtLines.push(topWallLine);
    }
    
    // Identify baseline/service line (horizontal, around 75% from top)
    const baselineLine = this.findLineNearPosition(
      horizontal,
      frameHeight * 0.75,
      'y',
      frameHeight * 0.1, // 10% tolerance
      'baseline'
    );
    
    if (baselineLine) {
      courtLines.push(baselineLine);
    }
    
    // Identify center line (vertical, centered horizontally)
    const centerLine = this.findLineNearPosition(
      vertical,
      frameWidth * 0.5,
      'x',
      frameWidth * 0.15, // 15% tolerance
      'verticalCenter'
    );
    
    if (centerLine) {
      courtLines.push(centerLine);
    }
    
    // Sort by alignment score (descending)
    courtLines.sort((a, b) => b.alignmentScore - a.alignmentScore);
    
    return courtLines;
  }
  
  /**
   * Find a line near a specific position
   * @param lines - Array of lines to search
   * @param targetPosition - Target position (x or y coordinate)
   * @param coordinate - Which coordinate to check ('x' or 'y')
   * @param tolerance - Tolerance for position matching
   * @param lineId - ID for the court line type
   * @returns CourtLine object if found, null otherwise
   */
  private static findLineNearPosition(
    lines: DetectedLine[],
    targetPosition: number,
    coordinate: 'x' | 'y',
    tolerance: number,
    lineId: 'topBackWall' | 'baseline' | 'verticalCenter'
  ): CourtLine | null {
    let bestLine: DetectedLine | null = null;
    let bestScore = 0;
    
    for (const line of lines) {
      let position: number;
      
      if (coordinate === 'x') {
        // For vertical lines, use x-coordinate
        position = (line.x1 + line.x2) / 2;
      } else {
        // For horizontal lines, use y-coordinate
        position = (line.y1 + line.y2) / 2;
      }
      
      // Calculate distance from target position
      const distance = Math.abs(position - targetPosition);
      
      if (distance <= tolerance) {
        // Calculate alignment score (closer = higher score)
        const positionScore = 1 - (distance / tolerance);
        const confidenceScore = line.confidence;
        const lengthScore = Math.min(1, line.length / (Math.max(line.length, 100)));
        
        // Combined score (weighted average)
        const alignmentScore = (positionScore * 0.4 + confidenceScore * 0.4 + lengthScore * 0.2);
        
        if (alignmentScore > bestScore) {
          bestScore = alignmentScore;
          bestLine = line;
        }
      }
    }
    
    if (bestLine) {
      return {
        id: lineId,
        detectedLine: bestLine,
        alignmentScore: bestScore
      };
    }
    
    return null;
  }
  
  /**
   * Calculate overall court detection confidence
   * @param courtLines - Array of identified court lines
   * @returns Confidence score from 0 to 1
   */
  static calculateCourtDetectionConfidence(courtLines: CourtLine[]): number {
    if (courtLines.length === 0) {
      return 0;
    }
    
    // Calculate average alignment score
    const totalScore = courtLines.reduce((sum, line) => sum + line.alignmentScore, 0);
    const averageScore = totalScore / courtLines.length;
    
    // Bonus for detecting all three expected lines
    const completenessBonus = courtLines.length === 3 ? 0.2 : 0;
    
    // Penalty for missing lines
    const missingPenalty = (3 - courtLines.length) * 0.1;
    
    return Math.max(0, Math.min(1, averageScore + completenessBonus - missingPenalty));
  }
  
  /**
   * Validate court line detection results
   * @param courtLines - Array of identified court lines
   * @param frameWidth - Width of the frame
   * @param frameHeight - Height of the frame
   * @returns Validation result with feedback
   */
  static validateCourtLines(
    courtLines: CourtLine[],
    frameWidth: number,
    frameHeight: number
  ): {
    isValid: boolean;
    feedback: string;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check if we have the expected number of lines
    if (courtLines.length < 2) {
      issues.push('Insufficient court lines detected');
    }
    
    // Check for duplicate line types
    const lineTypes = courtLines.map(line => line.id);
    const uniqueTypes = new Set(lineTypes);
    if (lineTypes.length !== uniqueTypes.size) {
      issues.push('Duplicate line types detected');
    }
    
    // Check line spacing and positioning
    const horizontalLines = courtLines.filter(line => 
      line.id === 'topBackWall' || line.id === 'baseline'
    );
    
    if (horizontalLines.length >= 2) {
      const y1 = horizontalLines[0].detectedLine.y1;
      const y2 = horizontalLines[1].detectedLine.y1;
      const spacing = Math.abs(y2 - y1);
      const expectedSpacing = frameHeight * 0.6; // Expected spacing between lines
      
      if (Math.abs(spacing - expectedSpacing) > frameHeight * 0.2) {
        issues.push('Horizontal line spacing appears incorrect');
      }
    }
    
    // Check if center line is roughly centered
    const centerLine = courtLines.find(line => line.id === 'verticalCenter');
    if (centerLine) {
      const centerX = (centerLine.detectedLine.x1 + centerLine.detectedLine.x2) / 2;
      const distanceFromCenter = Math.abs(centerX - frameWidth / 2);
      
      if (distanceFromCenter > frameWidth * 0.2) {
        issues.push('Center line appears off-center');
      }
    }
    
    // Generate feedback
    let feedback = '';
    if (issues.length === 0) {
      feedback = 'Court lines detected successfully';
    } else if (issues.length === 1) {
      feedback = `Minor issue: ${issues[0]}`;
    } else {
      feedback = `Multiple issues detected: ${issues.join(', ')}`;
    }
    
    return {
      isValid: issues.length === 0,
      feedback,
      issues
    };
  }
  
  /**
   * Filter lines by quality for performance optimization
   * @param lines - Array of detected lines
   * @param maxLines - Maximum number of lines to return
   * @returns Filtered array of high-quality lines
   */
  static filterByQuality(
    lines: DetectedLine[],
    maxLines: number = 20
  ): DetectedLine[] {
    // Sort by quality score (confidence * length)
    const qualityLines = lines.map(line => ({
      ...line,
      qualityScore: line.confidence * Math.min(1, line.length / 100)
    }));
    
    qualityLines.sort((a, b) => b.qualityScore - a.qualityScore);
    
    // Return top lines, removing the quality score
    return qualityLines.slice(0, maxLines).map(({ qualityScore, ...line }) => line);
  }
  
  /**
   * Merge similar lines to reduce redundancy
   * @param lines - Array of detected lines
   * @param mergeThreshold - Distance threshold for merging
   * @returns Array with merged lines
   */
  static mergeSimilarLines(
    lines: DetectedLine[],
    mergeThreshold: number = 10
  ): DetectedLine[] {
    if (lines.length <= 1) {
      return lines;
    }
    
    const merged: DetectedLine[] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;
      
      const currentLine = lines[i];
      const similarLines = [currentLine];
      used.add(i);
      
      // Find similar lines
      for (let j = i + 1; j < lines.length; j++) {
        if (used.has(j)) continue;
        
        const otherLine = lines[j];
        
        // Check if lines are similar (same type and close position)
        if (currentLine.type === otherLine.type) {
          const distance = this.calculateLineDistance(currentLine, otherLine);
          
          if (distance < mergeThreshold) {
            similarLines.push(otherLine);
            used.add(j);
          }
        }
      }
      
      // Merge similar lines
      if (similarLines.length === 1) {
        merged.push(currentLine);
      } else {
        merged.push(this.mergeLines(similarLines));
      }
    }
    
    return merged;
  }
  
  /**
   * Calculate distance between two lines
   */
  private static calculateLineDistance(line1: DetectedLine, line2: DetectedLine): number {
    if (line1.type === 'horizontal' && line2.type === 'horizontal') {
      // For horizontal lines, calculate vertical distance
      const y1 = (line1.y1 + line1.y2) / 2;
      const y2 = (line2.y1 + line2.y2) / 2;
      return Math.abs(y1 - y2);
    } else if (line1.type === 'vertical' && line2.type === 'vertical') {
      // For vertical lines, calculate horizontal distance
      const x1 = (line1.x1 + line1.x2) / 2;
      const x2 = (line2.x1 + line2.x2) / 2;
      return Math.abs(x1 - x2);
    }
    
    // For different types, use center point distance
    const center1 = { x: (line1.x1 + line1.x2) / 2, y: (line1.y1 + line1.y2) / 2 };
    const center2 = { x: (line2.x1 + line2.x2) / 2, y: (line2.y1 + line2.y2) / 2 };
    
    return Math.sqrt((center1.x - center2.x) ** 2 + (center1.y - center2.y) ** 2);
  }
  
  /**
   * Merge multiple similar lines into one
   */
  private static mergeLines(lines: DetectedLine[]): DetectedLine {
    if (lines.length === 1) {
      return lines[0];
    }
    
    // Calculate weighted average based on confidence
    let totalWeight = 0;
    let weightedX1 = 0, weightedY1 = 0, weightedX2 = 0, weightedY2 = 0;
    let weightedConfidence = 0;
    
    for (const line of lines) {
      const weight = line.confidence;
      totalWeight += weight;
      
      weightedX1 += line.x1 * weight;
      weightedY1 += line.y1 * weight;
      weightedX2 += line.x2 * weight;
      weightedY2 += line.y2 * weight;
      weightedConfidence += line.confidence * weight;
    }
    
    // Normalize by total weight
    const mergedLine: DetectedLine = {
      x1: Math.round(weightedX1 / totalWeight),
      y1: Math.round(weightedY1 / totalWeight),
      x2: Math.round(weightedX2 / totalWeight),
      y2: Math.round(weightedY2 / totalWeight),
      angle: lines[0].angle, // Use angle from first line
      type: lines[0].type,   // Use type from first line
      confidence: weightedConfidence / totalWeight,
      length: Math.sqrt(
        (weightedX2 / totalWeight - weightedX1 / totalWeight) ** 2 +
        (weightedY2 / totalWeight - weightedY1 / totalWeight) ** 2
      )
    };
    
    return mergedLine;
  }
}
