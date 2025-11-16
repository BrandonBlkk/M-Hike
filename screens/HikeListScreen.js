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
  Platform,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { hikeRepository } from '../database/hikeRepository';
import { Ionicons } from '@expo/vector-icons';

export default function HikeListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [hikes, setHikes] = useState([]);
  const [filteredHikes, setFilteredHikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedHikeName, setSelectedHikeName] = useState('');
  const [selectedHikePhotos, setSelectedHikePhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const loadHikes = async () => {
    try {
        const result = await hikeRepository.getAllHikes();
        if (result.success) {
          setHikes(result.hikes);
          setFilteredHikes(result.hikes);
        } else {
          Alert.alert("Error", "Failed to load hikes");
          console.error('Error loading hikes:', result.error);
        }
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
      (hike.route_type && hike.route_type.toLowerCase().includes(lowerCaseQuery)) ||
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
              const result = await hikeRepository.deleteHike(hikeId);
              if (result.success) {
                // Remove the hike from local state immediately
                setHikes(prevHikes => prevHikes.filter(hike => hike.id !== hikeId));
                Alert.alert("Success", "Hike deleted successfully");
              } else {
                Alert.alert("Error", result.error || "Failed to delete hike");
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

  const handlePhotoPress = (photoUri, hikeName, hikePhotos, index) => {
    setSelectedPhoto(photoUri);
    setSelectedHikeName(hikeName);
    setSelectedHikePhotos(hikePhotos);
    setCurrentPhotoIndex(index);
    setPhotoModalVisible(true);
  };

  const closePhotoModal = () => {
    setPhotoModalVisible(false);
    setSelectedPhoto(null);
    setSelectedHikeName('');
    setSelectedHikePhotos([]);
    setCurrentPhotoIndex(0);
  };

  const goToNextPhoto = () => {
    if (selectedHikePhotos.length > 0) {
      const nextIndex = (currentPhotoIndex + 1) % selectedHikePhotos.length;
      setCurrentPhotoIndex(nextIndex);
      setSelectedPhoto(selectedHikePhotos[nextIndex]);
    }
  };

  const goToPreviousPhoto = () => {
    if (selectedHikePhotos.length > 0) {
      const prevIndex = (currentPhotoIndex - 1 + selectedHikePhotos.length) % selectedHikePhotos.length;
      setCurrentPhotoIndex(prevIndex);
      setSelectedPhoto(selectedHikePhotos[prevIndex]);
    }
  };

  // Handle swipe gestures
  const handleSwipe = (event) => {
    const { nativeEvent } = event;
    if (nativeEvent.pageX - nativeEvent.locationX < 50) {
      // Swipe left - next photo
      goToNextPhoto();
    } else if (nativeEvent.pageX - nativeEvent.locationX > Dimensions.get('window').width - 50) {
      // Swipe right - previous photo
      goToPreviousPhoto();
    }
  };

  // Get completion status badge
  const getCompletionBadge = (hike) => {
    if (hike.is_completed === 1) {
      return (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#2f8032ff" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.plannedBadge}>
          <Ionicons name="time-outline" size={14} color="#b96f00ff" />
          <Text style={styles.plannedText}>Planned</Text>
        </View>
      );
    }
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
                    <TouchableOpacity 
                      style={styles.mainImageContainer}
                      onPress={() => handlePhotoPress(hike.photos[0], hike.name, hike.photos, 0)}
                    >
                      <Image 
                        source={{ uri: hike.photos[0] }} 
                        style={styles.mainHikeImage}
                        resizeMode="cover"
                      />
                      {/* Completion Badge on Image */}
                      <View style={styles.imageBadge}>
                        {getCompletionBadge(hike)}
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={40} color="#999" />
                      <Text style={styles.noImageText}>No Image</Text>
                      {/* Completion Badge on No Image */}
                      <View style={styles.imageBadge}>
                        {getCompletionBadge(hike)}
                      </View>
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
                          `Location: ${hike.location}\nDate: ${formatDate(hike.date)}\nLength: ${hike.length}km\nDifficulty: ${hike.difficulty}\nParking: ${hike.parking}\nRoute Type: ${hike.route_type || 'Not specified'}\nStatus: ${hike.is_completed ? 'Completed' : 'Planned'}${hike.is_completed && hike.completed_date ? `\nCompleted Date: ${formatDate(hike.completed_date)}` : ''}\n${hike.description ? `Description: ${hike.description}\n` : ''}${hike.weather ? `Weather: ${hike.weather}` : ''}`
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

                      {/* Additional Info Row */}
                      <View style={styles.additionalInfoRow}>
                        {hike.route_type && (
                          <View style={styles.infoItem}>
                            <Ionicons name="git-merge-outline" size={14} color="#666" />
                            <Text style={styles.infoText}>{hike.route_type}</Text>
                          </View>
                        )}
                        {hike.is_completed === 1 && hike.completed_date && (
                          <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
                            <Text style={styles.completedDateText}>
                              {formatDate(hike.completed_date)}
                            </Text>
                          </View>
                        )}
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
                                onPress={() => handlePhotoPress(photo, hike.name, hike.photos, index + 1)}
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

      {/* Full Screen Photo Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
          
          {/* Header with hike name, photo counter and close button */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalHikeName} numberOfLines={1}>
                {selectedHikeName}
              </Text>
              {selectedHikePhotos.length > 1 && (
                <Text style={styles.photoCounter}>
                  {currentPhotoIndex + 1} / {selectedHikePhotos.length}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closePhotoModal}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Photo Container with swipe gestures */}
          <View style={styles.photoContainerModal}>
            {selectedPhoto && (
              <TouchableOpacity 
                style={styles.fullScreenPhotoContainer}
                activeOpacity={1}
                onPress={handleSwipe}
              >
                <Image 
                  source={{ uri: selectedPhoto }} 
                  style={styles.fullScreenPhoto}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            
            {/* Navigation Arrows */}
            {selectedHikePhotos.length > 1 && (
              <>
                <TouchableOpacity 
                  style={[styles.navButton, styles.prevButton]}
                  onPress={goToPreviousPhoto}
                >
                  <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.navButton, styles.nextButton]}
                  onPress={goToNextPhoto}
                >
                  <Ionicons name="chevron-forward" size={32} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer with dots indicator */}
          {selectedHikePhotos.length > 1 && (
            <View style={styles.dotsContainer}>
              {selectedHikePhotos.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot,
                    index === currentPhotoIndex && styles.activeDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E6A65',
  },
  greenBackground: {
    backgroundColor: '#1E6A65',
  },
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
    position: 'relative',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  imageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  // Completion Badges
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  plannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  plannedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 12,
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
  // Additional Info Row
  additionalInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  completedDateText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
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
  // Full Screen Photo Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 20,
  },
  modalHikeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  photoCounter: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
  },
  photoContainerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenPhotoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhoto: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  // Navigation buttons
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -25 }],
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  // Dots indicator
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});