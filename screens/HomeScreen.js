import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { databaseService } from '../database/databaseService';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [recentHikes, setRecentHikes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecentHikes = async () => {
    try {
      const allHikes = await databaseService.getAllHikes();
      // Sort hikes by date (newest first) and take the first 3
      const sortedHikes = allHikes
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      setRecentHikes(sortedHikes);
    } catch (error) {
      console.error('Error loading recent hikes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load recent
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

  const renderRecentHike = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentHikeCard}
      onPress={() => navigation.navigate('HikeList')}
    >
      <Text style={styles.recentHikeTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.recentHikeDetails}>
        {formatDate(item.date)} • {item.length} km
      </Text>
      <Text style={styles.recentHikeLocation} numberOfLines={1}>
        {item.location}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>M-Hike</Text>
        <Text style={styles.subtitle}>Track your hiking adventures and progress</Text>
        
        {/* Features - 2 per row */}
        <View style={styles.featuresContainer}>
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('HikeList')}
          >
            <Text style={styles.featureIcon}>🏔️</Text>
            <Text style={styles.featureTitle}>Record Hikes</Text>
            <Text style={styles.featureDescription}>
              Keep detailed records of all your hiking adventures
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('AddHike')}
          >
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureTitle}>Track Progress</Text>
            <Text style={styles.featureDescription}>
              Monitor your hiking statistics and achievements
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('AddHike')}
          >
            <Text style={styles.featureIcon}>🌤️</Text>
            <Text style={styles.featureTitle}>Weather Info</Text>
            <Text style={styles.featureDescription}>
              Record weather conditions for each hike
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureTitle}>Trail Maps</Text>
            <Text style={styles.featureDescription}>
              Access trail maps and navigation for your next adventure
            </Text>
          </TouchableOpacity>

        </View>

        {/* Motivational Section */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationTitle}>Keep Climbing!</Text>
          <Text style={styles.motivationText}>
            Every step counts. Track your hikes and celebrate your achievements.
          </Text>
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
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
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
              <Text style={styles.noHikesText}>No hikes recorded yet</Text>
              <TouchableOpacity 
                style={styles.addHikeButton}
                onPress={() => navigation.navigate('AddHike')}
              >
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
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    width: cardWidth,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  motivationContainer: {
    backgroundColor: '#d1f7c4',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 5,
  },
  motivationText: {
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
  },
  recentHikesContainer: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E6A65',
    borderRadius: 6,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recentHikesList: {
    gap: 15,
    paddingVertical: 10,
  },
  recentHikesFlatList: {
    marginBottom: 0,
  },
  recentHikeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    minWidth: 200,
    maxWidth: 250,
  },
  recentHikeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  recentHikeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  recentHikeLocation: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  noHikesContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
  },
  noHikesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  addHikeButton: {
    backgroundColor: '#1E6A65',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addHikeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});