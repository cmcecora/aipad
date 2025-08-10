import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Filter, 
  Search, 
  Calendar,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus
} from 'lucide-react-native';

export default function MatchesScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'wins', label: 'Wins' },
    { key: 'losses', label: 'Losses' },
    { key: 'recent', label: 'Recent' },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date' },
    { key: 'rating', label: 'Rating' },
    { key: 'duration', label: 'Duration' },
  ];

  const allMatches = [
    { 
      id: 1, 
      date: '2024-01-15', 
      time: '14:30',
      duration: '52 min',
      rating: 1547, 
      ratingChange: +15,
      opponent: 'Carlos Martinez', 
      result: 'Win', 
      sets: '6-4, 6-3',
      location: 'Club Padel Barcelona',
      shots: 287,
      winners: 34,
      errors: 18,
      accuracy: 89
    },
    { 
      id: 2, 
      date: '2024-01-12', 
      time: '18:45',
      duration: '68 min',
      rating: 1532, 
      ratingChange: -8,
      opponent: 'Ana Rodriguez', 
      result: 'Loss', 
      sets: '4-6, 6-3, 4-6',
      location: 'Padel Center Madrid',
      shots: 342,
      winners: 28,
      errors: 31,
      accuracy: 82
    },
    { 
      id: 3, 
      date: '2024-01-10', 
      time: '16:15',
      duration: '45 min',
      rating: 1519, 
      ratingChange: +12,
      opponent: 'Miguel Torres', 
      result: 'Win', 
      sets: '6-2, 6-4',
      location: 'Elite Padel Club',
      shots: 234,
      winners: 29,
      errors: 15,
      accuracy: 91
    },
    { 
      id: 4, 
      date: '2024-01-08', 
      time: '19:30',
      duration: '61 min',
      rating: 1507, 
      ratingChange: +7,
      opponent: 'Sofia Lopez', 
      result: 'Win', 
      sets: '6-4, 4-6, 6-3',
      location: 'Padel Pro Valencia',
      shots: 298,
      winners: 25,
      errors: 22,
      accuracy: 85
    },
    { 
      id: 5, 
      date: '2024-01-05', 
      time: '15:00',
      duration: '39 min',
      rating: 1500, 
      ratingChange: -5,
      opponent: 'Roberto Cruz', 
      result: 'Loss', 
      sets: '3-6, 4-6',
      location: 'Club Deportivo Sevilla',
      shots: 198,
      winners: 18,
      errors: 28,
      accuracy: 78
    },
    { 
      id: 6, 
      date: '2024-01-03', 
      time: '17:20',
      duration: '55 min',
      rating: 1505, 
      ratingChange: +10,
      opponent: 'Laura Diaz', 
      result: 'Win', 
      sets: '6-3, 6-4',
      location: 'Padel Academy Bilbao',
      shots: 267,
      winners: 31,
      errors: 19,
      accuracy: 88
    },
    { 
      id: 7, 
      date: '2023-12-30', 
      time: '11:45',
      duration: '72 min',
      rating: 1495, 
      ratingChange: -12,
      opponent: 'Pedro Silva', 
      result: 'Loss', 
      sets: '6-4, 3-6, 4-6',
      location: 'Metropolitan Padel',
      shots: 356,
      winners: 22,
      errors: 35,
      accuracy: 79
    },
    { 
      id: 8, 
      date: '2023-12-28', 
      time: '20:15',
      duration: '48 min',
      rating: 1507, 
      ratingChange: +8,
      opponent: 'Carmen Ruiz', 
      result: 'Win', 
      sets: '6-2, 6-3',
      location: 'Padel Center Granada',
      shots: 221,
      winners: 27,
      errors: 16,
      accuracy: 90
    },
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return '#00FF88';
    if (rating >= 1600) return '#00D4FF';
    if (rating >= 1400) return '#FFD700';
    return '#FF6B6B';
  };

  const getRatingChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={14} color="#00FF88" />;
    if (change < 0) return <TrendingDown size={14} color="#FF6B6B" />;
    return <Minus size={14} color="#888" />;
  };

  const getRatingChangeColor = (change: number) => {
    if (change > 0) return '#00FF88';
    if (change < 0) return '#FF6B6B';
    return '#888';
  };

  const getFilteredMatches = () => {
    let filtered = [...allMatches];
    
    switch (selectedFilter) {
      case 'wins':
        filtered = filtered.filter(match => match.result === 'Win');
        break;
      case 'losses':
        filtered = filtered.filter(match => match.result === 'Loss');
        break;
      case 'recent':
        filtered = filtered.slice(0, 5);
        break;
    }

    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'duration':
        filtered.sort((a, b) => parseInt(b.duration) - parseInt(a.duration));
        break;
      default:
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return filtered;
  };

  const handleMatchPress = (matchId: number) => {
    router.push(`/report/${matchId}`);
  };

  const handleStartNewMatch = () => {
    router.push('/record');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>All Matches</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color="#00D4FF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerSubtitle}>
          {allMatches.length} matches played
        </Text>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.sortButton}>
          <Filter size={16} color="#00D4FF" />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Match Statistics Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {allMatches.filter(m => m.result === 'Win').length}
          </Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {allMatches.filter(m => m.result === 'Loss').length}
          </Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round((allMatches.filter(m => m.result === 'Win').length / allMatches.length) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(allMatches.reduce((sum, m) => sum + parseInt(m.duration), 0) / allMatches.length)}m
          </Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>
      </View>

      {/* Start New Match Button */}
      <View style={styles.newMatchContainer}>
        <TouchableOpacity 
          style={styles.newMatchButton}
          onPress={handleStartNewMatch}
        >
          <LinearGradient
            colors={['#00FF88', '#00CC6A']}
            style={styles.newMatchGradient}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.newMatchText}>Start New Match</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <ScrollView style={styles.matchesList}>
        {getFilteredMatches().map((match) => (
          <TouchableOpacity 
            key={match.id} 
            style={styles.matchCard}
            onPress={() => handleMatchPress(match.id)}
          >
            <View style={styles.matchHeader}>
              <View style={styles.matchDateInfo}>
                <Text style={styles.matchDate}>{match.date}</Text>
                <View style={styles.matchTimeLocation}>
                  <Clock size={12} color="#888" />
                  <Text style={styles.matchTime}>{match.time}</Text>
                  <Text style={styles.matchDuration}>• {match.duration}</Text>
                </View>
              </View>
              <View style={[
                styles.resultBadge, 
                { backgroundColor: match.result === 'Win' ? '#00FF88' : '#FF6B6B' }
              ]}>
                <Text style={styles.resultText}>{match.result}</Text>
              </View>
            </View>

            <View style={styles.matchMainInfo}>
              <View style={styles.matchOpponentInfo}>
                <Text style={styles.matchOpponent}>vs {match.opponent}</Text>
                <Text style={styles.matchLocation}>{match.location}</Text>
              </View>
              <Text style={styles.matchSets}>{match.sets}</Text>
            </View>

            <View style={styles.matchStats}>
              <View style={styles.matchStatItem}>
                <Target size={14} color="#00D4FF" />
                <Text style={styles.matchStatValue}>{match.shots}</Text>
                <Text style={styles.matchStatLabel}>Shots</Text>
              </View>
              <View style={styles.matchStatItem}>
                <Trophy size={14} color="#00FF88" />
                <Text style={styles.matchStatValue}>{match.winners}</Text>
                <Text style={styles.matchStatLabel}>Winners</Text>
              </View>
              <View style={styles.matchStatItem}>
                <Text style={styles.matchStatValue}>{match.errors}</Text>
                <Text style={styles.matchStatLabel}>Errors</Text>
              </View>
              <View style={styles.matchStatItem}>
                <Text style={styles.matchStatValue}>{match.accuracy}%</Text>
                <Text style={styles.matchStatLabel}>Accuracy</Text>
              </View>
            </View>

            <View style={styles.matchRatingInfo}>
              <Text style={[styles.matchRating, { color: getRatingColor(match.rating) }]}>
                {match.rating} Rating
              </Text>
              <View style={styles.ratingChange}>
                {getRatingChangeIcon(match.ratingChange)}
                <Text style={[
                  styles.ratingChangeText, 
                  { color: getRatingChangeColor(match.ratingChange) }
                ]}>
                  {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterScroll: {
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#00D4FF',
    borderColor: '#00D4FF',
  },
  filterButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00D4FF',
    gap: 4,
  },
  sortButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  newMatchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  newMatchButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newMatchGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newMatchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchesList: {
    flex: 1,
    padding: 20,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchDateInfo: {
    flex: 1,
  },
  matchDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchTimeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTime: {
    color: '#888',
    fontSize: 12,
  },
  matchDuration: {
    color: '#888',
    fontSize: 12,
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
  matchMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchOpponentInfo: {
    flex: 1,
  },
  matchOpponent: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  matchLocation: {
    color: '#888',
    fontSize: 12,
  },
  matchSets: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  matchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  matchStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  matchStatValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchStatLabel: {
    color: '#888',
    fontSize: 10,
  },
  matchRatingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchRating: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});