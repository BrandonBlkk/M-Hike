import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { hikeRepository } from '../database/hikeRepository';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [recentHikes, setRecentHikes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecentHikes = async () => {
    try {
      const result = await hikeRepository.getAllHikes();
      if (result.success) {
        // Sort hikes by date (newest first) and take the first 3
        const sortedHikes = result.hikes
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        setRecentHikes(sortedHikes);
      } else {
        console.error('Error loading recent hikes:', result.error);
      }
    } catch (error) {
      console.error('Error loading recent hikes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load recent hikes
  useFocusEffect(
    React.useCallback(() => {
      loadRecentHikes();
    }, [])
  );

  useEffect(() => {
    loadRecentHikes();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get completion status badge
  const getCompletionBadge = (hike) => {
    if (hike.is_completed === 1) {
      return (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.plannedBadge}>
          <Ionicons name="time-outline" size={12} color="#FF9800" />
          <Text style={styles.plannedText}>Planned</Text>
        </View>
      );
    }
  };

  const renderRecentHike = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentHikeCard}
      onPress={() => navigation.navigate('HikeList')}
    >
      <View style={styles.hikeHeader}>
        <View style={styles.hikeIconContainer}>
          <Ionicons name="trail-sign" size={20} color="#1E6A65" />
        </View>
        <View style={styles.hikeInfo}>
          <Text style={styles.recentHikeTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.recentHikeLocation} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        {getCompletionBadge(item)}
      </View>
      
      <View style={styles.hikeDetails}>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="walk-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.length} km</Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={[styles.difficultyBadge, styles[`difficulty${item.difficulty}`]]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
          {item.route_type && (
            <View style={styles.routeTypeBadge}>
              <Ionicons name="git-merge-outline" size={12} color="#666" />
              <Text style={styles.routeTypeText}>{item.route_type}</Text>
            </View>
          )}
        </View>

        {item.is_completed === 1 && item.completed_date && (
          <View style={styles.completedDateRow}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#4CAF50" />
            <Text style={styles.completedDateText}>
              Completed on {formatDate(item.completed_date)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>M-Hike</Text>
          <Text style={styles.subtitle}>Track your hiking adventures and progress</Text>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddHike')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="add-circle" size={28} color="#1E6A65" />
            </View>
            <Text style={styles.actionText}>Add Hike</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('HikeList')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="list" size={28} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>My Hikes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="map" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.actionText}>Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Weather')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="partly-sunny" size={28} color="#80BDE7" />
            </View>
            <Text style={styles.actionText}>Weather</Text>
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Explore Features</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('HikeList')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="trail-sign" size={32} color="#1E6A65" />
              </View>
              <Text style={styles.featureTitle}>Record Hikes</Text>
              <Text style={styles.featureDescription}>
                Keep detailed records of all your hiking adventures
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('AddHike')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="stats-chart" size={32} color="#FF9800" />
              </View>
              <Text style={styles.featureTitle}>Track Progress</Text>
              <Text style={styles.featureDescription}>
                Monitor your hiking statistics and achievements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Map')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="map" size={32} color="#3F51B5" />
              </View>
              <Text style={styles.featureTitle}>Trail Maps</Text>
              <Text style={styles.featureDescription}>
                Access trail maps and navigation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Weather')}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="partly-sunny" size={32} color="#80BDE7" />
              </View>
              <Text style={styles.featureTitle}>Weather Info</Text>
              <Text style={styles.featureDescription}>
                Record weather conditions for each hike
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Section */}
        <View style={styles.motivationContainer}>
          <View style={styles.motivationContent}>
            <Ionicons name="trophy" size={40} color="#1E6A65" />
            <View style={styles.motivationTextContainer}>
              <Text style={styles.motivationTitle}>Keep Climbing!</Text>
              <Text style={styles.motivationText}>
                Every step counts. Track your hikes and celebrate your achievements.
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Hikes */}
        <View style={styles.recentHikesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Hikes</Text>
            {recentHikes.length > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('HikeList')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#1E6A65" />
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="trail-sign-outline" size={40} color="#999" />
              <Text style={styles.loadingText}>Loading recent hikes...</Text>
            </View>
          ) : recentHikes.length > 0 ? (
            <FlatList
              data={recentHikes}
              renderItem={renderRecentHike}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentHikesList}
              style={styles.recentHikesFlatList}
            />
          ) : (
            <View style={styles.noHikesContainer}>
              <Ionicons name="trail-sign-outline" size={48} color="#999" />
              <Text style={styles.noHikesText}>No hikes recorded yet</Text>
              <Text style={styles.noHikesSubtext}>Start your hiking journey today!</Text>
              <TouchableOpacity 
                style={styles.addHikeButton}
                onPress={() => navigation.navigate('AddHike')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.addHikeButtonText}>Add Your First Hike</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E6A65',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1E6A65',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: (width - 52) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  motivationContainer: {
    backgroundColor: '#E8F5E8',
    padding: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#1E6A65',
  },
  motivationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E6A65',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  recentHikesContainer: {
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    color: '#1E6A65',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  recentHikesList: {
    gap: 16,
    paddingVertical: 4,
  },
  recentHikesFlatList: {
    marginBottom: 0,
  },
  recentHikeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: 300,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  hikeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hikeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hikeInfo: {
    flex: 1,
    marginRight: 8,
  },
  recentHikeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  recentHikeLocation: {
    fontSize: 14,
    color: '#666',
  },
  // Completion Badges
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '600',
  },
  plannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  plannedText: {
    color: '#FF9800',
    fontSize: 10,
    fontWeight: '600',
  },
  hikeDetails: {
    gap: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyEasy: {
    backgroundColor: '#E8F5E8',
  },
  difficultyModerate: {
    backgroundColor: '#FFF3E0',
  },
  difficultyHard: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Route Type Badge
  routeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  routeTypeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  // Completed Date Row
  completedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  completedDateText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  noHikesContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  noHikesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  noHikesSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  addHikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E6A65',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addHikeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});