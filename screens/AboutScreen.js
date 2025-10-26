import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>About Hike Tracker</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Description</Text>
          <Text style={styles.sectionText}>
            Hike Tracker is a mobile application designed to help outdoor enthusiasts 
            record and manage their hiking adventures. Keep track of your hikes with 
            detailed information including location, difficulty, weather conditions, 
            and personal notes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.feature}>• Record hike details and locations</Text>
          <Text style={styles.feature}>• Track hike length and difficulty</Text>
          <Text style={styles.feature}>• Add weather conditions and notes</Text>
          <Text style={styles.feature}>• Easy-to-use form interface</Text>
          <Text style={styles.feature}>• Bottom tab navigation for easy access</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version</Text>
          <Text style={styles.sectionText}>1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5F6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#666',
  },
  feature: {
    fontSize: 16,
    lineHeight: 22,
    color: '#666',
    marginBottom: 5,
  },
});