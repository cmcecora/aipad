import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Clock, Award, Filter, Calendar } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [currentRating] = useState(1547);
  const [ratingHistory] = useState([
    { date: '2024-01-01', rating: 1500 },
    { date: '2024-01-05', rating: 1512 },
    { date: '2024-01-10', rating: 1519 },
    { date: '2024-01-15', rating: 1547 },
  ]);

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
  ];

  const stats = [
    { title: 'Matches Played', value: '24', change: '+12%', color: '#00D4FF' },
    { title: 'Win Rate', value: '67%', change: '+8%', color: '#00FF88' },
    { title: 'Avg Match Time', value: '52m', change: '-3m', color: '#FFD700' },
    { title: 'Court Coverage', value: '85%', change: '+5%', color: '#FF6B6B' },
  ];

  const shotStats = [
    { type: 'Forehands', count: 342, accuracy: 78 },
    { type: 'Backhands', count: 298, accuracy: 72 },
    { type: 'Volleys', count: 156, accuracy: 85 },
    { type: 'Smashes', count: 89, accuracy: 91 },
    { type: 'Serves', count: 124, accuracy: 83 },
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return '#00FF88';
    if (rating >= 1600) return '#00D4FF';
    if (rating >= 1400) return '#FFD700';
    return '#FF6B6B';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return '#00FF88';
    if (accuracy >= 75) return '#00D4FF';
    if (accuracy >= 65) return '#FFD700';
    return '#FF6B6B';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Performance Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your padel progress</Text>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
          </LinearGradient>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={[styles.statChange, { color: stat.color }]}>
              {stat.change}
            </Text>
          </View>
        ))}
      </View>

      {/* Rating Chart Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating Evolution</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartLine}>
              {ratingHistory.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.chartPoint,
                    { backgroundColor: getRatingColor(point.rating) }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.chartLabel}>Rating progression over time</Text>
          </View>
        </View>
      </View>

      {/* Shot Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shot Analysis</Text>
        {shotStats.map((shot, index) => (
          <View key={index} style={styles.shotCard}>
            <View style={styles.shotHeader}>
              <Text style={styles.shotType}>{shot.type}</Text>
              <Text style={styles.shotCount}>{shot.count} shots</Text>
            </View>
            <View style={styles.shotAccuracy}>
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
              <Text style={[styles.accuracyText, { color: getAccuracyColor(shot.accuracy) }]}>
                {shot.accuracy}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Performance Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightDescription}>
            • Shot accuracy improving 15% over last month{'\n'}
            • Court coverage increased by 12%{'\n'}
            • Winner-to-error ratio improved to 1.9:1{'\n'}
            • Average rally length increased by 2.3 shots{'\n'}
            • Excellent backhand consistency (92% accuracy){'\n'}
            • Strong net play with 87% volley success{'\n'}
            • Effective court positioning throughout matches
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Award size={20} color="#00FF88" />
            <Text style={styles.insightTitle}>Strongest Area</Text>
          </View>
          <Text style={styles.insightValue}>Volleys at the Net</Text>
          <Text style={styles.insightDescription}>
            91% accuracy on smashes - keep dominating at the net!
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <TrendingUp size={20} color="#FFD700" />
            <Text style={styles.insightTitle}>Improvement Area</Text>
          </View>
          <Text style={styles.insightValue}>Backhand Consistency</Text>
          <Text style={styles.insightDescription}>
            Focus on backhand technique - 6% improvement potential
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Award size={20} color="#00D4FF" />
            <Text style={styles.insightTitle}>Achievement</Text>
          </View>
          <Text style={styles.insightValue}>Rating Milestone</Text>
          <Text style={styles.insightDescription}>
            Reached High Intermediate level - next target: 1600 (Advanced)
          </Text>
        </View>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  periodButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
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
  },
  ratingChangeText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: (width - 52) / 2,
  },
  statTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
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
  shotCount: {
    color: '#888',
    fontSize: 14,
  },
  shotAccuracy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accuracyBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
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
});