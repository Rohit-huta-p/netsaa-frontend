import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function ArtistsPlaceholder() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.heading}>Artists browse</Text>
        <Text style={styles.body}>Ships in Plan 3 — browse and shortlist performers.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  heading: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: '#F5F0EB', marginBottom: 12 },
  body: { fontFamily: 'Outfit-Regular', fontSize: 14, color: 'rgba(245, 240, 235, 0.6)', textAlign: 'center', lineHeight: 22 },
});
