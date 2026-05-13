import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const tasbeehList = [
  { name: 'SubhanAllah',        translation: 'Glory be to Allah' },
  { name: 'Alhamdulillah',      translation: 'All praise to Allah' },
  { name: 'Allahu Akbar',       translation: 'Allah is Greatest' },
  { name: 'La ilaha illa Allah', translation: 'There is no god but Allah' },
];

export default function TasbeehScreen() {
  const [count, setCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState(tasbeehList[0]);
  const [showDropdown, setShowDropdown] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.reset();
  }, []);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80,  useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const increaseCounter = () => { animateButton(); setCount(c => c + 1); };
  const resetCounter    = () => { setCount(0); setShowDropdown(false); };

  return (
    <LinearGradient colors={['#0B3D2E', '#1a5a47', '#0B3D2E']} style={styles.container}>
      {/* Decorative blobs */}
      <View style={[styles.blob, { left: 20,  top: 20 }]} />
      <View style={[styles.blob, { right: 30, top: 40, opacity: 0.06 }]} />

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="moon" size={28} color="#FFD700" />
        <Text style={styles.headerTitle}>Islamic Counter</Text>
      </View>

      {/* Icon */}
      <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.iconCircle}>
        <Ionicons name="sparkles" size={44} color="#0B3D2E" />
      </LinearGradient>

      <Text style={styles.pageTitle}>Dhikr Counter</Text>

      {/* Dropdown trigger */}
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(v => !v)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dropdownText}>{selectedDhikr.name}</Text>
          <Text style={styles.dropdownSub}>{selectedDhikr.translation}</Text>
        </View>
        <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#FFD700" />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdownMenu}>
          {tasbeehList.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dropdownItem, selectedDhikr.name === item.name && styles.selectedItem]}
              onPress={() => { setSelectedDhikr(item); setShowDropdown(false); }}
            >
              <View>
                <Text style={styles.dropdownItemText}>{item.name}</Text>
                <Text style={styles.dropdownItemSub}>{item.translation}</Text>
              </View>
              {selectedDhikr.name === item.name && (
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Counter display */}
      <Animated.View style={[styles.counterBox, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient colors={['rgba(255,215,0,0.1)', 'rgba(255,165,0,0.05)']} style={styles.counterGrad}>
          <Text style={styles.counterText}>{count}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Big tap button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={increaseCounter} activeOpacity={0.7} style={styles.bigBtn}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.bigBtnGrad}>
            <Ionicons name="add" size={50} color="#0B3D2E" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetBtn} onPress={resetCounter} activeOpacity={0.7}>
        <Ionicons name="refresh" size={18} color="#0B3D2E" />
        <Text style={styles.resetText}>Reset Counter</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  blob:         { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', opacity: 0.08 },
  header:       { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerTitle:  { fontSize: 24, color: '#fff', fontWeight: '800', marginLeft: 10, letterSpacing: 0.4 },
  iconCircle:   { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 14, elevation: 8 },
  pageTitle:    { fontSize: 24, color: '#fff', fontWeight: '700', marginBottom: 20, letterSpacing: 0.3 },
  dropdown:     { width: '100%', backgroundColor: 'rgba(20,90,70,0.8)', padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  dropdownText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  dropdownSub:  { color: '#ccc', fontSize: 12, marginTop: 2 },
  dropdownMenu: { width: '100%', backgroundColor: 'rgba(11,61,46,0.97)', borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,215,0,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedItem: { backgroundColor: 'rgba(255,215,0,0.1)' },
  dropdownItemText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dropdownItemSub:  { color: '#aaa', fontSize: 12, marginTop: 2 },
  counterBox:   { width: '100%', marginVertical: 16 },
  counterGrad:  { borderRadius: 16, padding: 20, borderWidth: 2, borderColor: 'rgba(255,215,0,0.3)' },
  counterText:  { fontSize: 72, color: '#FFD700', fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  bigBtn:       { width: 110, height: 110, borderRadius: 55, elevation: 10 },
  bigBtnGrad:   { width: '100%', height: '100%', borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  resetBtn:     { marginTop: 18, backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 6 },
  resetText:    { color: '#0B3D2E', fontSize: 15, fontWeight: '700' },
});