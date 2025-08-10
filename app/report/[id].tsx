import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  TrendingUp, 
  Target, 
  Activity, 
  Clock,
  Award,
  Users,
  Play
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ReportScreen() {
  const { id } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'shots', label: 'Shots' },
    { key: 'movement', label: 'Movement' },
    { key: 'analysis', label: 'Analysis' }
  ];

  const matchData = {
    id: id,
    date: '2024-01-15',
    duration: '52 minutes',
    sets: [
      { set: 1, score: '6-4', won: true },
      { set: 2, score: '6-3', won: true }
    ],
    finalScore: '6-4, 6-3',
    result: 'Win',
    opponent: 'Carlos Martinez',
    ratingChange: +15,
    newRating: 1547,
    previousRating: 1532,
    ratingBreakdown: {
      technicalExecution: +8.2,
      courtPositioning: +3.1,
      shotConsistency: +2.8,
      winnersImpact: +4.5,
      matchOutcome: +2.1,
      opponentDifferential: +1.3
    }
  };

  const overviewStats = [
    { title: 'Total Shots', value: '287', icon: Target, color: '#00D4FF' },
    { title: 'Winners', value: '34', icon: Award, color: '#00FF88' },
    { title: 'Unforced Errors', value: '18', icon: Activity, color: '#FF6B6B' },
    { title: 'Rallies Won', value: '67%', icon: Users, color: '#FFD700' }
  ];

  const shotBreakdown = [
    { type: 'Forehands', count: 142, winners: 18, errors: 8, accuracy: 94 },
    { type: 'Backhands', count: 98, winners: 12, errors: 6, accuracy: 92 },
    { type: 'Volleys', count: 23, winners: 3, errors: 2, accuracy: 87 },
    { type: 'Smashes', count: 14, winners: 1, errors: 1, accuracy: 86 },
    { type: 'Serves', count: 10, winners: 0, errors: 1, accuracy: 90 }
  ];

  const keyMoments = [
    { time: '08:23', type: 'Winner', description: 'Backhand winner down the line' },
    { time: '15:47', type: 'Error', description: 'Forehand into net under pressure' },
    { time: '23:12', type: 'Winner', description: 'Smash winner at the net' },
    { time: '31:55', type: 'Winner', description: 'Serve winner wide' }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return '#00FF88';
    if (rating >= 1600) return '#00D4FF';
    if (rating >= 1400) return '#FFD700';
    return '#FF6B6B';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#00FF88';
    if (accuracy >= 80) return '#00D4FF';
    if (accuracy >= 70) return '#FFD700';
    return '#FF6B6B';
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <View>
            {/* Match Result */}
            <View style={styles.resultCard}>
              <LinearGradient
                colors={matchData.result === 'Win' ? ['#00FF88', '#00CC6A'] : ['#FF6B6B', '#FF4757']}
                style={styles.resultGradient}
              >
                <Text style={styles.resultText}>{matchData.result}</Text>
                <Text style={styles.resultScore}>{matchData.finalScore}</Text>
                <Text style={styles.resultOpponent}>vs {matchData.opponent}</Text>
              </LinearGradient>
            </View>

            {/* Rating Change */}
            <View style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <Text style={styles.ratingTitle}>Raydel Rating</Text>
                <View style={styles.ratingChange}>
                  <TrendingUp size={16} color="#00FF88" />
                  <Text style={styles.ratingChangeText}>+{matchData.ratingChange}</Text>
                </View>
              </View>
              <View style={styles.ratingContent}>
                <Text style={styles.ratingPrevious}>{matchData.previousRating}</Text>
                <Text style={styles.ratingArrow}>→</Text>
                <Text style={[styles.ratingNew, { color: getRatingColor(matchData.newRating) }]}>
                  {matchData.newRating}
                </Text>
              </View>
            </View>

            {/* Rating Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating Factor Breakdown</Text>
              
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownHeader}>Technical Factors (70%)</Text>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownTitle}>Technical Execution</Text>
                    <Text style={styles.breakdownWeight}>24.5%</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#00D4FF' }]}>
                    +{matchData.ratingBreakdown.technicalExecution.toFixed(1)}
                  </Text>
                </View>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownTitle}>Court Positioning</Text>
                    <Text style={styles.breakdownWeight}>17.5%</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#00FF88' }]}>
                    +{matchData.ratingBreakdown.courtPositioning.toFixed(1)}
                  </Text>
                </View>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownTitle}>Shot Consistency</Text>
                    <Text style={styles.breakdownWeight}>17.5%</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#FFD700' }]}>
                    +{matchData.ratingBreakdown.shotConsistency.toFixed(1)}
                  </Text>
                </View>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownTitle}>Winners Impact</Text>
                    <Text style={styles.breakdownWeight}>10.5%</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#FF6B6B' }]}>
                    +{matchData.ratingBreakdown.winnersImpact.toFixed(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownHeader}>Competitive Context (30%)</Text>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownTitle}>Match Outcome</Text>
                    <Text style={styles.breakdownWeight}>19.5%</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#9D4EDD' }]}>
                    +{matchData.ratingBreakdown.matchOutcome.toFixed(1)}
                  </Text>
                </View>
                
                <View style={styles.breakdownItem}>
                  <View style={styles.breakdownLabel}>
                    <Text style={styles.breakdownTitle}>Opponent Differential</Text>
                    <Text style={styles.breakdownWeight}>10.5%</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: '#FFA500' }]}>
                    +{matchData.ratingBreakdown.opponentDifferential.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
            {/* Overview Stats */}
            <View style={styles.statsGrid}>
              {overviewStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <stat.icon size={24} color={stat.color} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              ))}
            </View>

            {/* Key Moments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Moments</Text>
              {keyMoments.map((moment, index) => (
                <View key={index} style={styles.momentCard}>
                  <View style={styles.momentHeader}>
                    <Text style={styles.momentTime}>{moment.time}</Text>
                    <View style={[
                      styles.momentType,
                      { backgroundColor: moment.type === 'Winner' ? '#00FF88' : '#FF6B6B' }
                    ]}>
                      <Text style={styles.momentTypeText}>{moment.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.momentDescription}>{moment.description}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'shots':
        return (
          <View>
            <Text style={styles.sectionTitle}>Shot Breakdown</Text>
            {shotBreakdown.map((shot, index) => (
              <View key={index} style={styles.shotCard}>
                <View style={styles.shotHeader}>
                  <Text style={styles.shotType}>{shot.type}</Text>
                  <Text style={styles.shotCount}>{shot.count} shots</Text>
                </View>
                <View style={styles.shotStats}>
                  <View style={styles.shotStat}>
                    <Text style={styles.shotStatValue}>{shot.winners}</Text>
                    <Text style={styles.shotStatLabel}>Winners</Text>
                  </View>
                  <View style={styles.shotStat}>
                    <Text style={styles.shotStatValue}>{shot.errors}</Text>
                    <Text style={styles.shotStatLabel}>Errors</Text>
                  </View>
                  <View style={styles.shotStat}>
                    <Text style={[styles.shotStatValue, { color: getAccuracyColor(shot.accuracy) }]}>
                      {shot.accuracy}%
                    </Text>
                    <Text style={styles.shotStatLabel}>Accuracy</Text>
                  </View>
                </View>
                <View style={styles.accuracyBar}>
                  <View 
                    style={[
                      styles.accuracyFill,
                      { 
                        width: `${shot.accuracy}%`,
                        backgroundColor: getAccuracyColor(shot.accuracy)
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        );

      case 'movement':
        return (
          <View>
            <Text style={styles.sectionTitle}>Court Movement</Text>
            <View style={styles.heatmapCard}>
              <View style={styles.heatmapContainer}>
                <Text style={styles.heatmapTitle}>Court Heatmap</Text>
                <View style={styles.heatmapPlaceholder}>
                  <Text style={styles.heatmapText}>Movement heatmap visualization</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.movementStats}>
              <View style={styles.movementStat}>
                <Text style={styles.movementValue}>2.1 km</Text>
                <Text style={styles.movementLabel}>Distance Covered</Text>
              </View>
              <View style={styles.movementStat}>
                <Text style={styles.movementValue}>89%</Text>
                <Text style={styles.movementLabel}>Court Coverage</Text>
              </View>
              <View style={styles.movementStat}>
                <Text style={styles.movementValue}>4.2 m/s</Text>
                <Text style={styles.movementLabel}>Peak Speed</Text>
              </View>
            </View>
          </View>
        );

      case 'analysis':
        return (
          <View>
            <Text style={styles.sectionTitle}>AI Analysis</Text>
            
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Award size={20} color="#00FF88" />
                <Text style={styles.analysisTitle}>Strengths</Text>
              </View>
              <Text style={styles.analysisText}>
                • Excellent backhand consistency (94% accuracy)
                • Strong net play with 87% volley success
                • Effective court positioning throughout the match
              </Text>
            </View>

            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Target size={20} color="#FFD700" />
                <Text style={styles.analysisTitle}>Areas for Improvement</Text>
              </View>
              <Text style={styles.analysisText}>
                • Reduce unforced errors on routine shots
                • Improve serve placement variety
                • Work on defensive positioning under pressure
              </Text>
            </View>

            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <TrendingUp size={20} color="#00D4FF" />
                <Text style={styles.analysisTitle}>Rating Factors</Text>
              </View>
              <Text style={styles.analysisText}>
                • Technical execution: +8 points
                • Court positioning: +4 points
                • Consistency bonus: +2 points
                • Match outcome: +1 point
              </Text>
            </View>
          </View>
        );

      default:
        return null;
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
          <Text style={styles.headerTitle}>Match Report</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction}>
              <Share2 size={20} color="#00D4FF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => router.push('/video-player')}
            >
              <Play size={20} color="#00D4FF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction}>
              <Download size={20} color="#00D4FF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.matchInfo}>
          <Text style={styles.matchDate}>{matchData.date}</Text>
          <View style={styles.matchDetails}>
            <Clock size={14} color="#888" />
            <Text style={styles.matchDuration}>{matchData.duration}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.tabActive
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderTabContent()}
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
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 8,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchDate: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchDuration: {
    fontSize: 14,
    color: '#888',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00D4FF',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#00D4FF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  resultGradient: {
    padding: 24,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultOpponent: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  ratingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  ratingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingChangeText: {
    fontSize: 14,
    color: '#00FF88',
    fontWeight: '600',
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ratingPrevious: {
    fontSize: 24,
    color: '#888',
    fontWeight: 'bold',
  },
  ratingArrow: {
    fontSize: 24,
    color: '#00D4FF',
    fontWeight: 'bold',
  },
  ratingNew: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: (width - 52) / 2,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  momentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  momentTime: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: '600',
  },
  momentType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  momentTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  momentDescription: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  shotCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  shotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shotType: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  shotCount: {
    fontSize: 14,
    color: '#888',
  },
  shotStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shotStat: {
    alignItems: 'center',
  },
  shotStatValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  shotStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  accuracyBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  heatmapCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  heatmapContainer: {
    alignItems: 'center',
  },
  heatmapTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 16,
  },
  heatmapPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapText: {
    color: '#888',
    fontSize: 14,
  },
  movementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  movementStat: {
    alignItems: 'center',
  },
  movementValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  movementLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  analysisCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  videoThumbnailCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  videoThumbnail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoPreview: {
    width: 80,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 14,
    color: '#00D4FF',
    marginBottom: 2,
  },
  videoSize: {
    fontSize: 12,
    color: '#888',
  },
  breakdownCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  breakdownHeader: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    flex: 1,
  },
  breakdownTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownWeight: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});