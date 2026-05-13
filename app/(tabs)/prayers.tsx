/**
 * app/(tabs)/prayers.tsx
 *
 * Dependencies (add if not already installed):
 *   npx expo install expo-notifications
 *   npx expo install @react-native-async-storage/async-storage
 *   npx expo install expo-av
 *
 * In app/_layout.tsx add once at startup:
 *   import * as Notifications from 'expo-notifications';
 *   import { Audio } from 'expo-av';
 *
 *   Notifications.setNotificationHandler({
 *     handleNotification: async () => ({
 *       shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
 *     }),
 *   });
 *
 * ── Custom sounds setup (required for iOS & Android) ────────────────────────
 *
 * iOS:
 *   Copy alarm.wav, azan1.mp3, diig.wav into your Xcode project under
 *   the main bundle (drag into the project navigator, check "Copy items if needed").
 *   In app.json add:
 *     "ios": { "infoPlist": { "UIBackgroundModes": ["audio"] } }
 *
 * Android:
 *   Copy the three files into android/app/src/main/res/raw/
 *     alarm.wav  → res/raw/alarm.wav
 *     azan1.mp3  → res/raw/azan1.mp3 (or azan1.mp3 — keep lowercase, no spaces)
 *     diig.wav   → res/raw/diig.wav
 *   In app.json add under "android":
 *     "notification": { "sound": "azan1.mp3" }
 *
 * expo-notifications will then reference these files by name in the trigger.
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

/* ─────────────────────────────────────────────
   CUSTOM SOUND ASSETS
   Mapped to files in /assets/
───────────────────────────────────────────── */
const SOUND_ASSETS: Record<string, any> = {
  azan:  require('../../assets/azan1.mp3'),
  alarm: require('../../assets/alarm.wav'),
  diig:  require('../../assets/diig.wav'),
};

// File names as registered in iOS bundle / Android res/raw
const SOUND_FILE_NAMES: Record<string, string> = {
  azan:  'azan1.mp3',
  alarm: 'alarm.wav',
  diig:  'diig.wav',
};

/* ─────────────────────────────────────────────
   PRAYER DATA
───────────────────────────────────────────── */
const PRAYERS = [
  {
    id: 'fajr',
    nameEn: 'Fajr',
    nameAr: 'الفجر',
    icon: 'partly-sunny-outline' as const,
    accent: '#7EB8C9',
    defaultH: 5,
    defaultM: 0,
    period: 'Dawn',
  },
  {
    id: 'dhuhr',
    nameEn: 'Dhuhr',
    nameAr: 'الظهر',
    icon: 'sunny' as const,
    accent: '#F0C060',
    defaultH: 12,
    defaultM: 30,
    period: 'Midday',
  },
  {
    id: 'asr',
    nameEn: 'Asr',
    nameAr: 'العصر',
    icon: 'partly-sunny' as const,
    accent: '#E8A050',
    defaultH: 15,
    defaultM: 45,
    period: 'Afternoon',
  },
  {
    id: 'maghrib',
    nameEn: 'Maghrib',
    nameAr: 'المغرب',
    icon: 'moon-outline' as const,
    accent: '#C9A84C',
    defaultH: 18,
    defaultM: 20,
    period: 'Sunset',
  },
  {
    id: 'isha',
    nameEn: 'Isha',
    nameAr: 'العشاء',
    icon: 'moon' as const,
    accent: '#9B8EC4',
    defaultH: 20,
    defaultM: 0,
    period: 'Night',
  },
];

// NotifType now maps directly to our three sound assets + silent
type NotifType = 'azan' | 'alarm' | 'diig' | 'silent';

interface PrayerSetting {
  hour: number;
  minute: number;
  enabled: boolean;
  notifType: NotifType;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function fmt12(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return { time: `${hh}:${String(m).padStart(2, '0')}`, ampm };
}

function minutesFromNow(h: number, m: number): number {
  const now = new Date();
  const totalNow = now.getHours() * 60 + now.getMinutes();
  const totalPrayer = h * 60 + m;
  const diff = totalPrayer - totalNow;
  return diff < 0 ? diff + 1440 : diff;
}

function fmtCountdown(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function getNextPrayer(settings: Record<string, PrayerSetting>) {
  let minMins = Infinity;
  let nextId = '';
  for (const p of PRAYERS) {
    const s = settings[p.id];
    if (!s || !s.enabled) continue;
    const diff = minutesFromNow(s.hour, s.minute);
    if (diff < minMins) {
      minMins = diff;
      nextId = p.id;
    }
  }
  return { id: nextId, minsAway: minMins };
}

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/* ─────────────────────────────────────────────
   AUDIO PREVIEW — plays the chosen sound
   so the user hears it before confirming
───────────────────────────────────────────── */
let previewSound: Audio.Sound | null = null;

async function playPreview(type: NotifType) {
  if (type === 'silent') return;
  try {
    if (previewSound) {
      await previewSound.unloadAsync();
      previewSound = null;
    }
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
    });
    const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[type]);
    previewSound = sound;
    await sound.playAsync();
    // auto-unload after 6 s to avoid lingering playback
    setTimeout(async () => {
      try { await sound.unloadAsync(); } catch {}
      if (previewSound === sound) previewSound = null;
    }, 6000);
  } catch (e) {
    console.warn('Audio preview error:', e);
  }
}

async function stopPreview() {
  try {
    if (previewSound) {
      await previewSound.stopAsync();
      await previewSound.unloadAsync();
      previewSound = null;
    }
  } catch {}
}

/* ─────────────────────────────────────────────
   NOTIFICATION SCHEDULING
───────────────────────────────────────────── */
async function schedulePrayerNotification(
  prayerId: string,
  nameEn: string,
  nameAr: string,
  hour: number,
  minute: number,
  notifType: NotifType
) {
  // Cancel any existing notification for this prayer
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of allScheduled) {
    if ((n.content.data as any)?.prayerId === prayerId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const titleMap: Record<NotifType, string> = {
    azan:   `🕌 Adhan — ${nameEn}`,
    alarm:  `⏰ Prayer Time — ${nameEn}`,
    diig:   `🔔 ${nameEn} Prayer`,
    silent: `${nameAr} — ${nameEn}`,
  };
  const bodyMap: Record<NotifType, string> = {
    azan:   `${nameAr} | It's time for ${nameEn} prayer`,
    alarm:  `${nameAr} | Time for ${nameEn} prayer`,
    diig:   `${nameAr} | ${nameEn} prayer time has arrived`,
    silent: `${nameAr} | ${nameEn} prayer time`,
  };

  // Resolve the sound file name for native layers
  // On iOS the file must be in the app bundle; on Android in res/raw/
  const soundFile = notifType !== 'silent' ? SOUND_FILE_NAMES[notifType] : undefined;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titleMap[notifType],
      body:  bodyMap[notifType],
      // Pass the filename — expo-notifications uses this for the native channel / iOS bundle
      sound: soundFile ?? undefined,
      data:  { prayerId },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as any,
  });
}

async function cancelPrayerNotification(prayerId: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if ((n.content.data as any)?.prayerId === prayerId) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/* ─────────────────────────────────────────────
   DRUM-WHEEL TIME PICKER MODAL
───────────────────────────────────────────── */
const ITEM_H = 52;
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function DrumColumn({
  items,
  selected,
  onSelect,
  format,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selected * ITEM_H, animated: false });
  }, [selected]);

  return (
    <View style={pickerStyles.column}>
      <View style={pickerStyles.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          onSelect(items[Math.max(0, Math.min(idx, items.length - 1))]);
        }}
      >
        {items.map((v) => (
          <TouchableOpacity
            key={v}
            style={[pickerStyles.item, selected === v && pickerStyles.itemActive]}
            onPress={() => {
              onSelect(v);
              scrollRef.current?.scrollTo({ y: v * ITEM_H, animated: true });
            }}
            activeOpacity={0.7}
          >
            <Text style={[pickerStyles.itemText, selected === v && pickerStyles.itemTextActive]}>
              {format(v)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  column: {
    width: 90,
    height: ITEM_H * 5,
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201,168,76,0.5)',
    borderRadius: 8,
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {},
  itemText: {
    fontSize: 28,
    color: 'rgba(245,237,212,0.3)',
    fontWeight: '700',
  },
  itemTextActive: {
    color: '#F0D080',
    fontSize: 34,
  },
});

/* ─────────────────────────────────────────────
   NOTIF TYPE OPTIONS  — now using our 3 assets
───────────────────────────────────────────── */
const NOTIF_OPTIONS: { type: NotifType; label: string; icon: string }[] = [
  { type: 'azan',   label: 'Azan',   icon: 'volume-high'         },
  { type: 'alarm',  label: 'Alarm',  icon: 'notifications'       },
  { type: 'diig',   label: 'Diig',   icon: 'musical-notes'       },
  { type: 'silent', label: 'Silent', icon: 'notifications-off'   },
];

/* ─────────────────────────────────────────────
   PRAYER CARD
───────────────────────────────────────────── */
function PrayerCard({
  prayer,
  setting,
  isNext,
  minsAway,
  onTimePress,
  onToggle,
  onNotifType,
  enterAnim,
}: {
  prayer: typeof PRAYERS[0];
  setting: PrayerSetting;
  isNext: boolean;
  minsAway: number;
  onTimePress: () => void;
  onToggle: () => void;
  onNotifType: (t: NotifType) => void;
  enterAnim: Animated.Value;
}) {
  const { time, ampm } = fmt12(setting.hour, setting.minute);
  const translateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <Animated.View style={{ opacity: enterAnim, transform: [{ translateY }] }}>
      <View style={[cardStyles.card, isNext && cardStyles.cardNext]}>
        {isNext && (
          <LinearGradient
            colors={[prayer.accent + '40', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={cardStyles.nextStrip}
          />
        )}

        <View style={[cardStyles.accentBar, { backgroundColor: prayer.accent }]} />

        <View style={cardStyles.cardBody}>
          {/* row 1 — name + toggle */}
          <View style={cardStyles.row}>
            <View style={[cardStyles.iconBox, { backgroundColor: prayer.accent + '22', borderColor: prayer.accent + '44' }]}>
              <Ionicons name={prayer.icon} size={20} color={prayer.accent} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={cardStyles.nameAr}>{prayer.nameAr}</Text>
                {isNext && (
                  <View style={[cardStyles.nextBadge, { backgroundColor: prayer.accent + '33', borderColor: prayer.accent + '66' }]}>
                    <Text style={[cardStyles.nextBadgeText, { color: prayer.accent }]}>
                      Next · {fmtCountdown(minsAway)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={cardStyles.nameEn}>{prayer.nameEn} <Text style={cardStyles.period}>· {prayer.period}</Text></Text>
            </View>

            <TouchableOpacity
              onPress={onToggle}
              style={[
                cardStyles.toggleBtn,
                setting.enabled
                  ? { backgroundColor: prayer.accent + '33', borderColor: prayer.accent }
                  : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={setting.enabled ? 'notifications' : 'notifications-off-outline'}
                size={16}
                color={setting.enabled ? prayer.accent : 'rgba(255,255,255,0.3)'}
              />
            </TouchableOpacity>
          </View>

          {/* row 2 — time + notif type */}
          <View style={[cardStyles.row, { marginTop: 12, alignItems: 'center' }]}>
            <TouchableOpacity
              onPress={onTimePress}
              activeOpacity={0.8}
              style={cardStyles.timeBtn}
            >
              <LinearGradient
                colors={setting.enabled
                  ? [prayer.accent + '28', prayer.accent + '12']
                  : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={cardStyles.timeBtnInner}
              >
                <Text style={[cardStyles.timeText, !setting.enabled && { opacity: 0.4 }]}>{time}</Text>
                <Text style={[cardStyles.ampm, !setting.enabled && { opacity: 0.4 }]}>{ampm}</Text>
                <Ionicons name="pencil" size={12} color={setting.enabled ? prayer.accent : 'rgba(255,255,255,0.3)'} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>

            {setting.enabled && (
              <View style={cardStyles.notifRow}>
                {NOTIF_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => onNotifType(opt.type)}
                    style={[
                      cardStyles.notifPill,
                      setting.notifType === opt.type && {
                        backgroundColor: prayer.accent + '33',
                        borderColor: prayer.accent,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={12}
                      color={setting.notifType === opt.type ? prayer.accent : 'rgba(255,255,255,0.35)'}
                    />
                    <Text style={[
                      cardStyles.notifPillText,
                      setting.notifType === opt.type && { color: prayer.accent },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardNext: {
    borderColor: 'rgba(201,168,76,0.25)',
  },
  nextStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    margin: 12,
    marginRight: 0,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameAr: {
    fontSize: 18,
    color: '#F5EDD4',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nameEn: {
    fontSize: 12,
    color: 'rgba(245,237,212,0.5)',
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  period: {
    fontWeight: '400',
    color: 'rgba(245,237,212,0.35)',
  },
  nextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  timeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeText: {
    fontSize: 22,
    color: '#F5EDD4',
    fontWeight: '900',
    letterSpacing: 1,
  },
  ampm: {
    fontSize: 11,
    color: 'rgba(245,237,212,0.55)',
    fontWeight: '700',
    marginLeft: 5,
    marginTop: 4,
  },
  notifRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  notifPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  notifPillText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
  },
});

/* ─────────────────────────────────────────────
   GEOMETRIC ACCENT
───────────────────────────────────────────── */
function HexAccent({ style }: { style?: object }) {
  return (
    <View style={[{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }, style]} pointerEvents="none">
      {[0, 30, 60].map((deg) => (
        <View
          key={deg}
          style={{
            position: 'absolute',
            width: 52,
            height: 52,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.12)',
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
export default function PrayersScreen() {
  const initSettings = (): Record<string, PrayerSetting> => {
    const s: Record<string, PrayerSetting> = {};
    for (const p of PRAYERS) {
      s[p.id] = { hour: p.defaultH, minute: p.defaultM, enabled: true, notifType: 'azan' };
    }
    return s;
  };

  const [settings, setSettings]           = useState<Record<string, PrayerSetting>>(initSettings);
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [draftH, setDraftH]               = useState(0);
  const [draftM, setDraftM]               = useState(0);
  const [draftNotif, setDraftNotif]       = useState<NotifType>('azan');
  const [now, setNow]                     = useState(new Date());
  const [hasPermission, setHasPermission] = useState(false);

  // card enter anims
  const enterAnims = useRef(PRAYERS.map(() => new Animated.Value(0))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    requestPermissions().then(setHasPermission);

    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ...enterAnims.map(a => Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    const tick = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearInterval(tick);
      stopPreview();
    };
  }, []);

  // In-app audio listener — plays the chosen sound when the notification fires
  // while the app is in the foreground
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(async (notification) => {
      const prayerId = (notification.request.content.data as any)?.prayerId as string | undefined;
      if (!prayerId) return;
      const s = settings[prayerId];
      if (s?.enabled && s.notifType !== 'silent') {
        await playPreview(s.notifType);
      }
    });
    return () => sub.remove();
  }, [settings]);

  const { id: nextId, minsAway } = getNextPrayer(settings);
  const nextPrayer = PRAYERS.find(p => p.id === nextId);

  /* ── Open picker ── */
  const openPicker = useCallback((id: string) => {
    const s = settings[id];
    setDraftH(s.hour);
    setDraftM(s.minute);
    setDraftNotif(s.notifType);
    setEditingId(id);
    setPickerOpen(true);
  }, [settings]);

  /* ── Sound pill pressed inside picker — preview it ── */
  const handleDraftNotifChange = useCallback(async (type: NotifType) => {
    setDraftNotif(type);
    await stopPreview();
    await playPreview(type);
  }, []);

  /* ── Confirm picker ── */
  const confirmTime = useCallback(async () => {
    if (!editingId) return;
    await stopPreview();
    const updated: PrayerSetting = {
      ...settings[editingId],
      hour: draftH,
      minute: draftM,
      notifType: draftNotif,
    };
    setSettings(prev => ({ ...prev, [editingId]: updated }));
    setPickerOpen(false);

    if (updated.enabled && hasPermission) {
      const prayer = PRAYERS.find(p => p.id === editingId)!;
      await schedulePrayerNotification(
        editingId, prayer.nameEn, prayer.nameAr,
        draftH, draftM, draftNotif
      );
    }
  }, [editingId, draftH, draftM, draftNotif, settings, hasPermission]);

  const closePicker = useCallback(async () => {
    await stopPreview();
    setPickerOpen(false);
  }, []);

  /* ── Toggle prayer on/off ── */
  const togglePrayer = useCallback(async (id: string) => {
    const s = settings[id];
    const updated = { ...s, enabled: !s.enabled };
    setSettings(prev => ({ ...prev, [id]: updated }));

    if (updated.enabled && hasPermission) {
      const prayer = PRAYERS.find(p => p.id === id)!;
      await schedulePrayerNotification(id, prayer.nameEn, prayer.nameAr, updated.hour, updated.minute, updated.notifType);
    } else {
      await cancelPrayerNotification(id);
    }
  }, [settings, hasPermission]);

  /* ── Change notif type directly from card ── */
  const changeNotifType = useCallback(async (id: string, type: NotifType) => {
    const s = settings[id];
    const updated = { ...s, notifType: type };
    setSettings(prev => ({ ...prev, [id]: updated }));

    // Brief audio preview so the user hears the new sound immediately
    await stopPreview();
    await playPreview(type);

    if (updated.enabled && hasPermission) {
      const prayer = PRAYERS.find(p => p.id === id)!;
      await schedulePrayerNotification(id, prayer.nameEn, prayer.nameAr, updated.hour, updated.minute, type);
    }
  }, [settings, hasPermission]);

  const editingPrayer = PRAYERS.find(p => p.id === editingId);

  const clockH = now.getHours();
  const clockM = now.getMinutes();
  const { time: clockTime, ampm: clockAmpm } = fmt12(clockH, clockM);

  return (
    <LinearGradient
      colors={['#061A10', '#0A2E1E', '#0D3B27', '#0A2E1E', '#061A10']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.container}
    >
      {/* ambient orbs */}
      <View style={[styles.orb, { width: 260, height: 260, top: -80, left: -80, backgroundColor: '#1B6B44' }]} />
      <View style={[styles.orb, { width: 200, height: 200, bottom: 100, right: -60, backgroundColor: '#C9A84C' }]} />

      <HexAccent style={{ position: 'absolute', top: 80, right: 20, opacity: 0.5 }} />
      <HexAccent style={{ position: 'absolute', bottom: 120, left: 10, opacity: 0.4 }} />

      <View style={styles.borderL} />
      <View style={styles.borderR} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <Animated.View style={{ opacity: headerAnim }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Prayer Times</Text>
              <Text style={styles.headerAr}>أوقات الصلاة</Text>
            </View>
            <View style={styles.clockBox}>
              <Text style={styles.clockTime}>{clockTime}</Text>
              <Text style={styles.clockAmpm}>{clockAmpm}</Text>
            </View>
          </View>

          {nextPrayer && (
            <LinearGradient
              colors={[nextPrayer.accent + '22', nextPrayer.accent + '0A', 'rgba(255,255,255,0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.nextHero, { borderColor: nextPrayer.accent + '44' }]}
            >
              <View style={styles.nextHeroLeft}>
                <Text style={styles.nextLabel}>Next Prayer</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.nextName, { color: nextPrayer.accent }]}>{nextPrayer.nameEn}</Text>
                  <Text style={styles.nextNameAr}>{nextPrayer.nameAr}</Text>
                </View>
                <Animated.View style={{ opacity: glowAnim }}>
                  <Text style={styles.nextCountdown}>in {fmtCountdown(minsAway)}</Text>
                </Animated.View>
              </View>
              <View style={[styles.nextIconCircle, { backgroundColor: nextPrayer.accent + '22', borderColor: nextPrayer.accent + '55' }]}>
                <Ionicons name={nextPrayer.icon} size={32} color={nextPrayer.accent} />
              </View>
            </LinearGradient>
          )}

          {!hasPermission && (
            <View style={styles.permWarn}>
              <Ionicons name="warning-outline" size={16} color="#E8A050" />
              <Text style={styles.permWarnText}>
                Enable notifications to receive prayer reminders
              </Text>
            </View>
          )}

          <View style={styles.sectionDivider}>
            <View style={styles.divLine} />
            <Text style={styles.divLabel}>Daily Prayers</Text>
            <View style={styles.divLine} />
          </View>
        </Animated.View>

        {/* ── Prayer Cards ── */}
        {PRAYERS.map((prayer, i) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            setting={settings[prayer.id]}
            isNext={prayer.id === nextId}
            minsAway={minsAway}
            onTimePress={() => openPicker(prayer.id)}
            onToggle={() => togglePrayer(prayer.id)}
            onNotifType={(t) => changeNotifType(prayer.id, t)}
            enterAnim={enterAnims[i]}
          />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ──────── TIME PICKER MODAL ──────── */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <View style={modalStyles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closePicker} activeOpacity={1} />

          <LinearGradient
            colors={['#0D3B27', '#0A2E1E']}
            style={modalStyles.sheet}
          >
            <View style={modalStyles.handle} />

            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>Set Time</Text>
                {editingPrayer && (
                  <Text style={[modalStyles.subtitle, { color: editingPrayer.accent }]}>
                    {editingPrayer.nameAr} · {editingPrayer.nameEn}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closePicker} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={18} color="rgba(245,237,212,0.6)" />
              </TouchableOpacity>
            </View>

            {/* time preview */}
            <View style={modalStyles.preview}>
              <Text style={[modalStyles.previewTime, editingPrayer && { color: editingPrayer.accent }]}>
                {fmt12(draftH, draftM).time}
              </Text>
              <Text style={modalStyles.previewAmpm}>{fmt12(draftH, draftM).ampm}</Text>
            </View>

            {/* drum wheels */}
            <View style={modalStyles.wheels}>
              <Text style={modalStyles.wheelLabel}>HH</Text>
              <DrumColumn
                items={HOURS}
                selected={draftH}
                onSelect={setDraftH}
                format={(v) => String(v % 12 === 0 ? 12 : v % 12).padStart(2, '0')}
              />
              <Text style={modalStyles.colon}>:</Text>
              <DrumColumn
                items={MINUTES}
                selected={draftM}
                onSelect={setDraftM}
                format={(v) => String(v).padStart(2, '0')}
              />
              <Text style={modalStyles.wheelLabel}>MM</Text>
            </View>

            {/* AM/PM quick tap */}
            <View style={modalStyles.ampmRow}>
              {['AM', 'PM'].map((ap) => {
                const active = ap === 'AM' ? draftH < 12 : draftH >= 12;
                return (
                  <TouchableOpacity
                    key={ap}
                    onPress={() => {
                      if (ap === 'AM' && draftH >= 12) setDraftH(draftH - 12);
                      if (ap === 'PM' && draftH < 12)  setDraftH(draftH + 12);
                    }}
                    style={[
                      modalStyles.ampmBtn,
                      active && editingPrayer && { backgroundColor: editingPrayer.accent + '33', borderColor: editingPrayer.accent },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[modalStyles.ampmBtnText, active && editingPrayer && { color: editingPrayer.accent }]}>
                      {ap}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Sound selector inside modal ── */}
            <View style={modalStyles.soundSection}>
              <Text style={modalStyles.soundLabel}>Notification Sound</Text>
              <View style={modalStyles.soundRow}>
                {NOTIF_OPTIONS.map((opt) => {
                  const active = draftNotif === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      onPress={() => handleDraftNotifChange(opt.type)}
                      style={[
                        modalStyles.soundPill,
                        active && editingPrayer && {
                          backgroundColor: editingPrayer.accent + '33',
                          borderColor: editingPrayer.accent,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={14}
                        color={active && editingPrayer ? editingPrayer.accent : 'rgba(245,237,212,0.4)'}
                      />
                      <Text style={[
                        modalStyles.soundPillText,
                        active && editingPrayer && { color: editingPrayer.accent },
                      ]}>
                        {opt.label}
                      </Text>
                      {active && opt.type !== 'silent' && (
                        <Ionicons name="play-circle" size={12} color={editingPrayer?.accent ?? '#C9A84C'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {draftNotif !== 'silent' && (
                <Text style={modalStyles.soundHint}>Tap a sound to preview it</Text>
              )}
            </View>

            {/* confirm */}
            <TouchableOpacity onPress={confirmTime} activeOpacity={0.85} style={modalStyles.confirmTouch}>
              <LinearGradient
                colors={editingPrayer ? [editingPrayer.accent, editingPrayer.accent + 'AA'] : ['#C9A84C', '#A07828']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={modalStyles.confirmBtn}
              >
                <Ionicons name="checkmark" size={18} color="#061A10" />
                <Text style={modalStyles.confirmText}>Confirm Time</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────────
   MAIN STYLES  (unchanged from original)
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  borderL: { position: 'absolute', left: 10, top: 60, bottom: 30, width: 1, backgroundColor: 'rgba(201,168,76,0.1)' },
  borderR: { position: 'absolute', right: 10, top: 60, bottom: 30, width: 1, backgroundColor: 'rgba(201,168,76,0.1)' },

  scroll: { paddingHorizontal: 18, paddingTop: 56, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 26,
    color: '#F5EDD4',
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  headerAr: {
    fontSize: 14,
    color: 'rgba(201,168,76,0.7)',
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
  },
  clockBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  clockTime: { fontSize: 20, color: '#F5EDD4', fontWeight: '900', letterSpacing: 1 },
  clockAmpm: { fontSize: 11, color: 'rgba(245,237,212,0.5)', fontWeight: '700' },

  nextHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
  },
  nextHeroLeft: { flex: 1 },
  nextLabel:    { fontSize: 11, color: 'rgba(245,237,212,0.45)', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  nextName:     { fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  nextNameAr:   { fontSize: 16, color: 'rgba(245,237,212,0.5)', fontWeight: '600', letterSpacing: 0.5 },
  nextCountdown:{ fontSize: 13, color: 'rgba(245,237,212,0.55)', marginTop: 4, fontWeight: '600' },
  nextIconCircle: {
    width: 62, height: 62, borderRadius: 31,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },

  permWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(232,160,80,0.1)',
    borderWidth: 1, borderColor: 'rgba(232,160,80,0.25)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  permWarnText: { flex: 1, fontSize: 12, color: 'rgba(232,160,80,0.85)', fontWeight: '500' },

  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.2)' },
  divLabel: { fontSize: 11, color: 'rgba(201,168,76,0.6)', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40,
    paddingTop: 12,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  title:    { fontSize: 20, color: '#F5EDD4', fontWeight: '900', letterSpacing: 0.4 },
  subtitle: { fontSize: 13, fontWeight: '700', marginTop: 3, letterSpacing: 0.5 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  preview: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'center', gap: 6, marginBottom: 10,
  },
  previewTime: { fontSize: 52, fontWeight: '900', letterSpacing: 2 },
  previewAmpm: { fontSize: 18, color: 'rgba(245,237,212,0.45)', fontWeight: '700' },

  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  wheelLabel: { fontSize: 11, color: 'rgba(245,237,212,0.3)', fontWeight: '700', letterSpacing: 1 },
  colon: { fontSize: 34, color: 'rgba(245,237,212,0.4)', fontWeight: '900', marginHorizontal: 4 },

  ampmRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  ampmBtn: {
    width: 80, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  ampmBtnText: { fontSize: 15, fontWeight: '800', color: 'rgba(245,237,212,0.35)', letterSpacing: 1 },

  // ── Sound selector ──
  soundSection: {
    marginBottom: 20,
  },
  soundLabel: {
    fontSize: 11,
    color: 'rgba(201,168,76,0.6)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  soundRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  soundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  soundPillText: {
    fontSize: 12,
    color: 'rgba(245,237,212,0.4)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  soundHint: {
    fontSize: 10,
    color: 'rgba(245,237,212,0.25)',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  confirmTouch: { borderRadius: 16, overflow: 'hidden' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  confirmText: { fontSize: 16, fontWeight: '900', color: '#061A10', letterSpacing: 0.4 },
});