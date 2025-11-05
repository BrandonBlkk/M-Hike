import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Image,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { databaseService } from '../database/databaseService';
import { Ionicons } from '@expo/vector-icons';

export default function HikeListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [hikes, setHikes] = useState([]);
  const [filteredHikes, setFilteredHikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadHikes = async () => {
    try {
        const allHikes = await databaseService.getAllHikes();
        setHikes(allHikes);
        setFilteredHikes(allHikes);
    } catch (error) {
        Alert.alert("Error", "Failed to load hikes");
        console.error('Error loading hikes:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  // Filter hikes based on search query
  const filterHikes = (query) => {
    if (!query.trim()) {
      setFilteredHikes(hikes);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const filtered = hikes.filter(hike => 
      hike.name.toLowerCase().includes(lowerCaseQuery) ||
      hike.location.toLowerCase().includes(lowerCaseQuery) ||
      hike.difficulty.toLowerCase().includes(lowerCaseQuery) ||
      (hike.description && hike.description.toLowerCase().includes(lowerCaseQuery)) ||
      (hike.weather && hike.weather.toLowerCase().includes(lowerCaseQuery)) ||
      (hike.notes && hike.notes.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredHikes(filtered);
  };

  // Load hikes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadHikes();
    }, [])
  );

  useEffect(() => {
    loadHikes();
  }, []);

  // Update filtered hikes when search query changes
  useEffect(() => {
    filterHikes(searchQuery);
  }, [searchQuery, hikes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHikes();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteHike = (hikeId, hikeName) => {
    Alert.alert(
      "Delete Hike",
      `Are you sure you want to delete "${hikeName}"?`,
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await databaseService.deleteHike(hikeId);
              if (result.success) {
                // Remove the hike from local state immediately
                setHikes(prevHikes => prevHikes.filter(hike => hike.id !== hikeId));
                Alert.alert("Success", "Hike deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete hike");
              }
            } catch (error) {
              Alert.alert("Error", "An error occurred while deleting the hike");
              console.error('Error deleting hike:', error);
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
  const handleEditHike = (hike) => {
    // Navigate to EditHikeScreen within the stack
    navigation.navigate('EditHike', { 
      hikeToEdit: hike,
      onHikeUpdated: loadHikes
    });
  };

  const handleMapPress = (hike) => {
    // Navigate to MapScreen with the focused hike
    navigation.navigate('Map', { focusedHike: hike });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handlePhotoPress = (photoUri, hikeName) => {
    Alert.alert(
      `${hikeName} - Photo`,
      "View photo in full screen",
      [
        {
          text: "View",
          onPress: () => {
            // You can implement full-screen photo view here
            // For now, we'll just show a larger preview in an alert
            Alert.alert(
              "Photo Preview",
              "Full screen photo view would be implemented here",
              [{ text: "OK" }]
            );
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading hikes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Green Background Section */}
      <View style={styles.greenBackground}>
        {/* Title Bar */}
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>My Hikes</Text>
          <Text style={styles.subtitleText}>
            {filteredHikes.length} hike{filteredHikes.length !== 1 ? 's' : ''} recorded
            {searchQuery ? ` (${hikes.length} total)` : ''}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hikes by name, location, difficulty..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* White Background Section for Card List */}
      <View style={styles.whiteBackground}>
        {filteredHikes.length === 0 ? (
          <View style={styles.emptyState}>
              {searchQuery ? (
                  <>
                      <Ionicons name="search-outline" size={64} color="#999" />
                      <Text style={styles.emptyTitle}>No Matching Hikes</Text>
                      <Text style={styles.emptyText}>
                          No hikes found matching "{searchQuery}"
                      </Text>
                      <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                          <Text style={styles.clearSearchText}>Clear Search</Text>
                      </TouchableOpacity>
                      </>
                  ) : (
                      <>
                      <Ionicons name="trail-sign-outline" size={64} color="#999" />
                      <Text style={styles.emptyTitle}>No Hikes Yet</Text>
                      <Text style={styles.emptyText}>
                          Start by adding your first hike using the "Add Hike" tab!
                      </Text>
                  </>
              )}
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.hikesContainer}>
              {filteredHikes.map((hike) => (
                <View key={hike.id} style={styles.hikeCard}>
                  {/* Main Hike Image */}
                  {hike.photos && hike.photos.length > 0 ? (
                    <View style={styles.mainImageContainer}>
                      <Image 
                        source={{ uri: hike.photos[0] }} 
                        style={styles.mainHikeImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={40} color="#999" />
                      <Text style={styles.noImageText}>No Image</Text>
                    </View>
                  )}

                  {/* Content Section */}
                  <View style={styles.hikeContent}>
                    {/* Header with title and actions */}
                    <View style={styles.hikeHeader}>
                      <View style={styles.hikeTitleSection}>
                        <Text style={styles.hikeName}>{hike.name}</Text>
                        <View style={styles.locationContainer}>
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text style={styles.hikeLocation}>{hike.location}</Text>
                        </View>
                      </View>
                      <View style={styles.actionButtons}>
                        {/* Map button - only show if hike has coordinates */}
                        {hike.locationCoords && (
                          <TouchableOpacity 
                            style={styles.mapButton}
                            onPress={() => handleMapPress(hike)}
                          >
                            <Ionicons name="map-outline" size={20} color="#2196F3" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => handleEditHike(hike)}
                        >
                          <Ionicons name="create-outline" size={20} color="#1E6A65" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteHike(hike.id, hike.name)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#f44336" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Details Section */}
                    <TouchableOpacity 
                      style={styles.hikeDetails}
                      onPress={() => {
                        Alert.alert(
                          hike.name,
                          `Location: ${hike.location}\nDate: ${formatDate(hike.date)}\nLength: ${hike.length}km\nDifficulty: ${hike.difficulty}\nParking: ${hike.parking}\n${hike.description ? `Description: ${hike.description}\n` : ''}${hike.weather ? `Weather: ${hike.weather}` : ''}`
                        );
                      }}
                    >
                      {/* Stats Row */}
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Ionicons name="calendar-outline" size={16} color="#666" />
                          <Text style={styles.statText}>{formatDate(hike.date)}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="trail-sign-outline" size={16} color="#666" />
                          <Text style={styles.statText}>{hike.length} km</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="flash-outline" size={16} color="#666" />
                          <Text style={[styles.statText, styles[`difficulty${hike.difficulty}`]]}>
                            {hike.difficulty}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="car-outline" size={16} color="#666" />
                          <Text style={styles.statText}>{hike.parking}</Text>
                        </View>
                      </View>

                      {/* Additional Photos Section */}
                      {hike.photos && hike.photos.length > 1 && (
                        <View style={styles.additionalPhotosSection}>
                          <View style={styles.photosHeader}>
                            <Text style={styles.photosLabel}>
                              More Photos ({hike.photos.length - 1})
                            </Text>
                          </View>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.photosScrollView}
                          >
                            {hike.photos.slice(1).map((photo, index) => (
                              <TouchableOpacity 
                                key={index} 
                                style={styles.photoContainer}
                                onPress={() => handlePhotoPress(photo, hike.name)}
                              >
                                <Image 
                                  source={{ uri: photo }} 
                                  style={styles.additionalPhoto} 
                                />
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {/* Description */}
                      {hike.description ? (
                        <View style={styles.descriptionSection}>
                          <Text style={styles.descriptionText} numberOfLines={2}>
                            {hike.description}
                          </Text>
                        </View>
                      ) : null}

                      {/* Weather */}
                      {hike.weather ? (
                        <View style={styles.weatherSection}>
                          <Text style={styles.weatherIcon}>🌤️</Text>
                          <Text style={styles.weatherText}>{hike.weather}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E6A65',
  },
  // Green Background Section
  greenBackground: {
    backgroundColor: '#1E6A65',
  },
  // White Background Section for Card List
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Title Bar
  titleBar: {
    backgroundColor: '#ffffffff',
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3ff',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000ff',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  // Search Container
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffffff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  // Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#1E6A65',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Hike Card Styles
  hikesContainer: {
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  hikeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  // Main Image Section
  mainImageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  mainHikeImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    height: 200,
    width: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  // Content Section
  hikeContent: {
    flex: 1,
  },
  // Header Section
  hikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  hikeTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  hikeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hikeLocation: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButton: {
    padding: 6,
    marginRight: 8,
  },
  editButton: {
    padding: 6,
    marginRight: 8,
  },
  deleteButton: {
    padding: 6,
  },
  // Details Section
  hikeDetails: {
    padding: 16,
    paddingTop: 0,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexBasis: '50%',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Difficulty Colors
  difficultyEasy: {
    color: '#4CAF50',
  },
  difficultyModerate: {
    color: '#FF9800',
  },
  difficultyHard: {
    color: '#F44336',
  },
  // Additional Photos Section
  additionalPhotosSection: {
    marginBottom: 16,
  },
  photosHeader: {
    marginBottom: 8,
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  photosScrollView: {
    marginHorizontal: -4,
  },
  photoContainer: {
    marginHorizontal: 4,
  },
  additionalPhoto: {
    width: 80,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  // Description Section
  descriptionSection: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Weather Section
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  weatherText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});