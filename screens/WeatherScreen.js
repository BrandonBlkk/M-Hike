import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const API_KEY = '6d5afd002c34b8a5ffce535140978ca3';

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      return location.coords;
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
      setLoading(false);
    }
  };

  // User's Weather
  const fetchWeatherData = async (coords) => {
    try {
      const { latitude, longitude } = coords;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }
      
      const data = await response.json();
      setWeatherData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search Weather
  const fetchWeatherByCity = async (cityName) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('City not found');
      }
      
      const data = await response.json();
      setWeatherData(data);
      setError(null);
      setSearchModalVisible(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      setError('City not found. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearching(false);
    }
  };

  const searchCities = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
    } finally {
      setSearching(false);
    }
  };

  const loadWeather = async () => {
    setLoading(true);
    const coords = await getLocation();
    if (coords) {
      await fetchWeatherData(coords);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentTime(new Date()); // Update time on refresh
    loadWeather();
  };

  useEffect(() => {
    loadWeather();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchCities(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const getWeatherIcon = (weatherMain) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return 'sunny';
      case 'clouds':
        return 'cloudy';
      case 'rain':
        return 'rainy';
      case 'drizzle':
        return 'rainy-outline';
      case 'thunderstorm':
        return 'thunderstorm';
      case 'snow':
        return 'snow';
      case 'mist':
      case 'fog':
        return 'cloudy-outline';
      default:
        return 'partly-sunny';
    }
  };

  // Get weather tips based on current conditions
  const getWeatherTips = () => {
    if (!weatherData || !weatherData.list[0]) return [];
    
    const currentWeather = weatherData.list[0];
    const weatherMain = currentWeather.weather[0].main.toLowerCase();
    const temp = currentWeather.main.temp;
    const humidity = currentWeather.main.humidity;
    const windSpeed = currentWeather.wind.speed;
    const visibility = currentWeather.visibility;
    
    const tips = [];

    // Temperature-based tips
    if (temp > 30) {
      tips.push({
        icon: 'water-outline',
        color: '#87CEEB',
        text: 'Stay hydrated - it\'s hot outside! Drink plenty of water.'
      });
    } else if (temp < 10) {
      tips.push({
        icon: 'thermometer-outline',
        color: '#ADD8E6',
        text: 'Dress warmly - temperatures are quite low today.'
      });
    }

    // Weather condition-based tips
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
      tips.push({
        icon: 'umbrella-outline',
        color: '#4682B4',
        text: 'Carry an umbrella - rain is expected throughout the day.'
      });
    }
    
    if (weatherMain.includes('thunderstorm')) {
      tips.push({
        icon: 'flash-outline',
        color: '#FFD700',
        text: 'Avoid outdoor activities - thunderstorms in the area.'
      });
    }
    
    if (weatherMain.includes('snow')) {
      tips.push({
        icon: 'snow-outline',
        color: '#F0F8FF',
        text: 'Drive carefully - roads may be slippery due to snow.'
      });
    }
    
    if (weatherMain.includes('clear')) {
      tips.push({
        icon: 'sunny-outline',
        color: '#FFD700',
        text: 'Perfect day for outdoor activities and vitamin D!'
      });
    }
    
    if (weatherMain.includes('clouds')) {
      tips.push({
        icon: 'cloud-outline',
        color: '#ffffffff',
        text: 'Partly cloudy - great weather for walking or light exercise.'
      });
    }

    // Humidity-based tips
    if (humidity > 80) {
      tips.push({
        icon: 'water-outline',
        color: '#5F9EA0',
        text: 'High humidity - stay cool and avoid strenuous activities.'
      });
    } else if (humidity < 30) {
      tips.push({
        icon: 'leaf-outline',
        color: '#90EE90',
        text: 'Low humidity - use moisturizer to protect your skin.'
      });
    }

    // Wind-based tips
    if (windSpeed > 6) {
      tips.push({
        icon: 'flag-outline',
        color: '#A9A9A9',
        text: 'Windy conditions - secure loose objects outdoors.'
      });
    }

    // UV/Visibility tips
    if (weatherMain.includes('clear') && temp > 20) {
      tips.push({
        icon: 'shield-checkmark-outline',
        color: '#90EE90',
        text: 'UV levels are high - sunscreen recommended when outdoors.'
      });
    }

    // Air quality/visibility tips
    if (visibility < 5000) {
      tips.push({
        icon: 'eye-outline',
        color: '#696969',
        text: 'Reduced visibility - be cautious if driving.'
      });
    }

    // Default tips
    if (tips.length < 3) {
      const defaultTips = [
        {
          icon: 'walk-outline',
          color: '#32CD32',
          text: 'Good day for a walk - enjoy the fresh air!'
        },
        {
          icon: 'cafe-outline',
          color: '#8B4513',
          text: 'Stay hydrated throughout the day.'
        },
        {
          icon: 'home-outline',
          color: '#FF69B4',
          text: 'Perfect weather to open windows and ventilate your home.'
        }
      ];
      
      // Add 3 default tips
      while (tips.length < 3) {
        const randomTip = defaultTips[Math.floor(Math.random() * defaultTips.length)];
        if (!tips.some(tip => tip.text === randomTip.text)) {
          tips.push(randomTip);
        }
      }
    }

    return tips.slice(0, 3); // Return max 3 tips
  };

  // Get dynamic additional info based on weather conditions
  const getAdditionalInfo = () => {
    if (!weatherData || !weatherData.list[0]) return [];
    
    const currentWeather = weatherData.list[0];
    const weatherMain = currentWeather.weather[0].main.toLowerCase();
    const temp = currentWeather.main.temp;
    const humidity = currentWeather.main.humidity;
    const windSpeed = currentWeather.wind.speed;
    const pressure = currentWeather.main.pressure;
    const visibility = currentWeather.visibility / 1000; // Convert to km

    // Calculate dynamic values based on weather conditions
    let steps = Math.floor(8000 + (Math.random() * 4000));
    let solar = (5 + (Math.random() * 3)).toFixed(1);
    let chance = Math.floor(10 + (Math.random() * 90));

    // Adjust values based on weather conditions
    if (weatherMain.includes('rain') || weatherMain.includes('thunderstorm')) {
      steps = Math.floor(3000 + (Math.random() * 3000));
      solar = (1 + (Math.random() * 2)).toFixed(1);
      chance = Math.floor(70 + (Math.random() * 30));
    } else if (weatherMain.includes('clear')) {
      steps = Math.floor(9000 + (Math.random() * 5000));
      solar = (6 + (Math.random() * 4)).toFixed(1);
      chance = Math.floor(10 + (Math.random() * 40));
    } else if (weatherMain.includes('clouds')) {
      steps = Math.floor(6000 + (Math.random() * 4000));
      solar = (3 + (Math.random() * 3)).toFixed(1);
      chance = Math.floor(30 + (Math.random() * 50));
    }

    // Adjust based on temperature
    if (temp > 30 || temp < 5) {
      steps = Math.floor(4000 + (Math.random() * 3000));
      chance = Math.floor(60 + (Math.random() * 40));
    }

    // Adjust based on wind speed
    if (windSpeed > 8) {
      steps = Math.floor(5000 + (Math.random() * 3000));
    }

    return [
      {
        value: steps.toLocaleString(),
        label: 'Steps',
        icon: 'footsteps-outline',
        description: steps > 8000 ? 'Active day!' : 'Moderate activity'
      },
      {
        value: `${solar}kW`,
        label: 'Solar',
        icon: 'sunny-outline',
        description: parseFloat(solar) > 6 ? 'Great generation' : 'Good generation'
      },
      {
        value: `${chance}%`,
        label: 'Outdoor',
        icon: 'walk-outline',
        description: chance > 70 ? 'Perfect for outdoors' : 'Good for outdoors'
      }
    ];
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  };

  // Format time (HH:MM)
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Format date (Wed May 26, 15:00)
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Group forecasts by day
  const groupForecastsByDay = (list) => {
    const grouped = {};
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  const getDailyForecast = (dailyData) => {
    const temps = dailyData.map(item => item.main.temp);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    
    // Get the most common weather condition for the day
    const weatherCount = {};
    dailyData.forEach(item => {
      const condition = item.weather[0].main;
      weatherCount[condition] = (weatherCount[condition] || 0) + 1;
    });
    
    const mainWeather = Object.keys(weatherCount).reduce((a, b) => 
      weatherCount[a] > weatherCount[b] ? a : b
    );

    return {
      maxTemp,
      minTemp,
      mainWeather,
      date: dailyData[0].dt_txt
    };
  };

  const handleSearchSelect = (city) => {
    setLoading(true);
    fetchWeatherByCity(city.name);
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchItem}
      onPress={() => handleSearchSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#666" />
      <View style={styles.searchItemText}>
        <Text style={styles.searchItemCity}>{item.name}</Text>
        <Text style={styles.searchItemCountry}>
          {item.state ? `${item.state}, ` : ''}{item.country}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#80BDE7" />
        <View style={styles.header}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>Loading location...</Text>
          </View>
          <Text style={styles.date}>{formatDate(currentTime)}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#80BDE7" />
        <View style={styles.header}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>Weather Forecast</Text>
          </View>
          <Text style={styles.date}>{formatDate(currentTime)}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#FFFFFF" />
          <Text style={styles.errorTitle}>Unable to Load Weather</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadWeather}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const groupedForecasts = groupForecastsByDay(weatherData.list);
  const dailyForecasts = Object.values(groupedForecasts).slice(0, 6);
  const weatherTips = getWeatherTips();
  const additionalInfo = getAdditionalInfo();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#80BDE7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>
            {weatherData.city.name}, {weatherData.city.country}
          </Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="search-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.date}>{formatDate(currentTime)}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
      >
        {/* Current Weather */}
        {weatherData.list[0] && (
          <View style={styles.currentWeather}>
            <View style={styles.currentWeatherMain}>
              <View style={styles.temperatureContainer}>
                <Text style={styles.currentTemp}>
                  {Math.round(weatherData.list[0].main.temp)}°
                </Text>
                <Text style={styles.feelsLike}>
                  Feels like {Math.round(weatherData.list[0].main.feels_like)}°
                </Text>
              </View>
              <View style={styles.weatherIconContainer}>
                <Ionicons 
                  name={getWeatherIcon(weatherData.list[0].weather[0].main)} 
                  size={80} 
                  color="#FFFFFF" 
                />
                <Text style={styles.weatherDescription}>
                  {weatherData.list[0].weather[0].description}
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={20} color="#FFFFFF" />
                <Text style={styles.detailValue}>{weatherData.list[0].main.humidity}%</Text>
                <Text style={styles.detailLabel}>Humidity</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="speedometer-outline" size={20} color="#FFFFFF" />
                <Text style={styles.detailValue}>{weatherData.list[0].main.pressure}</Text>
                <Text style={styles.detailLabel}>Pressure</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                <Text style={styles.detailValue}>
                  {Math.round(weatherData.list[0].wind.speed * 3.6)}
                </Text>
                <Text style={styles.detailLabel}>Wind km/h</Text>
              </View>
            </View>
          </View>
        )}

        {/* Hourly Forecast */}
        <View style={styles.hourlySection}>
          <Text style={styles.sectionTitle}>Today</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyScrollContent}
          >
            {weatherData.list.slice(0, 6).map((hour, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>
                  {index === 0 ? 'Now' : new Date(hour.dt * 1000).getHours() + ':00'}
                </Text>
                <Ionicons 
                  name={getWeatherIcon(hour.weather[0].main)} 
                  size={32} 
                  color="#FFFFFF" 
                />
                <Text style={styles.hourlyTemp}>{Math.round(hour.main.temp)}°</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 6-Day Forecast */}
        <View style={styles.forecastSection}>
          <Text style={styles.sectionTitle}>6-Day Forecast</Text>
          <View style={styles.forecastList}>
            {dailyForecasts.map((dayData, index) => {
              const dailyForecast = getDailyForecast(dayData);
              return (
                <View key={index} style={styles.forecastDay}>
                  <Text style={styles.forecastDayName}>
                    {getDayName(dailyForecast.date)}
                  </Text>
                  <View style={styles.forecastWeatherIcon}>
                    <Ionicons 
                      name={getWeatherIcon(dailyForecast.mainWeather)} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.forecastTempRange}>
                    <Text style={styles.tempMax}>{Math.round(dailyForecast.maxTemp)}°</Text>
                    <Text style={styles.tempMin}>{Math.round(dailyForecast.minTemp)}°</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Activity Insights</Text>
          <View style={styles.infoRow}>
            {additionalInfo.map((info, index) => (
              <View key={index} style={styles.infoItem}>
                <Ionicons name={info.icon} size={24} color="#FFFFFF" />
                <Text style={styles.infoValue}>{info.value}</Text>
                <Text style={styles.infoLabel}>{info.label}</Text>
                <Text style={styles.infoDescription}>{info.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weather Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Weather Tips</Text>
          <View style={styles.tipsList}>
            {weatherTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name={tip.icon} size={20} color={tip.color} />
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search City</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setSearchModalVisible(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter city name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searching && (
              <ActivityIndicator size="small" color="#80BDE7" />
            )}
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchItem}
            keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
            style={styles.searchResults}
            ListEmptyComponent={
              searchQuery.length >= 2 && !searching ? (
                <Text style={styles.noResults}>No cities found</Text>
              ) : null
            }
          />

          <TouchableOpacity 
            style={styles.useCurrentLocation}
            onPress={() => {
              setSearchModalVisible(false);
              loadWeather();
            }}
          >
            <Ionicons name="navigate" size={20} color="#80BDE7" />
            <Text style={styles.useCurrentLocationText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#80BDE7',
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  time: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationContainer: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 8,
  },
  searchButton: {
    padding: 4,
  },
  date: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.9,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#80BDE7',
    fontSize: 16,
    fontWeight: '600',
  },
  // Current Weather
  currentWeather: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  currentWeatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  temperatureContainer: {
    alignItems: 'flex-start',
  },
  currentTemp: {
    fontSize: 72,
    fontWeight: '200',
    color: '#FFFFFF',
    lineHeight: 80,
  },
  feelsLike: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  weatherIconContainer: {
    alignItems: 'center',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textTransform: 'capitalize',
    marginTop: 8,
    opacity: 0.9,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 6,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  // Hourly Section
  hourlySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  hourlyScrollContent: {
    paddingHorizontal: 15,
  },
  hourlyItem: {
    alignItems: 'center',
    marginHorizontal: 7,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    minWidth: 70,
  },
  hourlyTime: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.9,
  },
  hourlyTemp: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  // Forecast Section
  forecastSection: {
    marginBottom: 20,
  },
  forecastList: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  forecastDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  forecastDayName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  forecastWeatherIcon: {
    flex: 1,
    alignItems: 'center',
  },
  forecastTempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tempMax: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 30,
    textAlign: 'right',
  },
  tempMin: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    minWidth: 30,
    textAlign: 'right',
  },
  // Info Section
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    gap: 8,
  },
  infoItem: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
  // Tips Container
  tipsContainer: {
    marginBottom: 20,
  },
  tipsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    opacity: 0.9,
  },
  // Search Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchResults: {
    flex: 1,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchItemText: {
    marginLeft: 12,
    flex: 1,
  },
  searchItemCity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  searchItemCountry: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  useCurrentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  useCurrentLocationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#80BDE7',
    marginLeft: 8,
  },
});