import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PRESETS = [
  { label: '1 min',     seconds: 60,   icon: 'flash' },
  { label: '5 min',     seconds: 300,  icon: 'time' },
  { label: '10 min',    seconds: 600,  icon: 'timer' },
  { label: '15 min',    seconds: 900,  icon: 'alarm' },
  { label: '30 min',    seconds: 1800, icon: 'hourglass' },
  { label: 'Fajr (33)', seconds: 99,   icon: 'sunny' },
  { label: 'Zuhr (34)', seconds: 102,  icon: 'sunny-outline' },
  { label: 'Asr (34)',  seconds: 102,  icon: 'partly-sunny' },
] as const;

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function TimerScreen() {
  const [initialSeconds, setInitialSeconds] = useState(60);
  const [timerSeconds,   setTimerSeconds]   = useState(60);
  const [running,        setRunning]        = useState(false);
  const [customInput,    setCustomInput]    = useState('');
  const [showCustom,     setShowCustom]     = useState(false);

  useEffect(() => {
    if (!running || timerSeconds <= 0) {
      if (timerSeconds === 0) setRunning(false);
      return;
    }
    const id = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, timerSeconds]);

  const selectPreset = (s: number) => {
    setInitialSeconds(s);
    setTimerSeconds(s);
    setRunning(false);
  };

  const applyCustom = () => {
    const m = parseInt(customInput, 10);
    if (m > 0 && m <= 120) {
      selectPreset(m * 60);
      setCustomInput('');
      setShowCustom(false);
    }
  };

  const reset = () => {
    setRunning(false);
    setTimerSeconds(initialSeconds);
    setShowCustom(false);
    setCustomInput('');
  };

  const progress = initialSeconds > 0 ? (timerSeconds / initialSeconds) * 100 : 0;

  return (
    <LinearGradient colors={['#0B3D2E', '#1a5a47', '#0B3D2E']} style={styles.container}>
      <View style={[styles.blob, { left: 20, top: 20 }]} />
      <View style={[styles.blob, { right: 30, top: 40, opacity: 0.06 }]} />

      <View style={styles.header}>
        <Ionicons name="moon" size={28} color="#FFD700" />
        <Text style={styles.headerTitle}>Islamic Counter</Text>
      </View>

      <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.iconCircle}>
        <Ionicons name="alarm" size={44} color="#0B3D2E" />
      </LinearGradient>

      <Text style={styles.pageTitle}>Prayer Timer</Text>

      {/* Progress bar + time */}
      <View style={styles.timerTop}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.timeText}>{formatTime(timerSeconds)}</Text>
      </View>

      {/* Presets */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {PRESETS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.preset, timerSeconds === p.seconds && running === false && initialSeconds === p.seconds && styles.activePreset]}
              onPress={() => selectPreset(p.seconds)}
              activeOpacity={0.7}
            >
              <Ionicons name={p.icon as any} size={18} color={initialSeconds === p.seconds ? '#0B3D2E' : '#FFD700'} style={{ marginBottom: 4 }} />
              <Text style={[styles.presetLabel, initialSeconds === p.seconds && styles.activePresetLabel]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!showCustom ? (
          <TouchableOpacity style={styles.customBtn} onPress={() => setShowCustom(true)} activeOpacity={0.7}>
            <Ionicons name="create" size={18} color="#FFD700" />
            <Text style={styles.customBtnText}>Set Custom Time</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            <TextInput
              style={styles.input}
              placeholder="Minutes (1-120)"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              value={customInput}
              onChangeText={setCustomInput}
              maxLength={3}
            />
            <TouchableOpacity style={styles.setBtn} onPress={applyCustom} activeOpacity={0.7}>
              <Text style={styles.setBtnText}>Set</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCustom(false); setCustomInput(''); }} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Play / Pause */}
      <TouchableOpacity
        onPress={() => setRunning(r => !r)}
        disabled={timerSeconds === 0}
        activeOpacity={0.7}
        style={styles.bigBtn}
      >
        <LinearGradient colors={timerSeconds === 0 ? ['#aaa','#888'] : ['#FFD700','#FFA500']} style={styles.bigBtnGrad}>
          <Ionicons name={running ? 'pause' : 'play'} size={50} color="#0B3D2E" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.7}>
        <Ionicons name="refresh" size={18} color="#0B3D2E" />
        <Text style={styles.resetText}>Reset Timer</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  blob:            { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', opacity: 0.08 },
  header:          { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle:     { fontSize: 24, color: '#fff', fontWeight: '800', marginLeft: 10, letterSpacing: 0.4 },
  iconCircle:      { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 8 },
  pageTitle:       { fontSize: 24, color: '#fff', fontWeight: '700', marginBottom: 16, letterSpacing: 0.3 },
  timerTop:        { width: '100%', marginBottom: 16 },
  progressTrack:   { width: '100%', height: 8, backgroundColor: 'rgba(255,215,0,0.12)', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  progressFill:    { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  timeText:        { fontSize: 60, color: '#FFD700', fontWeight: '900', textAlign: 'center', letterSpacing: 3 },
  scroll:          { width: '100%', flexGrow: 0, maxHeight: 260, marginBottom: 12 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  preset:          { width: '30%', paddingVertical: 10, paddingHorizontal: 6, marginBottom: 10, backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.2)' },
  activePreset:    { backgroundColor: 'rgba(255,215,0,0.25)', borderColor: '#FFD700' },
  presetLabel:     { color: '#fff', fontSize: 11, fontWeight: '600' },
  activePresetLabel: { color: '#FFD700', fontWeight: '700' },
  customBtn:       { width: '100%', paddingVertical: 14, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)' },
  customBtnText:   { color: '#FFD700', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  input:           { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 16, fontWeight: '600' },
  setBtn:          { width: '100%', paddingVertical: 12, backgroundColor: '#FFD700', borderRadius: 10, alignItems: 'center' },
  setBtnText:      { color: '#0B3D2E', fontSize: 14, fontWeight: '700' },
  cancelBtn:       { width: '100%', paddingVertical: 10, borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)', borderRadius: 10, alignItems: 'center' },
  cancelBtnText:   { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  bigBtn:          { width: 110, height: 110, borderRadius: 55, elevation: 10 },
  bigBtnGrad:      { width: '100%', height: '100%', borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  resetBtn:        { marginTop: 18, backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 6 },
  resetText:       { color: '#0B3D2E', fontSize: 15, fontWeight: '700' },
});