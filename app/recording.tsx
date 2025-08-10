import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Play, 
  Pause, 
  Square, 
  Camera, 
  Wifi, 
  WifiOff,
  Clock,
  Users,
  Target,
  Activity
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function RecordingScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [currentSet, setCurrentSet] = useState(1);
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [liveStats, setLiveStats] = useState({
    totalShots: 0,
    winners: 0,
    errors: 0,
    rallies: 0
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    // Simulate live stats updates
    const statsInterval = setInterval(() => {
      setLiveStats(prev => ({
        totalShots: prev.totalShots + Math.floor(Math.random() * 3),
        winners: prev.winners + (Math.random() > 0.8 ? 1 : 0),
        errors: prev.errors + (Math.random() > 0.7 ? 1 : 0),
        rallies: prev.rallies + (Math.random() > 0.9 ? 1 : 0)
      }));
    }, 2000);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    Alert.alert(
      'Stop Recording',
      'Are you sure you want to stop recording? This will end the current match.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive', 
          onPress: () => {
            setIsRecording(false);
            setIsPaused(false);
            router.push('/report/1');
          }
        }
      ]
    );
  };

  const handleScoreUpdate = (team: 'team1' | 'team2', increment: number) => {
    setScore(prev => ({
      ...prev,
      [team]: Math.max(0, prev[team] + increment)
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Live Recording</Text>
          <View style={styles.connectionStatus}>
            {isConnected ? (
              <Wifi size={16} color="#00FF88" />
            ) : (
              <WifiOff size={16} color="#FF6B6B" />
            )}
            <Text style={[styles.connectionText, { color: isConnected ? '#00FF88' : '#FF6B6B' }]}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Live Video Feed */}
      <View style={styles.videoContainer}>
        <View style={styles.videoArea}>
          <View style={styles.videoOverlay}>
            <View style={styles.recordingIndicator}>
              <View style={[styles.recordingDot, { backgroundColor: isRecording ? '#FF6B6B' : '#666' }]} />
              <Text style={styles.recordingText}>
                {isRecording ? (isPaused ? 'PAUSED' : 'RECORDING') : 'STOPPED'}
              </Text>
            </View>
            
            <View style={styles.timerContainer}>
              <Clock size={16} color="#fff" />
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            </View>
          </View>
          
          {/* AI Analysis Overlay */}
          <View style={styles.aiOverlay}>
            <View style={styles.playerTracker}>
              <View style={styles.playerBox}>
                <Text style={styles.playerLabel}>P1</Text>
              </View>
              <View style={styles.playerBox}>
                <Text style={styles.playerLabel}>P2</Text>
              </View>
            </View>
            
            <View style={styles.ballTracker}>
              <View style={styles.ballDot} />
            </View>
          </View>
        </View>
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Team 1</Text>
          <View style={styles.scoreControls}>
            <TouchableOpacity 
              style={styles.scoreButton}
              onPress={() => handleScoreUpdate('team1', -1)}
            >
              <Text style={styles.scoreButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.scoreValue}>{score.team1}</Text>
            <TouchableOpacity 
              style={styles.scoreButton}
              onPress={() => handleScoreUpdate('team1', 1)}
            >
              <Text style={styles.scoreButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.setInfo}>
          <Text style={styles.setLabel}>Set {currentSet}</Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Team 2</Text>
          <View style={styles.scoreControls}>
            <TouchableOpacity 
              style={styles.scoreButton}
              onPress={() => handleScoreUpdate('team2', -1)}
            >
              <Text style={styles.scoreButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.scoreValue}>{score.team2}</Text>
            <TouchableOpacity 
              style={styles.scoreButton}
              onPress={() => handleScoreUpdate('team2', 1)}
            >
              <Text style={styles.scoreButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Live Stats */}
      <View style={styles.liveStats}>
        <View style={styles.statItem}>
          <Target size={16} color="#00D4FF" />
          <Text style={styles.statValue}>{liveStats.totalShots}</Text>
          <Text style={styles.statLabel}>Shots</Text>
        </View>

        <View style={styles.statItem}>
          <Activity size={16} color="#00FF88" />
          <Text style={styles.statValue}>{liveStats.winners}</Text>
          <Text style={styles.statLabel}>Winners</Text>
        </View>

        <View style={styles.statItem}>
          <Users size={16} color="#FFD700" />
          <Text style={styles.statValue}>{liveStats.rallies}</Text>
          <Text style={styles.statLabel}>Rallies</Text>
        </View>

        <View style={styles.statItem}>
          <Target size={16} color="#FF6B6B" />
          <Text style={styles.statValue}>{liveStats.errors}</Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        {!isRecording ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartRecording}
          >
            <LinearGradient
              colors={['#00FF88', '#00CC6A']}
              style={styles.startButtonGradient}
            >
              <Play size={24} color="#fff" />
              <Text style={styles.startButtonText}>Start Recording</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.recordingControls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handlePauseRecording}
            >
              <LinearGradient
                colors={isPaused ? ['#00D4FF', '#0099CC'] : ['#FFD700', '#FFA500']}
                style={styles.controlButtonGradient}
              >
                {isPaused ? <Play size={20} color="#fff" /> : <Pause size={20} color="#fff" />}
                <Text style={styles.controlButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handleStopRecording}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF4757']}
                style={styles.controlButtonGradient}
              >
                <Square size={20} color="#fff" />
                <Text style={styles.controlButtonText}>Stop</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playerTracker: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerBox: {
    width: 60,
    height: 80,
    borderWidth: 2,
    borderColor: '#00D4FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  playerLabel: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ballTracker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  ballDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scoreBoard: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  setInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  setLabel: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  liveStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  controlButtons: {
    padding: 20,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});