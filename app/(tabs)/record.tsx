import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Smartphone, Wifi, Settings, Play, Users, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';

export default function RecordScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [cameraStatus, setCameraStatus] = useState({
    primary: 'disconnected',
    secondary: 'disconnected'
  });

  const handleStartRecording = () => {
    if (!isConnected) {
      Alert.alert('Setup Required', 'Please connect and calibrate both cameras before recording.');
      return;
    }
    router.push('/calibration');
  };

  const handleCameraSetup = () => {
    router.push('/calibration');
  };

  const getCameraStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#00FF88';
      case 'connecting': return '#FFD700';
      default: return '#FF6B6B';
    }
  };

  const getCameraStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      default: return 'Disconnected';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Record Match</Text>
        <Text style={styles.headerSubtitle}>Set up dual cameras for AI analysis</Text>
      </LinearGradient>

      {/* Camera Status Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Camera Setup</Text>
        
        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <Smartphone size={24} color="#00D4FF" />
            <Text style={styles.cameraTitle}>Primary Camera</Text>
            <View style={[styles.statusDot, { backgroundColor: getCameraStatusColor(cameraStatus.primary) }]} />
          </View>
          <Text style={styles.cameraDescription}>Mount on back wall (Player 1 side)</Text>
          <Text style={[styles.cameraStatus, { color: getCameraStatusColor(cameraStatus.primary) }]}>
            {getCameraStatusText(cameraStatus.primary)}
          </Text>
        </View>

        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <Smartphone size={24} color="#00D4FF" />
            <Text style={styles.cameraTitle}>Secondary Camera</Text>
            <View style={[styles.statusDot, { backgroundColor: getCameraStatusColor(cameraStatus.secondary) }]} />
          </View>
          <Text style={styles.cameraDescription}>Mount on opposite back wall (Player 2 side)</Text>
          <Text style={[styles.cameraStatus, { color: getCameraStatusColor(cameraStatus.secondary) }]}>
            {getCameraStatusText(cameraStatus.secondary)}
          </Text>
        </View>
      </View>

      {/* Setup Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup Instructions</Text>
        
        <View style={styles.instructionCard}>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Position Cameras</Text>
              <Text style={styles.stepDescription}>
                Mount both phones on opposite back walls at shoulder height, 
                ensuring clear view of the entire court
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect Devices</Text>
              <Text style={styles.stepDescription}>
                Both phones must be connected to the same Wi-Fi network 
                for real-time synchronization
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Calibrate Cameras</Text>
              <Text style={styles.stepDescription}>
                Use the calibration tool to align both cameras and 
                create a unified court map
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Match Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Settings</Text>
        
        <TouchableOpacity style={styles.settingCard}>
          <Users size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Players</Text>
            <Text style={styles.settingValue}>2 Players</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <MapPin size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Court Type</Text>
            <Text style={styles.settingValue}>Standard Padel Court</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <Settings size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Analysis Level</Text>
            <Text style={styles.settingValue}>Professional</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleCameraSetup}
        >
          <Camera size={20} color="#00D4FF" />
          <Text style={styles.secondaryButtonText}>Setup Cameras</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.primaryButton, !isConnected && styles.disabledButton]}
          onPress={handleStartRecording}
          disabled={!isConnected}
        >
          <LinearGradient
            colors={isConnected ? ['#00FF88', '#00CC6A'] : ['#333', '#333']}
            style={styles.primaryButtonGradient}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Recording</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cameraCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cameraDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  cameraStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  settingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingValue: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  secondaryButton: {
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
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