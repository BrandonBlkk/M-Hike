import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import AddHikeScreen from './screens/AddHikeScreen';
import EditHikeScreen from './screens/EditHikeScreen';
import HikeListScreen from './screens/HikeListScreen';
import MapScreen from './screens/MapScreen';
import WeatherScreen from './screens/WeatherScreen';
import HikeDetailsScreen from './screens/HikeDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for HikeList
function HikeListStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HikeListMain" component={HikeListScreen} />
      <Stack.Screen name="EditHike" component={EditHikeScreen} />
      <Stack.Screen name="HikeDetails" component={HikeDetailsScreen} />
    </Stack.Navigator>
  );
}

// Stack navigator for Home to handle HikeDetails navigation
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="HikeDetails" component={HikeDetailsScreen} />
      <Stack.Screen name="EditHike" component={EditHikeScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={{
            tabBarActiveTintColor: '#1E6A65',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 0,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 8,
              paddingTop: 8,
              height: 90,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerShown: false,
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeStack}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen 
            name="HikeList" 
            component={HikeListStack}
            options={{
              tabBarLabel: 'My Hikes',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen 
            name="AddHike" 
            component={AddHikeScreen}
            options={{
              tabBarLabel: 'Add Hike',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="add-circle-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen 
            name="Map" 
            component={MapScreen}
            options={{
              tabBarLabel: 'Map',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="map-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen 
            name="Weather" 
            component={WeatherScreen}
            options={{
              tabBarLabel: 'Weather',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="partly-sunny-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}