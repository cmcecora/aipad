import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Clock, Award, ListFilter as Filter, Calendar, Activity, Users, Zap, Shield, Trophy, Medal, Crown, Minus, TrendingDown } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentRating] = useState(1547);
  const [userRank] = useState(1247);
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
    { key: 'analysis', label: 'Analysis' },
    { key: 'rankings', label: 'Rankings' }
  ];

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

  const getRankingColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#00D4FF';
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up': return <TrendingUp size={16} color="#00FF88" />;
      case 'down': return <TrendingDown size={16} color="#FF6B6B" />;
      default: return <Minus size={16} color="#888" />;
    }
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

            {/* Shot Consistency / Game Flow */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shot Consistency / Game Flow</Text>
              <View style={styles.categoryCard}>
                <View style={styles.indicatorRow}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Consecutive Shots</Text>
                    <Text style={[styles.indicatorValue, { color: '#00FF88' }]}>8.2</Text>
                    <Text style={styles.indicatorUnit}>avg streak</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Rally Maintenance</Text>
                    <Text style={[styles.indicatorValue, { color: '#00D4FF' }]}>76%</Text>
                    <Text style={styles.indicatorUnit}>sustained</Text>
                  </View>
                </View>
                <View style={styles.indicatorRow}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Breaking Rhythm</Text>
                    <Text style={[styles.indicatorValue, { color: '#FFD700' }]}>23</Text>
                    <Text style={styles.indicatorUnit}>per match</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Unforced Errors</Text>
                    <Text style={[styles.indicatorValue, { color: '#FF6B6B' }]}>12%</Text>
                    <Text style={styles.indicatorUnit}>rate</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Winner's Impact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Winner's Impact</Text>
              <View style={styles.categoryCard}>
                <View style={styles.indicatorRow}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Clean Winner</Text>
                    <Text style={[styles.indicatorValue, { color: '#00FF88' }]}>34</Text>
                    <Text style={styles.indicatorUnit}>total</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Forced Error</Text>
                    <Text style={[styles.indicatorValue, { color: '#00D4FF' }]}>28</Text>
                    <Text style={styles.indicatorUnit}>induced</Text>
                  </View>
                </View>
                <View style={styles.indicatorRow}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Set-Winning</Text>
                    <Text style={[styles.indicatorValue, { color: '#FFD700' }]}>7</Text>
                    <Text style={styles.indicatorUnit}>shots</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Match-Winning</Text>
                    <Text style={[styles.indicatorValue, { color: '#9D4EDD' }]}>3</Text>
                    <Text style={styles.indicatorUnit}>shots</Text>
                  </View>
                </View>
              </View>
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

            {/* Court Positioning */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Court Positioning</Text>
              <View style={styles.categoryCard}>
                <View style={styles.indicatorRow}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Optimal Position</Text>
                    <Text style={[styles.indicatorValue, { color: '#00FF88' }]}>68%</Text>
                    <Text style={styles.indicatorUnit}>of time</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Poor Position</Text>
                    <Text style={[styles.indicatorValue, { color: '#FF6B6B' }]}>14%</Text>
                    <Text style={styles.indicatorUnit}>of time</Text>
                  </View>
                </View>
                <View style={styles.indicatorRow}>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Strategic Changes</Text>
                    <Text style={[styles.indicatorValue, { color: '#00D4FF' }]}>42</Text>
                    <Text style={styles.indicatorUnit}>per match</Text>
                  </View>
                  <View style={styles.indicator}>
                    <Text style={styles.indicatorLabel}>Out of Position</Text>
                    <Text style={[styles.indicatorValue, { color: '#FFD700' }]}>18%</Text>
                    <Text style={styles.indicatorUnit}>of time</Text>
                  </View>
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

      case 'rankings':
        return (
          <View>
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
                  <Text style={styles.userRating}>{currentRating} Rating</Text>
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
                    styles.categoryButtonActive
                  ]}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    styles.categoryButtonTextActive
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
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  indicator: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
  },
  indicatorLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  indicatorValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  indicatorUnit: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});