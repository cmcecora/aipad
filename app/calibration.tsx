import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, X, RotateCcw, Play } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CalibrationScreen() {
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [primaryCameraAligned, setPrimaryCameraAligned] = useState(false);
  const [secondaryCameraAligned, setSecondaryCameraAligned] = useState(false);
  const [courtMapped, setCourtMapped] = useState(false);

  const calibrationSteps = [
    'Position Primary Camera',
    'Position Secondary Camera',
    'Align Court Boundaries',
    'Sync Cameras',
    'Verify Setup'
  ];

  const handleCalibrateStep = () => {
    setIsCalibrating(true);
    
    setTimeout(() => {
      setIsCalibrating(false);
      
      switch (calibrationStep) {
        case 0:
          setPrimaryCameraAligned(true);
          break;
        case 1:
          setSecondaryCameraAligned(true);
          break;
        case 2:
          setCourtMapped(true);
          break;
        case 3:
          // Sync cameras
          break;
        case 4:
          // Verification complete
          break;
      }
      
      if (calibrationStep < calibrationSteps.length - 1) {
        setCalibrationStep(calibrationStep + 1);
      }
    }, 2000);
  };

  const handleStartRecording = () => {
    if (calibrationStep === calibrationSteps.length - 1) {
      router.push('/recording');
    } else {
      Alert.alert('Calibration Incomplete', 'Please complete all calibration steps first.');
    }
  };

  const handleRecalibrate = () => {
    setCalibrationStep(0);
    setPrimaryCameraAligned(false);
    setSecondaryCameraAligned(false);
    setCourtMapped(false);
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < calibrationStep) return 'completed';
    if (stepIndex === calibrationStep) return 'active';
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00FF88';
      case 'active': return '#00D4FF';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Camera Calibration</Text>
        <Text style={styles.headerSubtitle}>
          Step {calibrationStep + 1} of {calibrationSteps.length}
        </Text>
      </LinearGradient>

      {/* Camera Preview Area */}
      <View style={styles.previewContainer}>
        <View style={styles.previewArea}>
          <View style={styles.previewOverlay}>
            <Text style={styles.previewText}>Live Camera Preview</Text>
            <Text style={styles.previewSubtext}>
              {calibrationSteps[calibrationStep]}
            </Text>
          </View>
          
          {/* Court Boundary Guides */}
          <View style={styles.courtGuides}>
            <View style={styles.courtBoundary} />
            <View style={styles.netLine} />
            <View style={styles.serviceLines} />
          </View>
        </View>

        {/* Calibration Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: primaryCameraAligned ? '#00FF88' : '#666' }]} />
            <Text style={styles.statusText}>Primary Camera</Text>
            {primaryCameraAligned && <Check size={16} color="#00FF88" />}
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: secondaryCameraAligned ? '#00FF88' : '#666' }]} />
            <Text style={styles.statusText}>Secondary Camera</Text>
            {secondaryCameraAligned && <Check size={16} color="#00FF88" />}
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: courtMapped ? '#00FF88' : '#666' }]} />
            <Text style={styles.statusText}>Court Mapping</Text>
            {courtMapped && <Check size={16} color="#00FF88" />}
          </View>
        </View>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {calibrationSteps.map((step, index) => (
          <View key={index} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              { backgroundColor: getStepColor(getStepStatus(index)) }
            ]}>
              {getStepStatus(index) === 'completed' && (
                <Check size={12} color="#000" />
              )}
              {getStepStatus(index) === 'active' && (
                <Text style={styles.progressNumber}>{index + 1}</Text>
              )}
            </View>
            <Text style={[
              styles.progressText,
              { color: getStepColor(getStepStatus(index)) }
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>
          {calibrationSteps[calibrationStep]}
        </Text>
        <Text style={styles.instructionText}>
          {getInstructionText(calibrationStep)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleRecalibrate}
        >
          <RotateCcw size={20} color="#00D4FF" />
          <Text style={styles.secondaryButtonText}>Recalibrate</Text>
        </TouchableOpacity>

        {calibrationStep < calibrationSteps.length - 1 ? (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleCalibrateStep}
            disabled={isCalibrating}
          >
            <LinearGradient
              colors={isCalibrating ? ['#333', '#333'] : ['#00D4FF', '#0099CC']}
              style={styles.primaryButtonGradient}
            >
              <Camera size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {isCalibrating ? 'Calibrating...' : 'Calibrate'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleStartRecording}
          >
            <LinearGradient
              colors={['#00FF88', '#00CC6A']}
              style={styles.primaryButtonGradient}
            >
              <Play size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Start Recording</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getInstructionText(step: number): string {
  const instructions = [
    'Mount your primary phone on the back wall. Ensure the entire court is visible in the frame.',
    'Mount your secondary phone on the opposite back wall. The cameras should face each other.',
    'Align the court boundaries with the on-screen guides. Tap the corners to set reference points.',
    'Both cameras are now syncing. Keep them steady until synchronization is complete.',
    'Calibration complete! Review the setup and start recording when ready.'
  ];
  return instructions[step];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  previewContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    position: 'relative',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  previewText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  previewSubtext: {
    fontSize: 14,
    color: '#00D4FF',
    textAlign: 'center',
  },
  courtGuides: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
  },
  courtBoundary: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#00D4FF',
    borderRadius: 8,
  },
  netLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00D4FF',
    opacity: 0.8,
  },
  serviceLines: {
    position: 'absolute',
    top: '25%',
    bottom: '25%',
    left: '30%',
    right: '30%',
    borderWidth: 1,
    borderColor: '#00D4FF',
    opacity: 0.6,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressNumber: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsContainer: {
    padding: 20,
  },
  instructionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00D4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});