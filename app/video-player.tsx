import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Settings,
  Eye,
  EyeOff,
  Target,
  Users,
  Activity
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(3420); // 57 minutes in seconds
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedOverlay, setSelectedOverlay] = useState('all');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const overlayOptions = [
    { key: 'all', label: 'All', icon: Eye },
    { key: 'players', label: 'Players', icon: Users },
    { key: 'ball', label: 'Ball', icon: Target },
    { key: 'shots', label: 'Shots', icon: Activity },
    { key: 'none', label: 'None', icon: EyeOff },
  ];

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (position: number) => {
    setCurrentTime(Math.floor(duration * position));
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
  };

  const handleOverlayToggle = (overlayType: string) => {
    setSelectedOverlay(overlayType);
    if (overlayType === 'none') {
      setShowOverlays(false);
    } else {
      setShowOverlays(true);
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Analysis</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#00D4FF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Video Player Area */}
      <View style={styles.videoContainer}>
        <View style={styles.videoArea}>
          {/* Video Placeholder */}
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>Match Video with AI Overlays</Text>
            
            {/* AI Tracking Overlays */}
            {showOverlays && (selectedOverlay === 'all' || selectedOverlay === 'players') && (
              <View style={styles.playerOverlays}>
                <View style={[styles.playerBox, { top: 120, left: 80 }]}>
                  <Text style={styles.playerLabel}>P1</Text>
                </View>
                <View style={[styles.playerBox, { top: 180, right: 90 }]}>
                  <Text style={styles.playerLabel}>P2</Text>
                </View>
              </View>
            )}

            {/* Ball Tracking */}
            {showOverlays && (selectedOverlay === 'all' || selectedOverlay === 'ball') && (
              <View style={styles.ballOverlay}>
                <View style={styles.ballTracker} />
                <View style={styles.ballTrail} />
              </View>
            )}

            {/* Shot Indicators */}
            {showOverlays && (selectedOverlay === 'all' || selectedOverlay === 'shots') && (
              <View style={styles.shotIndicators}>
                <View style={[styles.shotMarker, { top: 100, left: 120 }]}>
                  <Text style={styles.shotText}>Winner</Text>
                </View>
              </View>
            )}
          </View>

          {/* Play Button Overlay */}
          <TouchableOpacity 
            style={styles.playButtonOverlay}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={48} color="#fff" />
            ) : (
              <Play size={48} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Video Controls */}
        <View style={styles.controlsContainer}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(currentTime / duration) * 100}%` }
                ]}
              />
              <TouchableOpacity 
                style={[
                  styles.progressThumb,
                  { left: `${(currentTime / duration) * 100}%` }
                ]}
                onPressIn={() => {}}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => handleSkip(-10)}
            >
              <SkipBack size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <LinearGradient
                colors={['#00D4FF', '#0099CC']}
                style={styles.playButtonGradient}
              >
                {isPlaying ? (
                  <Pause size={24} color="#fff" />
                ) : (
                  <Play size={24} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => handleSkip(10)}
            >
              <SkipForward size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Volume2 size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Overlay Controls */}
      <View style={styles.overlayControls}>
        <Text style={styles.overlayTitle}>AI Overlays</Text>
        <View style={styles.overlayButtons}>
          {overlayOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.overlayButton,
                selectedOverlay === option.key && styles.overlayButtonActive
              ]}
              onPress={() => setSelectedOverlay(option.key)}
            >
              <option.icon size={16} color={selectedOverlay === option.key ? '#fff' : '#888'} />
              <Text style={[
                styles.overlayButtonText,
                selectedOverlay === option.key && styles.overlayButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Playback Speed */}
      <View style={styles.speedControls}>
        <Text style={styles.speedTitle}>Playback Speed</Text>
        <View style={styles.speedButtons}>
          {speedOptions.map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                playbackSpeed === speed && styles.speedButtonActive
              ]}
              onPress={() => setPlaybackSpeed(speed)}
            >
              <Text style={[
                styles.speedButtonText,
                playbackSpeed === speed && styles.speedButtonTextActive
              ]}>
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Event Timeline */}
      <View style={styles.eventTimeline}>
        <Text style={styles.timelineTitle}>Key Events</Text>
        <View style={styles.timelineEvents}>
          <TouchableOpacity 
            style={styles.eventMarker}
            onPress={() => setCurrentTime(180)}
          >
            <View style={[styles.eventDot, { backgroundColor: '#00FF88' }]} />
            <Text style={styles.eventText}>Winner - 3:00</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.eventMarker}
            onPress={() => setCurrentTime(420)}
          >
            <View style={[styles.eventDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.eventText}>Error - 7:00</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.eventMarker}
            onPress={() => setCurrentTime(720)}
          >
            <View style={[styles.eventDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.eventText}>Great Rally - 12:00</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  videoContainer: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoArea: {
    aspectRatio: 16/9,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  videoText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  playerOverlays: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playerBox: {
    position: 'absolute',
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
  ballOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  ballTracker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  ballTrail: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
    opacity: 0.3,
  },
  shotIndicators: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shotMarker: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 255, 136, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shotText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginHorizontal: 12,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00D4FF',
    marginLeft: -8,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  playButtonGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayControls: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  overlayButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    gap: 4,
  },
  overlayButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  overlayButtonText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
  },
  overlayButtonTextActive: {
    color: '#fff',
  },
  speedControls: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  speedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  speedButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  speedButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  speedButtonTextActive: {
    color: '#fff',
  },
  eventTimeline: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timelineEvents: {
    flexDirection: 'row',
    gap: 16,
  },
  eventMarker: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    gap: 6,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});