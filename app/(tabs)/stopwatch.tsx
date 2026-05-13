import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function StopwatchScreen() {
  const [seconds, setSeconds]   = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const reset = () => { setSeconds(0); setIsRunning(false); };

  return (
    <LinearGradient colors={['#0B3D2E', '#1a5a47', '#0B3D2E']} style={styles.container}>
      <View style={[styles.blob, { left: 20, top: 20 }]} />
      <View style={[styles.blob, { right: 30, top: 40, opacity: 0.06 }]} />

      <View style={styles.header}>
        <Ionicons name="moon" size={28} color="#FFD700" />
        <Text style={styles.headerTitle}>Islamic Counter</Text>
      </View>

      <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.iconCircle}>
        <Ionicons name="time" size={44} color="#0B3D2E" />
      </LinearGradient>

      <Text style={styles.pageTitle}>Stopwatch</Text>

      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{formatTime(seconds)}</Text>
      </View>

      {/* Play / Pause */}
      <TouchableOpacity onPress={() => setIsRunning(r => !r)} activeOpacity={0.7} style={styles.bigBtn}>
        <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.bigBtnGrad}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={50} color="#0B3D2E" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.7}>
        <Ionicons name="refresh" size={18} color="#0B3D2E" />
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  blob:        { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', opacity: 0.08 },
  header:      { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 24, color: '#fff', fontWeight: '800', marginLeft: 10, letterSpacing: 0.4 },
  iconCircle:  { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 14, elevation: 8 },
  pageTitle:   { fontSize: 24, color: '#fff', fontWeight: '700', marginBottom: 24, letterSpacing: 0.3 },
  timeBox:     { width: '100%', marginBottom: 32, paddingVertical: 28, backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,215,0,0.2)' },
  timeText:    { fontSize: 64, color: '#FFD700', fontWeight: '900', textAlign: 'center', letterSpacing: 3 },
  bigBtn:      { width: 110, height: 110, borderRadius: 55, elevation: 10 },
  bigBtnGrad:  { width: '100%', height: '100%', borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  resetBtn:    { marginTop: 24, backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 6 },
  resetText:   { color: '#0B3D2E', fontSize: 15, fontWeight: '700' },
});