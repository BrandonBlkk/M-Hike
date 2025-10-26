import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { databaseService } from '../database/databaseService';
import { Ionicons } from '@expo/vector-icons';

export default function AddHikeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [hike, setHike] = useState({
    name: "",
    location: "",
    date: new Date(),
    parking: "",
    length: "",
    difficulty: "",
    description: "",
    notes: "",
    weather: "",
    photos: [],
    locationCoords: null,
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHikeId, setEditingHikeId] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Handle edit mode when receiving hike data from navigation
  useEffect(() => {
    if (route.params?.editHike) {
      const hikeToEdit = route.params.editHike;
      setIsEditing(true);
      setEditingHikeId(hikeToEdit.id);
      setHike({
        name: hikeToEdit.name || "",
        location: hikeToEdit.location || "",
        date: new Date(hikeToEdit.date) || new Date(),
        parking: hikeToEdit.parking || "",
        length: hikeToEdit.length ? hikeToEdit.length.toString() : "",
        difficulty: hikeToEdit.difficulty || "",
        description: hikeToEdit.description || "",
        notes: hikeToEdit.notes || "",
        weather: hikeToEdit.weather || "",
        photos: hikeToEdit.photos || [],
        locationCoords: hikeToEdit.locationCoords || null,
      });
    }
  }, [route.params?.editHike]);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (locationStatus !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to automatically get your location.');
      }
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission needed', 'Camera and photo library permissions are required to add photos to your hikes.');
      }
    })();
  }, []);

  const clearAllInputs = () => {
    setHike({
      name: "",
      location: "",
      date: new Date(),
      parking: "",
      length: "",
      difficulty: "",
      description: "",
      notes: "",
      weather: "",
      photos: [],
      locationCoords: null,
    });
    setErrors({});
    setIsEditing(false);
    setEditingHikeId(null);
  };

  const handleChange = (field, value) => {
    setHike({ ...hike, [field]: value });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    let newErrors = {};
    if (!hike.name.trim()) newErrors.name = "Name of hike is required";
    if (!hike.location.trim()) newErrors.location = "Location is required";
    if (!hike.date) newErrors.date = "Date is required";
    if (!hike.parking) newErrors.parking = "Parking info is required";
    if (!hike.length.trim()) newErrors.length = "Length is required";
    else if (isNaN(parseFloat(hike.length)) || parseFloat(hike.length) <= 0) 
      newErrors.length = "Length must be a valid number";
    if (!hike.difficulty) newErrors.difficulty = "Difficulty is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        let result;
        if (isEditing) {
          // Update existing hike
          result = await databaseService.updateHike(editingHikeId, hike);
        } else {
          // Create new hike
          result = await databaseService.saveHike(hike);
        }
        
        if (result.success) {
          const successMessage = isEditing ? "Hike updated successfully!" : "Your hike has been successfully recorded!";
          Alert.alert(
            isEditing ? "Hike Updated" : "Hike Submitted", 
            successMessage,
            [
              {
                text: "OK",
                onPress: () => {
                  clearAllInputs();
                  setIsSubmitting(false);
                  
                  // Call the callback to refresh the list if it exists
                  if (route.params?.onHikeUpdated) {
                    route.params.onHikeUpdated();
                  }
                  
                  // Navigate back if editing
                  if (isEditing) {
                    navigation.goBack();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Error", 
            `Failed to ${isEditing ? 'update' : 'save'} hike. Please try again.`,
            [
              {
                text: "OK",
                onPress: () => setIsSubmitting(false)
              }
            ]
          );
        }
      } catch (error) {
        Alert.alert(
          "Error", 
          `An error occurred while ${isEditing ? 'updating' : 'saving'} the hike.`,
          [
            {
              text: "OK",
              onPress: () => setIsSubmitting(false)
            }
          ]
        );
      }
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || hike.date;
    setShowDatePicker(Platform.OS === "ios");
    handleChange("date", currentDate);
  };

  const formatLength = (text) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Enhanced location function that gets coordinates
  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = address.city || address.region || 'Current Location';
      
      // Store both location name and coordinates
      handleChange('location', locationName);
      handleChange('locationCoords', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setGettingLocation(false);
    }
  };

  // Photo Functions
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newPhotos = [...hike.photos, result.assets[0].uri];
        handleChange('photos', newPhotos);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newPhotos = [...hike.photos, result.assets[0].uri];
        handleChange('photos', newPhotos);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image from gallery");
    }
  };

  const removePhoto = (index) => {
    const newPhotos = hike.photos.filter((_, i) => i !== index);
    handleChange('photos', newPhotos);
  };

  return (
    <View style={styles.container}>
      {/* Title Bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>
          {isEditing ? "Edit Hike" : "Add New Hike"}
        </Text>
        <Text style={styles.subtitleText}>
          {isEditing ? "Update your hike details" : "Enter your hike information"}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/** Required Fields **/}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name of Hike *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter hike name"
            value={hike.name}
            onChangeText={(text) => handleChange("name", text)}
            maxLength={100}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.input, styles.locationInput, errors.location && styles.inputError]}
              placeholder="Enter location"
              value={hike.location}
              onChangeText={(text) => handleChange("location", text)}
              maxLength={100}
              autoCapitalize="words"
            />
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color="#1E6A65" />
              ) : (
                <Ionicons name="location" size={20} color="#1E6A65" />
              )}
            </TouchableOpacity>
          </View>
          {errors.location && <Text style={styles.error}>{errors.location}</Text>}
          {/* Show coordinates if available */}
          {hike.locationCoords && (
            <Text style={styles.coordinatesText}>
              📍 Coordinates: {hike.locationCoords.latitude.toFixed(6)}, {hike.locationCoords.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput, errors.date && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{hike.date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={hike.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          {errors.date && <Text style={styles.error}>{errors.date}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parking Available *</Text>
          <View style={[styles.pickerContainer, errors.parking && styles.inputError]}>
            <Picker
              selectedValue={hike.parking}
              onValueChange={(itemValue) => handleChange("parking", itemValue)}
            >
              <Picker.Item label="Select parking option" value="" />
              <Picker.Item label="Yes" value="Yes" />
              <Picker.Item label="No" value="No" />
            </Picker>
          </View>
          {errors.parking && <Text style={styles.error}>{errors.parking}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Length (km) *</Text>
          <TextInput
            style={[styles.input, errors.length && styles.inputError]}
            placeholder="Enter length in kilometers"
            value={hike.length}
            onChangeText={(text) => handleChange("length", formatLength(text))}
            keyboardType="decimal-pad"
            maxLength={6}
          />
          {errors.length && <Text style={styles.error}>{errors.length}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Difficulty Level *</Text>
          <View style={[styles.pickerContainer, errors.difficulty && styles.inputError]}>
            <Picker
              selectedValue={hike.difficulty}
              onValueChange={(itemValue) => handleChange("difficulty", itemValue)}
            >
              <Picker.Item label="Select difficulty level" value="" />
              <Picker.Item label="Easy" value="Easy" />
              <Picker.Item label="Moderate" value="Moderate" />
              <Picker.Item label="Hard" value="Hard" />
            </Picker>
          </View>
          {errors.difficulty && <Text style={styles.error}>{errors.difficulty}</Text>}
        </View>

        {/* Photo Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photos ({hike.photos.length})</Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="#1E6A65" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
              <Ionicons name="images" size={20} color="#1E6A65" />
              <Text style={styles.photoButtonText}>From Gallery</Text>
            </TouchableOpacity>
          </View>
          
          {hike.photos.length > 0 && (
            <View style={styles.photosContainer}>
              {hike.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Optional Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your hike experience..."
            value={hike.description}
            onChangeText={(text) => handleChange("description", text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Personal Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any personal notes or observations..."
            value={hike.notes}
            onChangeText={(text) => handleChange("notes", text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weather Conditions</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe the weather during your hike"
            value={hike.weather}
            onChangeText={(text) => handleChange("weather", text)}
            maxLength={100}
            autoCapitalize="sentences"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Hike" : "Add Hike")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  // Title Bar
  titleBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
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
  // Scroll View
  scrollView: {
    flex: 1,
    marginTop: 120, // Space for title bar
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4a5568",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  // Location Styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginRight: 8,
  },
  locationButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  // Coordinates text style
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Photo Styles
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    color: '#1E6A65',
    fontWeight: '500',
    fontSize: 14,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateInput: {
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#f44336",
    backgroundColor: "#fff",
  },
  error: {
    color: "#f44336",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#1E6A65",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 12,
    color: '#ffffffff',
    textAlign: 'center',
  },
});