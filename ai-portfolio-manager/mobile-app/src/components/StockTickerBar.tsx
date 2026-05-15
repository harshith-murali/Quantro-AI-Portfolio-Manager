import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

const TICKER_ITEMS = [
  { symbol: 'RELIANCE', price: '2,945.20', change: '+1.2%' },
  { symbol: 'TCS', price: '4,102.80', change: '+0.8%' },
  { symbol: 'HDFCBANK', price: '1,456.90', change: '-0.5%' },
  { symbol: 'INFY', price: '1,678.40', change: '+2.1%' },
  { symbol: 'ICICIBANK', price: '1,089.50', change: '+1.5%' },
  { symbol: 'SBIN', price: '765.30', change: '-0.2%' },
  { symbol: 'BHARTIARTL', price: '1,234.10', change: '+1.8%' },
];

export function StockTickerBar() {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -1200,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    
    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.tickerRow, { transform: [{ translateX }] }]}>
        {/* Render twice for seamless looping */}
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => {
          const isPositive = item.change.startsWith('+');
          return (
            <View key={`${item.symbol}-${index}`} style={styles.item}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
              <Text style={[styles.change, { color: isPositive ? colors.emerald : colors.red }]}>
                {item.change}
              </Text>
              <Text style={styles.separator}>•</Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 32,
    backgroundColor: 'rgba(207,171,103,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207,171,103,0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tickerRow: {
    flexDirection: 'row',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  symbol: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  price: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginRight: 6,
  },
  change: {
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
    marginLeft: 12,
  },
});
