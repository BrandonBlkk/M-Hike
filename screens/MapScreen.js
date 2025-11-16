import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { hikeRepository } from '../database/hikeRepository';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [hikes, setHikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [showLegend, setShowLegend] = useState(true);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const focusedHike = route.params?.focusedHike;

  const loadHikes = async () => {
    try {
      const result = await hikeRepository.getAllHikes();
      if (result.success) {
        const hikesWithCoords = result.hikes.filter(hike => hike.locationCoords);
        setHikes(hikesWithCoords);

        // If there's a focused hike, center map on it
        if (focusedHike && focusedHike.locationCoords) {
          setRegion({
            ...focusedHike.locationCoords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        // Otherwise, set map region to show all markers if there are hikes with coordinates
        else if (hikesWithCoords.length > 0) {
          const coordinates = hikesWithCoords.map(hike => hike.locationCoords);
          const minLat = Math.min(...coordinates.map(coord => coord.latitude));
          const maxLat = Math.max(...coordinates.map(coord => coord.latitude));
          const minLng = Math.min(...coordinates.map(coord => coord.longitude));
          const maxLng = Math.max(...coordinates.map(coord => coord.longitude));
          
          setRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
            longitudeDelta: (maxLng - minLng) * 1.5 + 0.01,
          });
        }
      } else {
        Alert.alert("Error", "Failed to load hikes for map");
        console.error('Error loading hikes for map:', result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load hikes for map");
      console.error('Error loading hikes for map:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHikes();
      getUserLocation();
    }, [focusedHike])
  );

  const handleMarkerPress = (hike) => {
    Alert.alert(
      hike.name,
      `📍 ${hike.location}\n📅 ${new Date(hike.date).toLocaleDateString()}\n📏 ${hike.length}km\n⚡ ${hike.difficulty}`,
      [
        {
          text: "View Details",
          onPress: () => {
            Alert.alert(
              `Hike Details - ${hike.name}`,
              `📍 Location: ${hike.location}\n📅 Date: ${new Date(hike.date).toLocaleDateString()}\n📏 Length: ${hike.length}km\n⚡ Difficulty: ${hike.difficulty}\n🅿️ Parking: ${hike.parking}\n${hike.description ? `📝 Description: ${hike.description}\n` : ''}${hike.weather ? `🌤️ Weather: ${hike.weather}` : ''}`
            );
          }
        },
        {
          text: "View in List",
          onPress: () => {
            navigation.navigate('HikeList');
          }
        },
        {
          text: "Close",
          style: "cancel"
        }
      ]
    );
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      Alert.alert("Location", "Unable to get your current location");
    }
  };

  const centerOnAllHikes = () => {
    if (hikes.length > 0 && mapRef.current) {
      const coordinates = hikes.map(hike => hike.locationCoords);
      const minLat = Math.min(...coordinates.map(coord => coord.latitude));
      const maxLat = Math.max(...coordinates.map(coord => coord.latitude));
      const minLng = Math.min(...coordinates.map(coord => coord.longitude));
      const maxLng = Math.max(...coordinates.map(coord => coord.longitude));
      
      mapRef.current.animateToRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
        longitudeDelta: (maxLng - minLng) * 1.5 + 0.01,
      }, 1000);
    }
  };

  const toggleMapType = () => {
    setMapType(prevType => prevType === 'standard' ? 'satellite' : 'standard');
  };

  const toggleLegend = () => {
    setShowLegend(prev => !prev);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4CAF50'; // Green
      case 'moderate':
        return '#FF9800'; // Orange
      case 'hard':
        return '#F44336'; // Red
      default:
        return '#2196F3'; // Blue
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E6A65" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {hikes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Hikes on Map</Text>
          <Text style={styles.emptyText}>
            No hikes with location data found.{"\n"}
            Use the location button when adding hikes to see them here.
          </Text>
          <TouchableOpacity 
            style={styles.addHikeButton}
            onPress={() => navigation.navigate('AddHike')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addHikeButtonText}>Add Hike with Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            mapType={mapType}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsTraffic={false}
            onRegionChangeComplete={setRegion}
          >
            {hikes.map((hike) => (
              <Marker
                key={hike.id}
                coordinate={hike.locationCoords}
                title={hike.name}
                description={`${hike.location} • ${hike.difficulty}`}
                pinColor={getDifficultyColor(hike.difficulty)}
                onPress={() => handleMarkerPress(hike)}
              />
            ))}
          </MapView>

          {/* Map Controls */}
          <View style={[styles.mapControls, { top: insets.top + 55 }]}>
            {/* Location Button */}
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={centerOnUserLocation}
            >
              <Ionicons name="locate" size={20} color="#1E6A65" />
            </TouchableOpacity>

            {/* Zoom to All Hikes */}
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={centerOnAllHikes}
            >
              <Ionicons name="search" size={20} color="#1E6A65" />
            </TouchableOpacity>

            {/* Map Type Toggle */}
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleMapType}
            >
              <Ionicons name={mapType === 'standard' ? 'map' : 'map-outline'} size={20} color="#1E6A65" />
            </TouchableOpacity>

            {/* Legend Toggle */}
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleLegend}
            >
              <Ionicons name={showLegend ? 'eye' : 'eye-off'} size={20} color="#1E6A65" />
            </TouchableOpacity>
          </View>

          {/* Legend */}
          {showLegend && (
            <View style={[styles.legend, { top: insets.top + 55 }]}>
              <Text style={styles.legendTitle}>Difficulty Legend</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Easy</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Moderate</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>Hard</Text>
              </View>
            </View>
          )}

          {/* Map Type Indicator */}
          <View style={[styles.mapTypeIndicator, { bottom: insets.bottom + 20, left: 10 }]}>
            <Text style={styles.mapTypeText}>
              {mapType === 'standard' ? 'Standard Map' : 'Satellite View'}
            </Text>
          </View>

          {/* Title Bar */}
          <View style={[styles.titleBar]}>
            <Text style={styles.titleText}>Hike Locations</Text>
            <Text style={styles.subtitleText}>
              {hikes.length} hike{hikes.length !== 1 ? 's' : ''} on map
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Info Bar */}
      {hikes.length > 0 && (
        <View style={[styles.infoBar]}>
          <Text style={styles.infoText}>
            Tap markers for hike details • {hikes.length} hikes visible
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E6A65',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  // Map Controls
  mapControls: {
    position: 'absolute',
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 5,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  // Legend
  legend: {
    position: 'absolute',
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 140,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  // Map Type Indicator
  mapTypeIndicator: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapTypeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  // Title Bar
  titleBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  // Info Bar
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E6A65',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 2,
    borderTopColor: '#0d4643ff',
  },
  infoText: {
    fontSize: 12,
    color: '#ffffffff',
    textAlign: 'center',
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
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
  addHikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E6A65',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addHikeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});