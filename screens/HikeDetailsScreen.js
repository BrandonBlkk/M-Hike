import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hikeRepository } from '../database/hikeRepository';

export default function HikeDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { hike } = route.params;

  const [photoModalVisible, setPhotoModalVisible] = React.useState(false);
  const [selectedPhoto, setSelectedPhoto] = React.useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

  const photos = React.useMemo(() => {
    if (typeof hike.photos === 'string') {
      try {
        return JSON.parse(hike.photos);
      } catch (error) {
        console.error('Error parsing photos:', error);
        return [];
      }
    }
    return hike.photos || [];
  }, [hike.photos]);

  const locationCoords = React.useMemo(() => {
    if (typeof hike.locationCoords === 'string') {
      try {
        return JSON.parse(hike.locationCoords);
      } catch (error) {
        console.error('Error parsing location coordinates:', error);
        return null;
      }
    }
    return hike.locationCoords || null;
  }, [hike.locationCoords]);

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePhotoPress = (photoUri, index) => {
    setSelectedPhoto(photoUri);
    setCurrentPhotoIndex(index);
    setPhotoModalVisible(true);
  };

  const closePhotoModal = () => {
    setPhotoModalVisible(false);
    setSelectedPhoto(null);
    setCurrentPhotoIndex(0);
  };

  const goToNextPhoto = () => {
    if (photos && photos.length > 0) {
      const nextIndex = (currentPhotoIndex + 1) % photos.length;
      setCurrentPhotoIndex(nextIndex);
      setSelectedPhoto(photos[nextIndex]);
    }
  };

  const goToPreviousPhoto = () => {
    if (photos && photos.length > 0) {
      const prevIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
      setCurrentPhotoIndex(prevIndex);
      setSelectedPhoto(photos[prevIndex]);
    }
  };

  const handleEditHike = () => {
    navigation.navigate('EditHike', { 
      hikeToEdit: hike
    });
  };

  const handleDeleteHike = () => {
    Alert.alert(
      "Delete Hike",
      `Are you sure you want to delete "${hike.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await hikeRepository.deleteHike(hike.id);
              if (result.success) {
                // Navigate back to HikeList and remove this screen from stack
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'HikeList' }],
                });
              } else {
                Alert.alert("Error", result.error || "Failed to delete hike");
              }
            } catch (error) {
              Alert.alert("Error", "An error occurred while deleting the hike");
              console.error('Error deleting hike:', error);
            }
          }
        }
      ]
    );
  };

  const handleMapPress = () => {
    navigation.navigate('Map', { focusedHike: hike });
  };

  const getCompletionBadge = () => {
    if (hike.is_completed === 1) {
      return (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#2f8032ff" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.plannedBadge}>
          <Ionicons name="time-outline" size={16} color="#b96f00ff" />
          <Text style={styles.plannedText}>Planned</Text>
        </View>
      );
    }
  };

  const renderCoordinates = () => {
    if (!locationCoords) return null;
    
    return (
      <View style={styles.coordinatesSection}>
        <Text style={styles.sectionTitle}>Location Coordinates</Text>
        <View style={styles.coordinatesContent}>
          <View style={styles.coordinateItem}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.coordinateLabel}>Latitude:</Text>
            <Text style={styles.coordinateValue}>{locationCoords.latitude?.toFixed(6)}</Text>
          </View>
          <View style={styles.coordinateItem}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.coordinateLabel}>Longitude:</Text>
            <Text style={styles.coordinateValue}>{locationCoords.longitude?.toFixed(6)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCreationDate = () => {
    if (!hike.created_at) return null;
    
    return (
      <View style={styles.creationDateSection}>
        <Text style={styles.sectionTitle}>Record Created</Text>
        <View style={styles.creationDateContent}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.creationDateText}>{formatDateTime(hike.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.greenBackground}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hike Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <View style={styles.whiteBackground}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {photos && photos.length > 0 ? (
            <TouchableOpacity 
              style={styles.mainImageContainer}
              onPress={() => handlePhotoPress(photos[0], 0)}
            >
              <Image 
                source={{ uri: photos[0] }} 
                style={styles.mainHikeImage}
                resizeMode="cover"
              />
              <View style={styles.imageBadge}>
                {getCompletionBadge()}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={60} color="#999" />
              <Text style={styles.noImageText}>No Image Available</Text>
              <View style={styles.imageBadge}>
                {getCompletionBadge()}
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.titleSection}>
              <Text style={styles.hikeName}>{hike.name}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.hikeLocation}>{hike.location}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={20} color="#1E6A65" />
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(hike.date)}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="trail-sign-outline" size={20} color="#1E6A65" />
                  <Text style={styles.detailLabel}>Length</Text>
                  <Text style={styles.detailValue}>{hike.length} km</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="flash-outline" size={20} color="#1E6A65" />
                  <Text style={styles.detailLabel}>Difficulty</Text>
                  <Text style={[styles.detailValue, styles[`difficulty${hike.difficulty}`]]}>
                    {hike.difficulty}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="car-outline" size={20} color="#1E6A65" />
                  <Text style={styles.detailLabel}>Parking</Text>
                  <Text style={styles.detailValue}>{hike.parking}</Text>
                </View>
              </View>
            </View>

            <View style={styles.additionalDetails}>
              {hike.route_type && (
                <View style={styles.additionalDetailItem}>
                  <Ionicons name="git-merge-outline" size={18} color="#666" />
                  <Text style={styles.additionalDetailLabel}>Route Type:</Text>
                  <Text style={styles.additionalDetailValue}>{hike.route_type}</Text>
                </View>
              )}

              {hike.is_completed === 1 && hike.completed_date && (
                <View style={styles.additionalDetailItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                  <Text style={styles.additionalDetailLabel}>Completed:</Text>
                  <Text style={styles.additionalDetailValue}>
                    {formatDate(hike.completed_date)}
                  </Text>
                </View>
              )}
            </View>

            {hike.description ? (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{hike.description}</Text>
              </View>
            ) : (
              <View style={styles.noDescriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.noContentText}>No description provided</Text>
              </View>
            )}

            {hike.weather ? (
              <View style={styles.weatherSection}>
                <Text style={styles.sectionTitle}>Weather Conditions</Text>
                <View style={styles.weatherContent}>
                  <Text style={styles.weatherIcon}>🌤️</Text>
                  <Text style={styles.weatherText}>{hike.weather}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noWeatherSection}>
                <Text style={styles.sectionTitle}>Weather Conditions</Text>
                <Text style={styles.noContentText}>No weather information recorded</Text>
              </View>
            )}

            {hike.notes ? (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <Text style={styles.notesText}>{hike.notes}</Text>
              </View>
            ) : (
              <View style={styles.noNotesSection}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <Text style={styles.noContentText}>No additional notes provided</Text>
              </View>
            )}

            {renderCoordinates()}

            {renderCreationDate()}
          </View>

          {photos && photos.length > 1 && (
            <View style={styles.additionalPhotosSection}>
              <Text style={styles.sectionTitle}>More Photos ({photos.length - 1})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.photosScrollView}
              >
                {photos.slice(1).map((photo, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.photoContainer}
                    onPress={() => handlePhotoPress(photo, index + 1)}
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

          {(!photos || photos.length === 0) && (
            <View style={styles.noPhotosSection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.noContentText}>No photos available</Text>
            </View>
          )}

          <View style={styles.actionButtonsContainer}>
            {locationCoords && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.mapButton]}
                onPress={handleMapPress}
              >
                <Ionicons name="map-outline" size={20} color="#FFFFFF" />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEditHike}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Hike</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteHike}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Hike</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
          
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closePhotoModal}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {photos && photos.length > 1 && (
              <Text style={styles.photoCounter}>
                {currentPhotoIndex + 1} / {photos.length}
              </Text>
            )}
          </View>

          <View style={styles.photoContainerModal}>
            {selectedPhoto && (
              <TouchableOpacity 
                style={styles.fullScreenPhotoContainer}
                activeOpacity={1}
                onPress={goToNextPhoto}
              >
                <Image 
                  source={{ uri: selectedPhoto }} 
                  style={styles.fullScreenPhoto}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            
            {photos && photos.length > 1 && (
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

          {photos && photos.length > 1 && (
            <View style={styles.dotsContainer}>
              {photos.map((_, index) => (
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3ff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  mainImageContainer: {
    height: 250,
    width: '100%',
    marginBottom: 16,
  },
  mainHikeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  noImageContainer: {
    height: 200,
    width: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 12,
    marginBottom: 16,
  },
  noImageText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  imageBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  completedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  plannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  plannedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  titleSection: {
    marginBottom: 24,
  },
  hikeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hikeLocation: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  detailsGrid: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  difficultyEasy: {
    color: '#4CAF50',
  },
  difficultyModerate: {
    color: '#FF9800',
  },
  difficultyHard: {
    color: '#F44336',
  },
  additionalDetails: {
    marginBottom: 24,
  },
  additionalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  additionalDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 6,
  },
  additionalDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  noDescriptionSection: {
    marginBottom: 24,
  },
  weatherSection: {
    marginBottom: 24,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
  },
  weatherIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  weatherText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  noWeatherSection: {
    marginBottom: 24,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  noNotesSection: {
    marginBottom: 24,
  },
  coordinatesSection: {
    marginBottom: 24,
  },
  coordinatesContent: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  coordinateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 6,
    width: 80,
  },
  coordinateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  creationDateSection: {
    marginBottom: 24,
  },
  creationDateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  creationDateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  noContentText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    textAlign: 'center',
  },
  additionalPhotosSection: {
    marginBottom: 16,
  },
  noPhotosSection: {
    marginBottom: 16,
  },
  photosScrollView: {
    marginHorizontal: -4,
  },
  photoContainer: {
    marginHorizontal: 4,
  },
  additionalPhoto: {
    width: 100,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  mapButton: {
    backgroundColor: "#2196F3",
  },
  editButton: {
    backgroundColor: "#1E6A65",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
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
  closeButton: {
    padding: 4,
  },
  photoCounter: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
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