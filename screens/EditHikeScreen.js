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
  Image,
  Switch
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { databaseService } from '../database/databaseService';
import { Ionicons } from '@expo/vector-icons';

export default function EditHikeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [hike, setHike] = useState({
    name: "",
    location: "",
    date: new Date(),
    parking: "",
    length: "",
    route_type: "",
    difficulty: "",
    description: "",
    notes: "",
    weather: "",
    photos: [],
    locationCoords: null,
    is_completed: 0,
    completed_date: null
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCompletedDatePicker, setShowCompletedDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [hikeId, setHikeId] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Get hike data from navigation params
  useEffect(() => {
    if (route.params?.hikeToEdit) {
      const hikeToEdit = route.params.hikeToEdit;
      setHikeId(hikeToEdit.id);
      setHike({
        name: hikeToEdit.name || "",
        location: hikeToEdit.location || "",
        date: new Date(hikeToEdit.date) || new Date(),
        parking: hikeToEdit.parking || "",
        length: hikeToEdit.length ? hikeToEdit.length.toString() : "",
        route_type: hikeToEdit.route_type || "",
        difficulty: hikeToEdit.difficulty || "",
        description: hikeToEdit.description || "",
        notes: hikeToEdit.notes || "",
        weather: hikeToEdit.weather || "",
        photos: hikeToEdit.photos || [],
        locationCoords: hikeToEdit.locationCoords || null,
        is_completed: hikeToEdit.is_completed || 0,
        completed_date: hikeToEdit.completed_date ? new Date(hikeToEdit.completed_date) : null
      });
    }
  }, [route.params?.hikeToEdit]);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (locationStatus === 'granted') {
        setLocationPermissionGranted(true);
      } else {
        Alert.alert(
          'Location Permission Needed', 
          'Location permission is required to automatically get your current location. Please enable it in settings.',
          [{ text: "OK" }]
        );
      }
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Photo Permission Needed', 
          'Camera and photo library permissions are required to add photos to your hikes.',
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

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
    if (hike.is_completed === 1 && !hike.completed_date) 
      newErrors.completed_date = "Completed date is required for completed hikes";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        // Update existing hike
        const result = await databaseService.updateHike(hikeId, hike);
        
        if (result.success) {
          Alert.alert(
            "Hike Updated", 
            "Hike updated successfully!",
            [
              {
                text: "OK",
                onPress: () => {
                  setIsSubmitting(false);
                  // Call the callback to refresh the list if it exists
                  if (route.params?.onHikeUpdated) {
                    route.params.onHikeUpdated();
                  }
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Error", 
            "Failed to update hike. Please try again.",
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
          "An error occurred while updating the hike.",
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

  const handleCompletedDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || hike.completed_date || new Date();
    setShowCompletedDatePicker(Platform.OS === "ios");
    handleChange("completed_date", currentDate);
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

  const toggleCompletedStatus = (value) => {
    const isCompleted = value ? 1 : 0;
    handleChange('is_completed', isCompleted);
    if (isCompleted && !hike.completed_date) {
      handleChange('completed_date', new Date());
    }
  };

  // Get Current Location
  const getCurrentLocation = async () => {
    if (!locationPermissionGranted) {
      Alert.alert(
        "Location Permission Required",
        "Please grant location permission in settings to use this feature.",
        [{ text: "OK" }]
      );
      return;
    }

    setGettingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        let locationName = '';

        if (address.city) {
          locationName = address.city;
          if (address.region) {
            locationName += `, ${address.region}`;
          }
        } else if (address.region) {
          locationName = address.region;
        } else if (address.subregion) {
          locationName = address.subregion;
        } else if (address.country) {
          locationName = address.country;
        } else {
          locationName = 'Current Location';
        }

        // Automatically set the location in the input field
        handleChange('location', locationName);
        handleChange('locationCoords', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Show success message
        Alert.alert(
          "Location Found",
          `Location set to: ${locationName}`,
          [
            {
              text: "OK",
              onPress: () => handleChange('location', locationName)
            }
          ]
        );
      } else {
        throw new Error("No address found for coordinates");
      }
    } catch (error) {
      Alert.alert(
        "Location Error",
        "Failed to get current location. Please make sure location services are enabled and try again.",
        [{ text: "OK" }]
      );
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.greenBackground}>
        {/* Title Bar */}
        <View style={[styles.titleBar]}>
          <Text style={styles.titleText}>Edit Hike</Text>
          <Text style={styles.subtitleText}>Update your hike details</Text>
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
            <Text style={styles.label}>Route Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={hike.route_type}
                onValueChange={(itemValue) => handleChange("route_type", itemValue)}
              >
                <Picker.Item label="Select route type" value="" />
                <Picker.Item label="Loop" value="Loop" />
                <Picker.Item label="Out & Back" value="Out & Back" />
                <Picker.Item label="Point to Point" value="Point to Point" />
                <Picker.Item label="Lollipop" value="Lollipop" />
              </Picker>
            </View>
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

          {/* Completion Status */}
          <View style={styles.inputGroup}>
            <View style={styles.completionContainer}>
              <View style={styles.completionLabel}>
                <Text style={styles.label}>Hike Completed</Text>
                <Text style={styles.completionSubtitle}>
                  {hike.is_completed ? 'Marked as completed' : 'Mark as planned'}
                </Text>
              </View>
              <Switch
                value={hike.is_completed === 1}
                onValueChange={toggleCompletedStatus}
                trackColor={{ false: '#f0f0f0', true: '#1E6A65' }}
                thumbColor={hike.is_completed ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {hike.is_completed === 1 && (
              <View style={styles.completedDateContainer}>
                <Text style={styles.label}>Completed Date *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, errors.completed_date && styles.inputError]}
                  onPress={() => setShowCompletedDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {hike.completed_date ? hike.completed_date.toDateString() : 'Select completed date'}
                  </Text>
                </TouchableOpacity>
                {showCompletedDatePicker && (
                  <DateTimePicker
                    value={hike.completed_date || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleCompletedDateChange}
                    maximumDate={new Date()}
                  />
                )}
                {errors.completed_date && <Text style={styles.error}>{errors.completed_date}</Text>}
              </View>
            )}
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
              {isSubmitting ? "Updating..." : "Update Hike"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3ff',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000ff',
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
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
  // Completion Status Styles
  completionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  completionLabel: {
    flex: 1,
  },
  completionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  completedDateContainer: {
    marginTop: 12,
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
});