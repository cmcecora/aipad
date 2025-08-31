import type { EdgeFrame, DetectedLine } from '../types/computerVision';

/**
 * Hough Line Transform Implementation for Court Line Detection
 * Phase 2: Core computer vision algorithms
 * 
 * Implements Hough Line Transform algorithm:
 * 1. Create accumulator array
 * 2. Vote for line parameters
 * 3. Find peaks in accumulator
 * 4. Convert back to line coordinates
 */
export class HoughLineDetector {
  
  /**
   * Main Hough line detection method
   * @param edges - Edge-detected frame
   * @param rhoResolution - Resolution for rho parameter (default: 1)
   * @param thetaResolution - Resolution for theta parameter in radians (default: π/180)
   * @param threshold - Minimum votes to consider a line (default: 50)
   * @returns Array of detected lines
   */
  static detectLines(
    edges: EdgeFrame,
    rhoResolution: number = 1,
    thetaResolution: number = Math.PI / 180,
    threshold: number = 50
  ): DetectedLine[] {
    const { width, height, data } = edges;
    
    // Calculate parameter ranges
    const maxRho = Math.sqrt(width * width + height * height);
    const rhoCount = Math.ceil(maxRho / rhoResolution);
    const thetaCount = Math.ceil(Math.PI / thetaResolution);
    
    // Create accumulator array
    const accumulator = new Array(rhoCount).fill(0).map(() => new Array(thetaCount).fill(0));
    
    // Vote for line parameters
    this.voteForLines(data, width, height, accumulator, rhoResolution, thetaResolution);
    
    // Find peaks in accumulator
    const peaks = this.findPeaks(accumulator, threshold);
    
    // Convert peaks to line coordinates
    const lines = this.peaksToLines(peaks, rhoResolution, thetaResolution, width, height);
    
    // Filter and validate lines
    return this.filterLines(lines, width, height);
  }
  
  /**
   * Vote for line parameters in Hough space
   */
  private static voteForLines(
    edgeData: Uint8Array,
    width: number,
    height: number,
    accumulator: number[][],
    rhoResolution: number,
    thetaResolution: number
  ): void {
    const rhoCount = accumulator.length;
    const thetaCount = accumulator[0].length;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        // Only process edge pixels
        if (edgeData[idx] === 0) continue;
        
        // Vote for all possible theta values
        for (let thetaIdx = 0; thetaIdx < thetaCount; thetaIdx++) {
          const theta = thetaIdx * thetaResolution;
          
          // Calculate rho for this theta
          const rho = x * Math.cos(theta) + y * Math.sin(theta);
          
          // Convert rho to accumulator index
          const rhoIdx = Math.round((rho + Math.sqrt(width * width + height * height)) / rhoResolution);
          
          // Check bounds and increment accumulator
          if (rhoIdx >= 0 && rhoIdx < rhoCount) {
            accumulator[rhoIdx][thetaIdx]++;
          }
        }
      }
    }
  }
  
  /**
   * Find peaks in the accumulator array
   */
  private static findPeaks(
    accumulator: number[][],
    threshold: number
  ): Array<{ rhoIdx: number; thetaIdx: number; votes: number }> {
    const peaks: Array<{ rhoIdx: number; thetaIdx: number; votes: number }> = [];
    const rhoCount = accumulator.length;
    const thetaCount = accumulator[0].length;
    
    // Find local maxima in accumulator
    for (let rhoIdx = 1; rhoIdx < rhoCount - 1; rhoIdx++) {
      for (let thetaIdx = 1; thetaIdx < thetaCount - 1; thetaIdx++) {
        const votes = accumulator[rhoIdx][thetaIdx];
        
        if (votes < threshold) continue;
        
        // Check if this is a local maximum
        let isLocalMax = true;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dt = -1; dt <= 1; dt++) {
            if (dr === 0 && dt === 0) continue;
            
            const neighborRho = rhoIdx + dr;
            const neighborTheta = thetaIdx + dt;
            
            if (neighborRho >= 0 && neighborRho < rhoCount &&
                neighborTheta >= 0 && neighborTheta < thetaCount) {
              if (accumulator[neighborRho][neighborTheta] >= votes) {
                isLocalMax = false;
                break;
              }
            }
          }
          if (!isLocalMax) break;
        }
        
        if (isLocalMax) {
          peaks.push({ rhoIdx, thetaIdx, votes });
        }
      }
    }
    
    // Sort peaks by vote count (descending)
    peaks.sort((a, b) => b.votes - a.votes);
    
    return peaks;
  }
  
  /**
   * Convert accumulator peaks to line coordinates
   */
  private static peaksToLines(
    peaks: Array<{ rhoIdx: number; thetaIdx: number; votes: number }>,
    rhoResolution: number,
    thetaResolution: number,
    width: number,
    height: number
  ): DetectedLine[] {
    const lines: DetectedLine[] = [];
    const maxRho = Math.sqrt(width * width + height * height);
    
    for (const peak of peaks) {
      // Convert indices back to parameters
      const rho = (peak.rhoIdx * rhoResolution) - maxRho;
      const theta = peak.thetaIdx * thetaResolution;
      
      // Calculate line endpoints
      const line = this.calculateLineEndpoints(rho, theta, width, height);
      
      if (line) {
        lines.push({
          x1: line.x1,
          y1: line.y1,
          x2: line.x2,
          y2: line.y2,
          angle: theta * 180 / Math.PI, // Convert to degrees
          type: this.classifyLineType(theta),
          confidence: Math.min(1.0, peak.votes / 100), // Normalize confidence
          length: Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2)
        });
      }
    }
    
    return lines;
  }
  
  /**
   * Calculate line endpoints from rho and theta parameters
   */
  private static calculateLineEndpoints(
    rho: number,
    theta: number,
    width: number,
    height: number
  ): { x1: number; y1: number; x2: number; y2: number } | null {
    // Handle vertical lines (theta = π/2 or 3π/2)
    if (Math.abs(Math.cos(theta)) < 1e-6) {
      const x = rho;
      if (x < 0 || x >= width) return null;
      
      return {
        x1: x,
        y1: 0,
        x2: x,
        y2: height - 1
      };
    }
    
    // Handle horizontal lines (theta = 0 or π)
    if (Math.abs(Math.sin(theta)) < 1e-6) {
      const y = rho;
      if (y < 0 || y >= height) return null;
      
      return {
        x1: 0,
        y1: y,
        x2: width - 1,
        y2: y
      };
    }
    
    // General case: calculate intersection with image boundaries
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    
    // Calculate intersection points with image boundaries
    const intersections: Array<{ x: number; y: number }> = [];
    
    // Top edge (y = 0)
    const xTop = rho / cosTheta;
    if (xTop >= 0 && xTop < width) {
      intersections.push({ x: xTop, y: 0 });
    }
    
    // Bottom edge (y = height - 1)
    const xBottom = (rho - (height - 1) * sinTheta) / cosTheta;
    if (xBottom >= 0 && xBottom < width) {
      intersections.push({ x: xBottom, y: height - 1 });
    }
    
    // Left edge (x = 0)
    const yLeft = rho / sinTheta;
    if (yLeft >= 0 && yLeft < height) {
      intersections.push({ x: 0, y: yLeft });
    }
    
    // Right edge (x = width - 1)
    const yRight = (rho - (width - 1) * cosTheta) / sinTheta;
    if (yRight >= 0 && yRight < height) {
      intersections.push({ x: width - 1, y: yRight });
    }
    
    // Find the two valid intersection points
    if (intersections.length >= 2) {
      // Sort by distance from top-left corner
      intersections.sort((a, b) => (a.x + a.y) - (b.x + b.y));
      
      return {
        x1: Math.round(intersections[0].x),
        y1: Math.round(intersections[0].y),
        x2: Math.round(intersections[intersections.length - 1].x),
        y2: Math.round(intersections[intersections.length - 1].y)
      };
    }
    
    return null;
  }
  
  /**
   * Classify line as horizontal or vertical based on angle
   */
  private static classifyLineType(theta: number): 'horizontal' | 'vertical' {
    // Normalize theta to 0-π range
    const normalizedTheta = ((theta % Math.PI) + Math.PI) % Math.PI;
    
    // Consider lines within ±15 degrees of horizontal/vertical as such
    const horizontalThreshold = 15 * Math.PI / 180; // 15 degrees
    const verticalThreshold = Math.PI / 2 - horizontalThreshold;
    
    if (normalizedTheta < horizontalThreshold || normalizedTheta > Math.PI - horizontalThreshold) {
      return 'horizontal';
    } else if (Math.abs(normalizedTheta - Math.PI / 2) < horizontalThreshold) {
      return 'vertical';
    } else {
      // For diagonal lines, classify based on dominant direction
      return normalizedTheta < Math.PI / 2 ? 'horizontal' : 'vertical';
    }
  }
  
  /**
   * Filter lines based on quality criteria
   */
  private static filterLines(
    lines: DetectedLine[],
    width: number,
    height: number
  ): DetectedLine[] {
    const minLength = Math.min(width, height) * 0.1; // Minimum 10% of image dimension
    const maxLength = Math.max(width, height) * 1.5; // Maximum 150% of image dimension
    
    return lines.filter(line => {
      // Filter by length
      if (line.length < minLength || line.length > maxLength) {
        return false;
      }
      
      // Filter by confidence
      if (line.confidence < 0.3) {
        return false;
      }
      
      // Filter very short lines that might be noise
      if (line.length < 20) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Optimize Hough transform parameters based on image characteristics
   */
  static optimizeParameters(
    edges: EdgeFrame,
    targetLineCount: number = 10
  ): { rhoResolution: number; thetaResolution: number; threshold: number } {
    const { width, height } = edges;
    const edgeDensity = this.calculateEdgeDensity(edges);
    
    // Adjust resolution based on image size and edge density
    const baseRhoResolution = Math.max(1, Math.min(3, Math.sqrt(width * height) / 100));
    const baseThetaResolution = Math.max(Math.PI / 180, Math.min(Math.PI / 90, Math.PI / (width + height)));
    
    // Adjust threshold based on edge density
    const baseThreshold = Math.max(20, Math.min(100, edgeDensity * 1000));
    
    return {
      rhoResolution: baseRhoResolution,
      thetaResolution: baseThetaResolution,
      threshold: baseThreshold
    };
  }
  
  /**
   * Calculate edge density for parameter optimization
   */
  private static calculateEdgeDensity(edges: EdgeFrame): number {
    const { data } = edges;
    let edgePixels = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i] > 0) {
        edgePixels++;
      }
    }
    
    return edgePixels / data.length;
  }
  
  /**
   * Fast line detection for performance-critical scenarios
   */
  static fastLineDetection(
    edges: EdgeFrame,
    maxLines: number = 20
  ): DetectedLine[] {
    // Use simpler parameters for faster processing
    const lines = this.detectLines(
      edges,
      2, // Larger rho resolution
      Math.PI / 90, // Larger theta resolution
      30 // Lower threshold
    );
    
    // Return only the top lines by confidence
    return lines
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxLines);
  }
}
