import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

export function AmbientBackground() {
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(panY, {
        toValue: height,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [panY]);

  // Create 6 vertical lines
  const lines = Array.from({ length: 6 });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Animated Vertical Grid Lines */}
      <View style={StyleSheet.absoluteFillObject}>
        {lines.map((_, i) => (
          <View
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: (width / 5) * i,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'rgba(207,171,103,0.04)',
            }}
          />
        ))}
        {/* Animated Highlight passing over the lines */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -height,
            left: 0,
            right: 0,
            height: height,
            transform: [{ translateY: panY }],
            opacity: 0.15,
          }}
        >
          <LinearGradient
            colors={['transparent', colors.gold, 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      {/* Top Left Gold Glow */}
      <LinearGradient
        colors={['rgba(207,171,103,0.15)', 'rgba(207,171,103,0.0)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width * 1.5,
          height: height * 0.7,
        }}
      />
      
      {/* Bottom Right Emerald Glow */}
      <LinearGradient
        colors={['transparent', 'rgba(52,211,153,0.03)', 'rgba(96,165,250,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: width,
          height: height * 0.6,
        }}
      />

      {/* Center Dark Overlay to smooth it out */}
      <LinearGradient
        colors={['transparent', 'rgba(5,5,5,0.4)', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}
