import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, TrendingUp, Clock, Award, Plus, Camera } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [currentRating] = useState(1547);
  const [recentMatches] = useState([
    { id: 1, date: '2024-01-15', rating: 1547, opponent: 'Carlos M.', result: 'Win', sets: '6-4, 6-3' },
    { id: 2, date: '2024-01-12', rating: 1532, opponent: 'Ana R.', result: 'Loss', sets: '4-6, 6-3, 4-6' },
    { id: 3, date: '2024-01-10', rating: 1519, opponent: 'Miguel T.', result: 'Win', sets: '6-2, 6-4' },
  ]);

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return '#00FF88';
    if (rating >= 1600) return '#00D4FF';
    if (rating >= 1400) return '#FFD700';
    return '#FF6B6B';
  };

  const getRatingLevel = (rating: number) => {
    if (rating >= 1800) return 'Advanced';
    if (rating >= 1600) return 'High Intermediate';
    if (rating >= 1400) return 'Intermediate';
    return 'Beginner';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.userName}>Ready to dominate the court?</Text>
      </LinearGradient>

      {/* Current Rating Card */}
      <View style={styles.ratingCard}>
        <LinearGradient
          colors={['#00D4FF', '#0099CC']}
          style={styles.ratingGradient}
        >
          <View style={styles.ratingContent}>
            <Text style={styles.ratingLabel}>Current Raydel Rating</Text>
            <Text style={styles.ratingValue}>{currentRating}</Text>
            <Text style={styles.ratingLevel}>{getRatingLevel(currentRating)}</Text>
            <View style={styles.ratingChange}>
              <TrendingUp size={16} color="#00FF88" />
              <Text style={styles.ratingChangeText}>+15 this week</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/record')}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF4757']}
            style={styles.actionGradient}
          >
            <Camera size={24} color="#fff" />
            <Text style={styles.actionText}>Start Recording</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/analytics')}
        >
          <LinearGradient
            colors={['#5F27CD', '#7B68EE']}
            style={styles.actionGradient}
          >
            <TrendingUp size={24} color="#fff" />
            <Text style={styles.actionText}>View Analytics</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Recent Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Matches</Text>
        {recentMatches.map((match) => (
          <TouchableOpacity key={match.id} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchDate}>{match.date}</Text>
              <View style={[styles.resultBadge, { backgroundColor: match.result === 'Win' ? '#00FF88' : '#FF6B6B' }]}>
                <Text style={styles.resultText}>{match.result}</Text>
              </View>
            </View>
            <Text style={styles.matchOpponent}>vs {match.opponent}</Text>
            <View style={styles.matchDetails}>
              <Text style={styles.matchSets}>{match.sets}</Text>
              <Text style={[styles.matchRating, { color: getRatingColor(match.rating) }]}>
                {match.rating} Rating
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/matches')}
        >
          <Text style={styles.viewAllText}>View All Matches</Text>
          <Text style={styles.viewAllArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Performance Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Award size={20} color="#FFD700" />
            <Text style={styles.insightTitle}>Consistency Streak</Text>
          </View>
          <Text style={styles.insightValue}>8 matches</Text>
          <Text style={styles.insightDescription}>
            Your shot consistency has improved 23% over the last month
          </Text>
        </View>
        
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Clock size={20} color="#00D4FF" />
            <Text style={styles.insightTitle}>Court Time</Text>
          </View>
          <Text style={styles.insightValue}>12.5 hours</Text>
          <Text style={styles.insightDescription}>
            Total recorded time this month
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
  welcomeText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  ratingCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ratingGradient: {
    padding: 24,
  },
  ratingContent: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingLevel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  ratingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  ratingChangeText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
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
  matchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    color: '#888',
    fontSize: 14,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  matchOpponent: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchSets: {
    color: '#888',
    fontSize: 14,
  },
  matchRating: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  viewAllButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#00D4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  viewAllArrow: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});