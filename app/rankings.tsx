import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

export default function RankingsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('global');
  const [userRank] = useState(1247);
  const [userRating] = useState(1547);

  const categories = [
    { key: 'global', label: 'Global' },
    { key: 'local', label: 'Local' },
    { key: 'friends', label: 'Friends' },
  ];

  const rankings = [
    { rank: 1, name: 'Carlos Rodriguez', rating: 2156, change: 'up', avatar: '👑' },
    { rank: 2, name: 'Maria Santos', rating: 2089, change: 'up', avatar: '🏆' },
    { rank: 3, name: 'Juan Martinez', rating: 2034, change: 'down', avatar: '🥉' },
    { rank: 4, name: 'Ana Gonzalez', rating: 1978, change: 'up', avatar: '🎾' },
    { rank: 5, name: 'Pedro Silva', rating: 1923, change: 'same', avatar: '⚡' },
    { rank: 6, name: 'Sofia Lopez', rating: 1887, change: 'up', avatar: '🔥' },
    { rank: 7, name: 'Miguel Torres', rating: 1845, change: 'down', avatar: '⭐' },
    { rank: 8, name: 'Laura Diaz', rating: 1789, change: 'up', avatar: '💪' },
    { rank: 9, name: 'Roberto Cruz', rating: 1734, change: 'same', avatar: '🎯' },
    { rank: 10, name: 'Carmen Ruiz', rating: 1698, change: 'up', avatar: '🚀' },
  ];

  const getRankingColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#00D4FF';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return '#00FF88';
    if (rating >= 1800) return '#00D4FF';
    if (rating >= 1600) return '#FFD700';
    return '#FF6B6B';
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up': return <TrendingUp size={16} color="#00FF88" />;
      case 'down': return <TrendingDown size={16} color="#FF6B6B" />;
      default: return <Minus size={16} color="#888" />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Global Rankings</Text>
        <Text style={styles.headerSubtitle}>See where you stand</Text>
      </LinearGradient>

      {/* User Position Card */}
      <View style={styles.userPositionCard}>
        <LinearGradient
          colors={['#00D4FF', '#0099CC']}
          style={styles.userPositionGradient}
        >
          <View style={styles.userPositionHeader}>
            <Text style={styles.userPositionLabel}>Your Position</Text>
            <Trophy size={20} color="#fff" />
          </View>
          <View style={styles.userPositionContent}>
            <Text style={styles.userRank}>#{userRank}</Text>
            <Text style={styles.userRating}>{userRating} Rating</Text>
          </View>
          <Text style={styles.userPositionText}>
            You're in the top 15% of players worldwide!
          </Text>
        </LinearGradient>
      </View>

      {/* Category Selector */}
      <View style={styles.categorySelector}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.key && styles.categoryButtonTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 3 Podium */}
      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
        <View style={styles.podium}>
          {/* 2nd Place */}
          <View style={styles.podiumPosition}>
            <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
            <Text style={styles.podiumName}>{rankings[1].name}</Text>
            <Text style={styles.podiumRating}>{rankings[1].rating}</Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumPosition, styles.podiumWinner]}>
            <View style={[styles.podiumRank, { backgroundColor: '#FFD700' }]}>
              <Crown size={20} color="#000" />
            </View>
            <Text style={styles.podiumName}>{rankings[0].name}</Text>
            <Text style={styles.podiumRating}>{rankings[0].rating}</Text>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumPosition}>
            <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
              <Text style={styles.podiumRankText}>3</Text>
            </View>
            <Text style={styles.podiumName}>{rankings[2].name}</Text>
            <Text style={styles.podiumRating}>{rankings[2].rating}</Text>
          </View>
        </View>
      </View>

      {/* Rankings List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {rankings.map((player, index) => (
          <View key={index} style={styles.playerCard}>
            <View style={styles.playerRank}>
              <View style={[styles.rankCircle, { backgroundColor: getRankingColor(player.rank) }]}>
                <Text style={styles.rankText}>{player.rank}</Text>
              </View>
            </View>
            
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarEmoji}>{player.avatar}</Text>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={[styles.playerRating, { color: getRatingColor(player.rating) }]}>
                {player.rating} Rating
              </Text>
            </View>
            
            <View style={styles.playerChange}>
              {getChangeIcon(player.change)}
            </View>
          </View>
        ))}
      </View>

      {/* Achievement Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        
        <View style={styles.achievementCard}>
          <View style={styles.achievementIcon}>
            <Medal size={24} color="#FFD700" />
          </View>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>Rating Milestone</Text>
            <Text style={styles.achievementDescription}>
              Reached High Intermediate level (1500+ rating)
            </Text>
          </View>
        </View>

        <View style={styles.achievementCard}>
          <View style={styles.achievementIcon}>
            <TrendingUp size={24} color="#00FF88" />
          </View>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>Consistency Streak</Text>
            <Text style={styles.achievementDescription}>
              8 consecutive matches with improving performance
            </Text>
          </View>
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
  userPositionCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  userPositionGradient: {
    padding: 24,
  },
  userPositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userPositionLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  userPositionContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  userRank: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  userRating: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  userPositionText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  categorySelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  categoryButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  podiumSection: {
    padding: 20,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  podiumPosition: {
    alignItems: 'center',
    flex: 1,
  },
  podiumWinner: {
    transform: [{ scale: 1.1 }],
  },
  podiumRank: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  podiumName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumRating: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: 'bold',
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
  playerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerRank: {
    marginRight: 12,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  playerRating: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerChange: {
    marginLeft: 8,
  },
  achievementCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});