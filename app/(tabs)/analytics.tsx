import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Clock, Award, Filter, Calendar, Activity, Users, Zap, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentRating] = useState(1547);
  const [ratingHistory] = useState([
    { date: '2024-01-01', rating: 1500 },
    { date: '2024-01-05', rating: 1512 },
    { date: '2024-01-10', rating: 1519 },
    { date: '2024-01-15', rating: 1547 },
  ]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'shots', label: 'Shots' },
    { key: 'movement', label: 'Movement' },
    { key: 'analysis', label: 'Analysis' }
  ];

  // Primary Technical Factors (70% Total Weight)
  const technicalFactors = [
    { 
      title: 'Technical Execution', 
      value: '87%', 
      weight: '24.5%',
      change: '+5%', 
      color: '#00D4FF',
      description: 'Shot quality and form execution'
    },
    { 
      title: 'Court Positioning', 
      value: '82%', 
      weight: '17.5%',
      change: '+8%', 
      color: '#00FF88',
      description: 'Strategic movement and coverage'
    },
    { 
      title: 'Shot Consistency', 
      value: '79%', 
      weight: '17.5%',
      change: '+12%', 
      color: '#FFD700',
      description: 'Rally maintenance and rhythm'
    },
    { 
      title: 'Winners Impact', 
      value: '91%', 
      weight: '10.5%',
      change: '+3%', 
      color: '#FF6B6B',
      description: 'Decisive shot effectiveness'
    },
  ];

  // Competitive Context Factors (30% Total Weight)
  const competitiveFactors = [
    { 
      title: 'Match Outcomes', 
      value: '67%', 
      weight: '19.5%',
      change: '+15%', 
      color: '#9D4EDD',
      description: 'Games and sets performance'
    },
    { 
      title: 'Opponent Differential', 
      value: '+127', 
      weight: '10.5%',
      change: '+23', 
      color: '#FFA500',
      description: 'Performance vs rating difference'
    },
  ];

  // Detailed Performance Metrics
  const performanceMetrics = [
    { metric: 'Technical Score', value: '2.1', target: '2.5', unit: 'pts/shot' },
    { metric: 'Court Coverage', value: '85%', target: '90%', unit: '' },
    { metric: 'Strategic Movement', value: '78%', target: '85%', unit: '' },
    { metric: 'Recovery Efficiency', value: '82%', target: '88%', unit: '' },
    { metric: 'Pressure Performance', value: '74%', target: '80%', unit: '' },
    { metric: 'Unforced Error Rate', value: '12%', target: '8%', unit: '' },
    { metric: 'Rally Maintenance', value: '3.2', target: '4.0', unit: 'avg length' },
    { metric: 'Rhythm Breaking', value: '18', target: '25', unit: 'per match' },
  ];

  const shotBreakdown = [
    { type: 'Perfect Execution', count: 89, percentage: 31, points: '+2.0', color: '#00FF88' },
    { type: 'Good Form', count: 142, percentage: 49, points: '+1.0', color: '#00D4FF' },
    { type: 'Minor Errors', count: 43, percentage: 15, points: '-0.5', color: '#FFD700' },
    { type: 'Major Errors', count: 15, percentage: 5, points: '-1.0', color: '#FF6B6B' },
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return '#00FF88';
    if (rating >= 1600) return '#00D4FF';
    if (rating >= 1400) return '#FFD700';
    return '#FF6B6B';
  };

  const getMetricColor = (current: string, target: string) => {
    const currentVal = parseFloat(current.replace('%', ''));
    const targetVal = parseFloat(target.replace('%', ''));
    
    if (current.includes('%') && currentVal >= targetVal) return '#00FF88';
    if (current.includes('%') && currentVal >= targetVal * 0.8) return '#FFD700';
    return '#FF6B6B';
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <View>
            {/* Current Rating */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingCard}>
                <LinearGradient
                  colors={['#00D4FF', '#0099CC']}
                  style={styles.ratingGradient}
                >
                  <Text style={styles.ratingLabel}>Current Raydel Rating</Text>
                  <Text style={styles.ratingValue}>{currentRating}</Text>
                  <View style={styles.ratingChange}>
                    <TrendingUp size={16} color="#00FF88" />
                    <Text style={styles.ratingChangeText}>+47 this month</Text>
                  </View>
                  <Text style={styles.ratingLevel}>High Intermediate (4.0-4.5)</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Technical Factors Section (70% Weight) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Technical Factors</Text>
                <View style={styles.weightBadge}>
                  <Text style={styles.weightText}>70% Total Weight</Text>
                </View>
              </View>
              
              {technicalFactors.map((factor, index) => (
                <View key={index} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <View style={styles.factorTitleRow}>
                      <Text style={styles.factorTitle}>{factor.title}</Text>
                      <View style={[styles.weightIndicator, { backgroundColor: factor.color }]}>
                        <Text style={styles.weightIndicatorText}>{factor.weight}</Text>
                      </View>
                    </View>
                    <Text style={styles.factorDescription}>{factor.description}</Text>
                  </View>
                  
                  <View style={styles.factorMetrics}>
                    <Text style={[styles.factorValue, { color: factor.color }]}>{factor.value}</Text>
                    <Text style={[styles.factorChange, { color: '#00FF88' }]}>{factor.change}</Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: factor.value,
                          backgroundColor: factor.color
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Competitive Context Factors (30% Weight) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Competitive Context</Text>
                <View style={styles.weightBadge}>
                  <Text style={styles.weightText}>30% Total Weight</Text>
                </View>
              </View>
              
              {competitiveFactors.map((factor, index) => (
                <View key={index} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <View style={styles.factorTitleRow}>
                      <Text style={styles.factorTitle}>{factor.title}</Text>
                      <View style={[styles.weightIndicator, { backgroundColor: factor.color }]}>
                        <Text style={styles.weightIndicatorText}>{factor.weight}</Text>
                      </View>
                    </View>
                    <Text style={styles.factorDescription}>{factor.description}</Text>
                  </View>
                  
                  <View style={styles.factorMetrics}>
                    <Text style={[styles.factorValue, { color: factor.color }]}>{factor.value}</Text>
                    <Text style={[styles.factorChange, { color: '#00FF88' }]}>{factor.change}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'shots':
        return (
          <View>
            {/* Shot Quality Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shot Quality Distribution</Text>
              {shotBreakdown.map((shot, index) => (
                <View key={index} style={styles.shotCard}>
                  <View style={styles.shotHeader}>
                    <Text style={styles.shotType}>{shot.type}</Text>
                    <View style={styles.shotMetrics}>
                      <Text style={styles.shotCount}>{shot.count} shots</Text>
                      <Text style={[styles.shotPoints, { color: shot.color }]}>{shot.points} pts</Text>
                    </View>
                  </View>
                  <View style={styles.shotProgress}>
                    <View style={styles.shotProgressBar}>
                      <View 
                        style={[
                          styles.shotProgressFill,
                          { 
                            width: `${shot.percentage}%`,
                            backgroundColor: shot.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.shotPercentage}>{shot.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Shot Type Analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shot Type Breakdown</Text>
              {[
                { type: 'Forehands', count: 142, winners: 18, errors: 8, accuracy: 94, color: '#00D4FF' },
                { type: 'Backhands', count: 98, winners: 12, errors: 6, accuracy: 92, color: '#00FF88' },
                { type: 'Volleys', count: 23, winners: 3, errors: 2, accuracy: 87, color: '#FFD700' },
                { type: 'Smashes', count: 14, winners: 1, errors: 1, accuracy: 86, color: '#FF6B6B' },
                { type: 'Serves', count: 10, winners: 0, errors: 1, accuracy: 90, color: '#9D4EDD' }
              ].map((shot, index) => (
                <View key={index} style={styles.shotTypeCard}>
                  <View style={styles.shotTypeHeader}>
                    <Text style={styles.shotTypeName}>{shot.type}</Text>
                    <Text style={styles.shotTypeCount}>{shot.count} shots</Text>
                  </View>
                  <View style={styles.shotTypeStats}>
                    <View style={styles.shotTypeStat}>
                      <Text style={styles.shotTypeStatValue}>{shot.winners}</Text>
                      <Text style={styles.shotTypeStatLabel}>Winners</Text>
                    </View>
                    <View style={styles.shotTypeStat}>
                      <Text style={styles.shotTypeStatValue}>{shot.errors}</Text>
                      <Text style={styles.shotTypeStatLabel}>Errors</Text>
                    </View>
                    <View style={styles.shotTypeStat}>
                      <Text style={[styles.shotTypeStatValue, { color: shot.color }]}>
                        {shot.accuracy}%
                      </Text>
                      <Text style={styles.shotTypeStatLabel}>Accuracy</Text>
                    </View>
                  </View>
                  <View style={styles.accuracyBar}>
                    <View 
                      style={[
                        styles.accuracyFill,
                        { 
                          width: `${shot.accuracy}%`,
                          backgroundColor: shot.color
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'movement':
        return (
          <View>
            {/* Court Movement Analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Court Positioning Analysis</Text>
              <View style={styles.heatmapCard}>
                <View style={styles.heatmapContainer}>
                  <Text style={styles.heatmapTitle}>Court Coverage Heatmap</Text>
                  <View style={styles.heatmapPlaceholder}>
                    <Text style={styles.heatmapText}>Movement heatmap visualization</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.movementStats}>
                <View style={styles.movementStat}>
                  <Text style={styles.movementValue}>85%</Text>
                  <Text style={styles.movementLabel}>Court Coverage</Text>
                </View>
                <View style={styles.movementStat}>
                  <Text style={styles.movementValue}>78%</Text>
                  <Text style={styles.movementLabel}>Strategic Movement</Text>
                </View>
                <View style={styles.movementStat}>
                  <Text style={styles.movementValue}>82%</Text>
                  <Text style={styles.movementLabel}>Recovery Efficiency</Text>
                </View>
              </View>
            </View>

            {/* Position Score Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Position Score Components</Text>
              <View style={styles.positionBreakdown}>
                <View style={styles.positionComponent}>
                  <Text style={styles.positionTitle}>Court Coverage</Text>
                  <Text style={styles.positionWeight}>40% of Position Score</Text>
                  <Text style={styles.positionValue}>85%</Text>
                </View>
                <View style={styles.positionComponent}>
                  <Text style={styles.positionTitle}>Strategic Movement</Text>
                  <Text style={styles.positionWeight}>30% of Position Score</Text>
                  <Text style={styles.positionValue}>78%</Text>
                </View>
                <View style={styles.positionComponent}>
                  <Text style={styles.positionTitle}>Recovery Efficiency</Text>
                  <Text style={styles.positionWeight}>30% of Position Score</Text>
                  <Text style={styles.positionValue}>82%</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'analysis':
        return (
          <View>
            {/* AI-Powered Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI-Powered Insights</Text>
              
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Award size={20} color="#00FF88" />
                  <Text style={styles.insightTitle}>Strongest Technical Factor</Text>
                </View>
                <Text style={styles.insightValue}>Winners Impact (91%)</Text>
                <Text style={styles.insightDescription}>
                  Exceptional performance in decisive moments. Your ability to execute winners under pressure is elite-level.
                </Text>
              </View>

              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Target size={20} color="#FFD700" />
                  <Text style={styles.insightTitle}>Primary Improvement Area</Text>
                </View>
                <Text style={styles.insightValue}>Shot Consistency (79%)</Text>
                <Text style={styles.insightDescription}>
                  Focus on reducing unforced errors and maintaining rally length. 13% improvement potential to reach target.
                </Text>
              </View>

              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <TrendingUp size={20} color="#00D4FF" />
                  <Text style={styles.insightTitle}>Rating Projection</Text>
                </View>
                <Text style={styles.insightValue}>1620 by Month End</Text>
                <Text style={styles.insightDescription}>
                  Current trajectory suggests advancement to Advanced level (5.0) within 4-6 weeks with consistent performance.
                </Text>
              </View>

              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Shield size={20} color="#9D4EDD" />
                  <Text style={styles.insightTitle}>Competitive Edge</Text>
                </View>
                <Text style={styles.insightValue}>+127 vs Opponents</Text>
                <Text style={styles.insightDescription}>
                  Strong performance against higher-rated players. Your rating gains are accelerated by quality of opposition.
                </Text>
              </View>
            </View>

            {/* Detailed Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              <View style={styles.metricsGrid}>
                {performanceMetrics.map((metric, index) => (
                  <View key={index} style={styles.metricCard}>
                    <Text style={styles.metricTitle}>{metric.metric}</Text>
                    <View style={styles.metricValues}>
                      <Text style={[styles.metricCurrent, { color: getMetricColor(metric.value, metric.target) }]}>
                        {metric.value}
                      </Text>
                      <Text style={styles.metricUnit}>{metric.unit}</Text>
                    </View>
                    <View style={styles.metricTarget}>
                      <Text style={styles.metricTargetLabel}>Target: {metric.target}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Raydel Analytics</Text>
        <Text style={styles.headerSubtitle}>Comprehensive Performance Evaluation</Text>
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
      <View style={styles.content}>
        {renderTabContent()}
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
  ratingSection: {
    padding: 20,
  },
  ratingCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ratingGradient: {
    padding: 24,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  ratingChangeText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingLevel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  weightBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weightText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  factorCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  factorHeader: {
    marginBottom: 12,
  },
  factorTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  weightIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weightIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  factorDescription: {
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
  },
  factorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  factorChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shotMetrics: {
    alignItems: 'flex-end',
  },
  shotCount: {
    color: '#888',
    fontSize: 12,
  },
  shotPoints: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  shotProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shotProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shotProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  shotPercentage: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    width: (width - 52) / 2,
  },
  metricTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  metricValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  metricCurrent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricUnit: {
    color: '#888',
    fontSize: 10,
    marginLeft: 2,
  },
  metricTarget: {
    marginTop: 4,
  },
  metricTargetLabel: {
    color: '#666',
    fontSize: 10,
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },
  chartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLabel: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  shotTypeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  shotTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shotTypeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shotTypeCount: {
    color: '#888',
    fontSize: 14,
  },
  shotTypeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shotTypeStat: {
    alignItems: 'center',
  },
  shotTypeStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shotTypeStatLabel: {
    color: '#888',
    fontSize: 12,
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
    color: '#fff',
    fontSize: 16,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  movementLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  positionBreakdown: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  positionComponent: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  positionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  positionWeight: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  positionValue: {
    color: '#00D4FF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});