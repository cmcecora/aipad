import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Upload, Video, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Play, FileVideo, Clock, Users, Target } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadScreen() {
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  const handleFileUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/mov', 'video/avi'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Validate file size (2GB max)
        if (file.size && file.size > 2 * 1024 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a video file smaller than 2GB.');
          return;
        }

        setUploadedFile(file);
        simulateUpload();
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to select video file. Please try again.');
    }
  }, []);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          startProcessing();
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const startProcessing = () => {
    setIsProcessing(true);
    const stages = [
      'Analyzing video quality...',
      'Detecting players and court boundaries...',
      'Tracking ball movement...',
      'Identifying shot types and outcomes...',
      'Calculating Raydel Rating factors...',
      'Generating performance report...'
    ];

    let currentStage = 0;
    const stageInterval = setInterval(() => {
      if (currentStage < stages.length) {
        setProcessingStage(stages[currentStage]);
        currentStage++;
      } else {
        clearInterval(stageInterval);
        setIsProcessing(false);
        router.push('/report/uploaded-match');
      }
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <Text style={styles.headerTitle}>Upload Match Video</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          Analyze your padel match with AI-powered insights
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Upload Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Requirements</Text>
          <View style={styles.requirementCard}>
            <View style={styles.requirementItem}>
              <FileVideo size={16} color="#00D4FF" />
              <Text style={styles.requirementText}>Formats: MP4, MOV, AVI</Text>
            </View>
            <View style={styles.requirementItem}>
              <Target size={16} color="#00D4FF" />
              <Text style={styles.requirementText}>Resolution: 720p minimum</Text>
            </View>
            <View style={styles.requirementItem}>
              <Clock size={16} color="#00D4FF" />
              <Text style={styles.requirementText}>Duration: 10 minutes - 2 hours</Text>
            </View>
            <View style={styles.requirementItem}>
              <Upload size={16} color="#00D4FF" />
              <Text style={styles.requirementText}>Size: Maximum 2GB</Text>
            </View>
          </View>
        </View>

        {/* Upload Area */}
        {!uploadedFile ? (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.uploadArea}
              onPress={handleFileUpload}
            >
              <LinearGradient
                colors={['#00D4FF20', '#00D4FF10']}
                style={styles.uploadGradient}
              >
                <Upload size={48} color="#00D4FF" />
                <Text style={styles.uploadTitle}>Select Video File</Text>
                <Text style={styles.uploadSubtitle}>
                  Tap to browse or drag and drop your match video
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.fileCard}>
              <View style={styles.fileHeader}>
                <Video size={24} color="#00FF88" />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{uploadedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {uploadedFile.size ? formatFileSize(uploadedFile.size) : 'Unknown size'}
                  </Text>
                </View>
                <CheckCircle size={20} color="#00FF88" />
              </View>

              {/* Upload Progress */}
              {isUploading && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>Uploading...</Text>
                    <Text style={styles.progressPercent}>{Math.round(uploadProgress)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${uploadProgress}%` }
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <View style={styles.processingSection}>
                  <View style={styles.processingHeader}>
                    <Target size={20} color="#FFD700" />
                    <Text style={styles.processingTitle}>AI Analysis in Progress</Text>
                  </View>
                  <Text style={styles.processingStage}>{processingStage}</Text>
                  <View style={styles.processingIndicator}>
                    <View style={styles.processingDot} />
                    <View style={styles.processingDot} />
                    <View style={styles.processingDot} />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Processing Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Analysis Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Users size={20} color="#00D4FF" />
              <Text style={styles.featureTitle}>Player Tracking</Text>
              <Text style={styles.featureDescription}>
                Automatic detection and movement analysis
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Target size={20} color="#00FF88" />
              <Text style={styles.featureTitle}>Shot Analysis</Text>
              <Text style={styles.featureDescription}>
                Classification and accuracy metrics
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Play size={20} color="#FFD700" />
              <Text style={styles.featureTitle}>Ball Tracking</Text>
              <Text style={styles.featureDescription}>
                Trajectory and speed analysis
              </Text>
            </View>

            <View style={styles.featureCard}>
              <TrendingUp size={20} color="#FF6B6B" />
              <Text style={styles.featureTitle}>Raydel Rating</Text>
              <Text style={styles.featureDescription}>
                Performance-based rating calculation
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <AlertCircle size={16} color="#FFD700" />
              <Text style={styles.tipText}>
                Ensure good lighting and stable camera position
              </Text>
            </View>
            <View style={styles.tipItem}>
              <AlertCircle size={16} color="#FFD700" />
              <Text style={styles.tipText}>
                Keep the entire court visible in the frame
              </Text>
            </View>
            <View style={styles.tipItem}>
              <AlertCircle size={16} color="#FFD700" />
              <Text style={styles.tipText}>
                Record from an elevated position when possible
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  requirementCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  uploadArea: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00D4FF',
    borderStyle: 'dashed',
  },
  uploadGradient: {
    padding: 40,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  fileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileSize: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 3,
  },
  processingSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  processingTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingStage: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  processingIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: '48%',
    alignItems: 'center',
  },
  featureTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  tipsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});