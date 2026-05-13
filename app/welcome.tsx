import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

/* ─── Islamic 8-pointed star shape via two overlapping rotated squares ─── */
function GeometricStar({
  size,
  color,
  opacity,
  style,
}: {
  size: number;
  color: string;
  opacity: number;
  style?: object;
}) {
  const sq = size * 0.72;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View
        style={{
          position: 'absolute',
          width: sq,
          height: sq,
          borderWidth: 1.5,
          borderColor: color,
          opacity,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: sq,
          height: sq,
          borderWidth: 1.5,
          borderColor: color,
          opacity,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* inner dot */}
      <View
        style={{
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
          opacity: opacity * 0.8,
        }}
      />
    </View>
  );
}

/* ─── Decorative tiled background grid of stars ─── */
function IslamicGrid() {
  const grid = [];
  const cols = 5;
  const rows = 9;
  const cellW = width / cols;
  const cellH = (height * 1.1) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offset = r % 2 === 0 ? 0 : cellW / 2;
      grid.push(
        <GeometricStar
          key={`${r}-${c}`}
          size={cellW * 0.65}
          color="#C9A84C"
          opacity={0.07}
          style={{
            position: 'absolute',
            left: c * cellW + offset - cellW * 0.1,
            top: r * cellH - cellH * 0.1,
          }}
        />
      );
    }
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {grid}
    </View>
  );
}

/* ─── Glowing orb ─── */
function GlowOrb({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.18,
        },
        style,
      ]}
    />
  );
}

/* ─── Feature row card ─── */
function FeatureRow({
  icon,
  label,
  desc,
  delay,
  masterAnim,
}: {
  icon: string;
  label: string;
  desc: string;
  delay: number;
  masterAnim: Animated.Value;
}) {
  const translateX = masterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0],
  });
  const opacity = masterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.featureRow,
        { opacity, transform: [{ translateX }] },
      ]}
    >
      <LinearGradient
        colors={['rgba(201,168,76,0.18)', 'rgba(201,168,76,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.featureRowGrad}
      >
        <View style={styles.featureIconBox}>
          <Ionicons name={icon as any} size={22} color="#C9A84C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.featureLabel}>{label}</Text>
          <Text style={styles.featureDesc}>{desc}</Text>
        </View>
        <View style={styles.featureArrow}>
          <Ionicons name="chevron-forward" size={14} color="#C9A84C" />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function WelcomeScreen() {
  /* animation values */
  const bisAnim   = useRef(new Animated.Value(0)).current;  // bismillah
  const moonAnim  = useRef(new Animated.Value(0)).current;  // icon entrance
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subAnim   = useRef(new Animated.Value(0)).current;
  const feat1Anim = useRef(new Animated.Value(0)).current;
  const feat2Anim = useRef(new Animated.Value(0)).current;
  const feat3Anim = useRef(new Animated.Value(0)).current;
  const ctaAnim   = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0.7)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* staggered entrance */
    Animated.stagger(120, [
      Animated.timing(bisAnim,   { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(moonAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(subAnim,   { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(feat1Anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(feat2Anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(feat3Anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(ctaAnim,   { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(quoteAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    /* floating moon */
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 3200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:   0, duration: 3200, useNativeDriver: true }),
      ])
    ).start();

    /* glow pulse */
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    /* slow ring spin */
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 24000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const moonScale  = moonAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.3, 1.08, 1] });
  const moonOpacity = moonAnim;

  const titleY = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const subY   = subAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const ctaY   = ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  const handleStart = () => {
    router.push('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#061A10', '#0A2E1E', '#0D3B27', '#0A2E1E', '#061A10']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Islamic geometric background grid ── */}
      <IslamicGrid />

      {/* ── ambient glow orbs ── */}
      <GlowOrb size={340} color="#1B6B44" style={{ top: -80, left: -80 }} />
      <GlowOrb size={280} color="#C9A84C" style={{ bottom: 60, right: -90 }} />
      <GlowOrb size={200} color="#0E5535" style={{ top: height * 0.4, left: -60 }} />

      {/* ── thin decorative border lines ── */}
      <View style={styles.borderLeft} />
      <View style={styles.borderRight} />

      {/* ══════════ scrollable content ══════════ */}
      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >

        {/* Bismillah */}
        <Animated.View style={{ opacity: bisAnim, alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</Text>
          <View style={styles.bisLine} />
        </Animated.View>

        {/* Moon icon */}
        <Animated.View
          style={{
            opacity: moonOpacity,
            transform: [{ scale: moonScale }, { translateY: floatAnim }],
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          {/* spinning dashed ring */}
          <Animated.View
            style={[styles.spinRing, { transform: [{ rotate: spin }] }]}
          />
          {/* glow halo */}
          <Animated.View style={[styles.moonGlow, { opacity: glowAnim }]} />

          <LinearGradient
            colors={['#F0D080', '#C9A84C', '#A07828']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.moonCircle}
          >
            <Ionicons name="moon" size={62} color="#061A10" />
          </LinearGradient>

          {/* star accents */}
          <View style={[styles.starDot, { top: 6, right: -8 }]}>
            <Ionicons name="star" size={9} color="#C9A84C" />
          </View>
          <View style={[styles.starDot, { bottom: 10, left: -12 }]}>
            <Ionicons name="star" size={6} color="#C9A84C" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [{ translateY: titleY }],
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Text style={styles.appName}>Islamic Counter</Text>
          <View style={styles.titleDivider}>
            <View style={styles.dividerLine} />
            <GeometricStar size={20} color="#C9A84C" opacity={0.9} />
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[styles.subtitle, { opacity: subAnim, transform: [{ translateY: subY }] }]}
        >
          Your personal dhikr & prayer companion
        </Animated.Text>

        {/* Feature rows */}
        <View style={styles.featuresBlock}>
          <FeatureRow icon="sparkles"    label="Tasbeeh Counter" desc="Count SubhanAllah, Alhamdulillah & more" delay={0}   masterAnim={feat1Anim} />
          <FeatureRow icon="time-outline" label="Stopwatch"       desc="Time your worship sessions effortlessly" delay={80}  masterAnim={feat2Anim} />
          <FeatureRow icon="alarm-outline" label="Prayer Timer"    desc="Set countdowns for prayer preparation"   delay={160} masterAnim={feat3Anim} />
        </View>

        {/* CTA button */}
        <Animated.View
          style={[
            styles.ctaWrapper,
            { opacity: ctaAnim, transform: [{ translateY: ctaY }] },
          ]}
        >
          <TouchableOpacity onPress={handleStart} activeOpacity={0.85} style={styles.ctaTouch}>
            <LinearGradient
              colors={['#F0D080', '#C9A84C', '#9A7020']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaText}>Begin Your Journey</Text>
              <View style={styles.ctaIconWrap}>
                <Ionicons name="arrow-forward" size={16} color="#C9A84C" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Hadith quote */}
        <Animated.View style={[styles.quoteBox, { opacity: quoteAnim }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#C9A84C" />
          <Text style={styles.quoteText}>
            "The best remembrance is{'\n'}the remembrance of Allah"
          </Text>
          <Text style={styles.quoteSrc}>— Prophet Muhammad ﷺ</Text>
        </Animated.View>

      </ScrollView>
      <View style={styles.bottomOrnament}>
        <View style={styles.ornamentLine} />
        <Ionicons name="star" size={10} color="#C9A84C" style={{ opacity: 0.6, marginHorizontal: 8 }} />
        <GeometricStar size={18} color="#C9A84C" opacity={0.6} />
        <Ionicons name="star" size={10} color="#C9A84C" style={{ opacity: 0.6, marginHorizontal: 8 }} />
        <View style={styles.ornamentLine} />
      </View>
    </LinearGradient>
  );
}

/* ─────────────────────── STYLES ─────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  borderLeft: {
    position: 'absolute',
    left: 12,
    top: 60,
    bottom: 40,
    width: 1,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  borderRight: {
    position: 'absolute',
    right: 12,
    top: 60,
    bottom: 40,
    width: 1,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },

  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 80,
    zIndex: 10,
  },

  /* Bismillah */
  bismillah: {
    fontSize: 22,
    color: '#C9A84C',
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  bisLine: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.4)',
    marginBottom: 18,
  },

  /* Moon */
  spinRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderStyle: 'dashed',
  },
  moonGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#C9A84C',
    opacity: 0.12,
  },
  moonCircle: {
    width: 122,
    height: 122,
    borderRadius: 61,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  starDot: {
    position: 'absolute',
  },

  /* Title */
  appName: {
    fontSize: 34,
    color: '#F5EDD4',
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(201,168,76,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dividerLine: {
    width: 50,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.5)',
  },

  subtitle: {
    color: 'rgba(220,205,170,0.7)',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.6,
    fontWeight: '500',
    marginBottom: 28,
  },

  /* Features */
  featuresBlock: {
    width: '100%',
    gap: 10,
    marginBottom: 30,
  },
  featureRow: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
  },
  featureRowGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    color: '#F5EDD4',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featureDesc: {
    color: 'rgba(220,205,170,0.55)',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  featureArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201,168,76,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CTA */
  ctaWrapper: {
    width: '100%',
    marginBottom: 28,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaTouch: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGrad: {
    paddingVertical: 17,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  ctaText: {
    color: '#061A10',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  ctaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(6,26,16,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Quote */
  quoteBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(201,168,76,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
    gap: 6,
  },
  quoteText: {
    color: 'rgba(220,205,170,0.7)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  quoteSrc: {
    color: 'rgba(201,168,76,0.55)',
    fontSize: 11,
    letterSpacing: 0.4,
  },

  /* Bottom ornament */
  bottomOrnament: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
});