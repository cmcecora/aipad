// Computer Vision Types for Padel Court Line Detection

export interface FrameData {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
  format: 'rgb' | 'rgba' | 'grayscale';
  timestamp: number;
}

export interface GrayscaleFrame {
  width: number;
  height: number;
  data: Uint8Array;
  timestamp: number;
}

export interface BlurredFrame {
  width: number;
  height: number;
  data: Uint8Array;
  timestamp: number;
  blurRadius: number;
}

export interface EdgeFrame {
  width: number;
  height: number;
  data: Uint8Array;
  timestamp: number;
  edgeThreshold: number;
}

export interface DetectedLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  type: 'horizontal' | 'vertical';
  confidence: number;
  length: number;
}

export interface CourtLine {
  id: 'topBackWall' | 'baseline' | 'verticalCenter';
  detectedLine: DetectedLine;
  alignmentScore: number;
}

export interface ProcessingParams {
  cannyLowThreshold: number;
  cannyHighThreshold: number;
  houghRhoResolution: number;
  houghThetaResolution: number;
  houghThreshold: number;
  minLineLength: number;
  maxLineGap: number;
}

export interface DeviceMetrics {
  cpuCores: number;
  memoryGB: number;
  gpuType: string;
  performanceTier: 'low' | 'medium' | 'high';
}

export interface FrameProcessorResult {
  detectedLines: DetectedLine[];
  processingTime: number;
  frameQuality: number;
  error?: string;
}

export interface AlignmentResult {
  isAligned: boolean;
  alignmentScore: number;
  alignedLines: CourtLine[];
  feedback: string;
}
