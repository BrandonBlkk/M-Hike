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
import { hikeRepository } from '../database/hikeRepository';
import { Ionicons } from '@expo/vector-icons';

export default function AddHikeScreen({ navigation }) {
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
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Use refs to maintain input focus
  const inputRefs = {
    name: React.useRef(null),
    location: React.useRef(null),
    length: React.useRef(null),
    description: React.useRef(null),
    notes: React.useRef(null),
    weather: React.useRef(null),
  };

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

  const clearAllInputs = () => {
    setHike({
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
    setErrors({});
  };

  const validateField = (field, value) => {
    let fieldError = null;
    
    switch (field) {
      case "name":
        if (!value.trim()) {
          fieldError = "Name of hike is required";
        } else if (value.trim().length < 2) {
          fieldError = "Hike name must be at least 2 characters long";
        } else if (!/^[a-zA-Z0-9\s\-_.,!()&]+$/.test(value.trim())) {
          fieldError = "Hike name can only contain letters, numbers, spaces, and basic punctuation";
        }
        break;
        
      case "location":
        if (!value.trim()) {
          fieldError = "Location is required";
        } else if (value.trim().length < 2) {
          fieldError = "Location must be at least 2 characters long";
        } else if (!/^[a-zA-Z0-9\s\-_,.()&]+$/.test(value.trim())) {
          fieldError = "Location can only contain letters, numbers, spaces, and basic punctuation";
        }
        break;
        
      case "date":
        if (!value) {
          fieldError = "Date is required";
        } else if (!(value instanceof Date) || isNaN(value.getTime())) {
          fieldError = "Invalid date format";
        } else if (value > new Date()) {
          fieldError = "Hike date cannot be in the future";
        } else if (value < new Date(2000, 0, 1)) {
          fieldError = "Hike date cannot be before year 2000";
        }
        break;
        
      case "parking":
        if (!value) {
          fieldError = "Please select parking availability";
        } 
        break;
        
      case "length":
        if (!value.trim()) {
          fieldError = "Length is required";
        } else if (isNaN(parseFloat(value))) {
          fieldError = "Length must be a valid number";
        } else if (parseFloat(value) <= 0) {
          fieldError = "Length must be greater than 0 km";
        } else if (parseFloat(value) < 0.1) {
          fieldError = "Length must be at least 0.1 km";
        } else if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          fieldError = "Length can have up to 2 decimal places (e.g., 5.25)";
        } else if (parseFloat(value).toString() !== value.trim()) {
          fieldError = "Please enter a valid number format";
        }
        break;
        
      case "difficulty":
        if (!value) {
          fieldError = "Please select difficulty level";
        }
        break;
        
      case "completed_date":
        if (hike.is_completed === 1) {
          if (!value) {
            fieldError = "Completed date is required for completed hikes";
          }
        }
        break;
        
      default:
        break;
    }

    return fieldError;
  };

  const handleChange = (field, value) => {
    setHike(prevHike => ({
      ...prevHike,
      [field]: value
    }));

    // Real-time error removal
    if (errors[field]) {
      const fieldError = validateField(field, value);
      if (!fieldError) {
        // Remove error if field is now valid
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      } else {
        // Update error message if still invalid but value changed
        setErrors(prevErrors => ({
          ...prevErrors,
          [field]: fieldError
        }));
      }
    }
  };

  const validateForm = () => {
    let newErrors = {};
    
    // Validate all fields
    const fieldsToValidate = [
      { field: "name", value: hike.name },
      { field: "location", value: hike.location },
      { field: "date", value: hike.date },
      { field: "parking", value: hike.parking },
      { field: "length", value: hike.length },
      { field: "difficulty", value: hike.difficulty },
      { field: "completed_date", value: hike.completed_date }
    ];

    fieldsToValidate.forEach(({ field, value }) => {
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await hikeRepository.createHike(hike);
      
      if (result.success) {
        Alert.alert(
          "Hike Submitted", 
          "Your hike has been successfully recorded!",
          [
            {
              text: "OK",
              onPress: () => {
                clearAllInputs();
                setIsSubmitting(false);
                setShowConfirmation(false);
                navigation.navigate('HikeList');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Error", 
          "Failed to save hike. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsSubmitting(false);
                setShowConfirmation(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error", 
        "An error occurred while saving the hike.",
        [
          {
            text: "OK",
            onPress: () => {
              setIsSubmitting(false);
              setShowConfirmation(false);
            }
          }
        ]
      );
    }
  };

  const handleEditDetails = () => {
    setShowConfirmation(false);
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
    const cleaned = text.replace(/[^0-9.]/g, '');
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
    } else if (!isCompleted) {
      // Remove completed_date error when switching to not completed
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors.completed_date;
        return newErrors;
      });
    }
  };

  const handleParkingChange = (itemValue) => {
    handleChange("parking", itemValue);
  };

  const handleDifficultyChange = (itemValue) => {
    handleChange("difficulty", itemValue);
  };

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

        handleChange('location', locationName);
        handleChange('locationCoords', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

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

  // Confirmation Screen Component
  const ConfirmationScreen = () => (
    <View style={styles.confirmationContainer}>
      <ScrollView style={styles.confirmationScrollView}>
        <View style={styles.confirmationHeader}>
          <Ionicons name="checkmark-circle" size={60} color="#1E6A65" />
          <Text style={styles.confirmationTitle}>Confirm Hike Details</Text>
          <Text style={styles.confirmationSubtitle}>
            Please review your hike information before saving
          </Text>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationSectionTitle}>Basic Information</Text>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Name:</Text>
            <Text style={styles.confirmationValue}>{hike.name}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Location:</Text>
            <Text style={styles.confirmationValue}>{hike.location}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Date:</Text>
            <Text style={styles.confirmationValue}>{hike.date.toDateString()}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Parking:</Text>
            <Text style={styles.confirmationValue}>{hike.parking}</Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationSectionTitle}>Hike Details</Text>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Length:</Text>
            <Text style={styles.confirmationValue}>{hike.length} km</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Route Type:</Text>
            <Text style={styles.confirmationValue}>{hike.route_type || "Not specified"}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Difficulty:</Text>
            <Text style={styles.confirmationValue}>{hike.difficulty}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Status:</Text>
            <Text style={styles.confirmationValue}>
              {hike.is_completed === 1 ? "Completed" : "Planned"}
            </Text>
          </View>

          {hike.is_completed === 1 && hike.completed_date && (
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Completed Date:</Text>
              <Text style={styles.confirmationValue}>{hike.completed_date.toDateString()}</Text>
            </View>
          )}
        </View>

        {hike.description && (
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>Description</Text>
            <Text style={styles.confirmationDescription}>{hike.description}</Text>
          </View>
        )}

        {hike.notes && (
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>Personal Notes</Text>
            <Text style={styles.confirmationDescription}>{hike.notes}</Text>
          </View>
        )}

        {hike.weather && (
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>Weather Conditions</Text>
            <Text style={styles.confirmationValue}>{hike.weather}</Text>
          </View>
        )}

        {hike.photos.length > 0 && (
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>
              Photos ({hike.photos.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.confirmationPhotos}>
                {hike.photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.confirmationPhoto} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.confirmationButtons}>
          <TouchableOpacity 
            style={[styles.confirmationButton, styles.editButton]}
            onPress={handleEditDetails}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={20} color="#1E6A65" />
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.confirmationButton, styles.saveButton]}
            onPress={handleConfirmSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="save" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>
              {isSubmitting ? "Saving..." : "Confirm & Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // Main Form Component - Using the same component structure without conditional rendering
  const renderMainForm = () => (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Green Background Section */}
      <View style={styles.greenBackground}>
        {/* Title Bar - Fixed with safe area handling */}
        <View style={[styles.titleBar]}>
          <Text style={styles.titleText}>Add New Hike</Text>
          <Text style={styles.subtitleText}>Enter your hike information</Text>
        </View>
      </View>

      {/* White Background Section for Form */}
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
              ref={inputRefs.name}
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter hike name"
              value={hike.name}
              onChangeText={(text) => handleChange("name", text)}
              maxLength={100}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name && <Text style={styles.error}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <View style={styles.locationContainer}>
              <TextInput
                ref={inputRefs.location}
                style={[styles.input, styles.locationInput, errors.location && styles.inputError]}
                placeholder="Enter location"
                value={hike.location}
                onChangeText={(text) => handleChange("location", text)}
                maxLength={100}
                autoCapitalize="words"
                returnKeyType="next"
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
                onValueChange={handleParkingChange}
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
              ref={inputRefs.length}
              style={[styles.input, errors.length && styles.inputError]}
              placeholder="Enter length in kilometers"
              value={hike.length}
              onChangeText={(text) => handleChange("length", formatLength(text))}
              keyboardType="decimal-pad"
              maxLength={6}
              returnKeyType="next"
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
                onValueChange={handleDifficultyChange}
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
              ref={inputRefs.description}
              style={[styles.input, styles.textArea]}
              placeholder="Describe your hike experience..."
              value={hike.description}
              onChangeText={(text) => handleChange("description", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Personal Notes</Text>
            <TextInput
              ref={inputRefs.notes}
              style={[styles.input, styles.textArea]}
              placeholder="Add any personal notes or observations..."
              value={hike.notes}
              onChangeText={(text) => handleChange("notes", text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weather Conditions</Text>
            <TextInput
              ref={inputRefs.weather}
              style={styles.input}
              placeholder="Describe the weather during your hike"
              value={hike.weather}
              onChangeText={(text) => handleChange("weather", text)}
              maxLength={100}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.button, isSubmitting && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Validating..." : "Review & Submit"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );

  // Render either the main form or confirmation screen
  return showConfirmation ? <ConfirmationScreen /> : renderMainForm();
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

  // Confirmation Screen Styles
  confirmationContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  confirmationScrollView: {
    flex: 1,
    padding: 16,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E6A65',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  confirmationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E6A65',
    marginBottom: 12,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    flex: 1,
  },
  confirmationValue: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  confirmationDescription: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
    textAlign: 'left',
  },
  confirmationCoordinates: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  confirmationPhotos: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmationPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  confirmationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#1E6A65',
  },
  saveButton: {
    backgroundColor: '#1E6A65',
  },
  editButtonText: {
    color: '#1E6A65',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});