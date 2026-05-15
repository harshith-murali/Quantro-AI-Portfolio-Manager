import 'react-native-gesture-handler';
import React, { useRef, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from './src/store';
import { colors, space, radius } from './src/theme';
import { AmbientBackground } from './src/components/AmbientBackground';
import { StockTickerBar } from './src/components/StockTickerBar';

const MyTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

import { LoginScreen }       from './src/screens/LoginScreen';
import { RegisterScreen }    from './src/screens/RegisterScreen';
import { LandingScreen }     from './src/screens/LandingScreen';
import { DashboardScreen }   from './src/screens/DashboardScreen';
import { SignalsScreen }     from './src/screens/SignalsScreen';
import { StockDetailScreen } from './src/screens/StockDetailScreen';
import { PortfolioScreen }   from './src/screens/PortfolioScreen';
import { BacktestScreen }    from './src/screens/BacktestScreen';
import { ProfileScreen }     from './src/screens/ProfileScreen';

import { AIScreen }       from './src/screens/AIScreen';
import { WalletScreen }   from './src/screens/WalletScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const { width } = Dimensions.get('window');

// ─── Premium Custom Tab Bar ───────────────────────────────────────────────
const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Dashboard',
  AI:        'AI',
  Signals:   'Signals',
  Portfolio: 'Portfolio',
  Wallet:    'Wallet',
};

function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorAnims = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    state.routes.forEach((_, i) => {
      Animated.timing(indicatorAnims[i], {
        toValue: state.index === i ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={[tb.root, { paddingBottom: insets.bottom || 12 }]}>
      {/* Top border with gold tint */}
      <LinearGradient
        colors={['rgba(207,171,103,0.18)', 'rgba(207,171,103,0.04)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={tb.topBorder}
        pointerEvents="none"
      />

      <View style={tb.inner}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const labelScale = indicatorAnims[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
          const indicatorOpacity = indicatorAnims[i];
          const indicatorWidth   = indicatorAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={tb.tab}>
              {/* Active indicator bar at top */}
              <View style={tb.indicatorWrap}>
                <Animated.View style={[tb.indicator, { opacity: indicatorOpacity, width: indicatorWidth }]} />
              </View>

              <Animated.Text style={[
                tb.label,
                focused ? tb.labelActive : tb.labelInactive,
                { transform: [{ scale: labelScale }] },
              ]}>
                {TAB_LABELS[route.name]}
              </Animated.Text>

              {/* Gold dot for active */}
              {focused && <View style={tb.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SignalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignalsList"  component={SignalsScreen} />
      <Stack.Screen name="StockDetail"  component={StockDetailScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={props => <PremiumTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="AI"        component={AIScreen} />
      <Tab.Screen name="Signals"   component={SignalsStack} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Wallet"    component={WalletScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing"  component={LandingScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { accessToken } = useStore();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AmbientBackground />
        <StockTickerBar />
        <NavigationContainer theme={MyTheme}>
          {accessToken ? <MainTabs /> : <AuthStack />}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const tb = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(7,6,5,0.97)',
    borderTopWidth: 0,
    paddingTop: 10,
  },
  topBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },
  inner: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  indicatorWrap: {
    height: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  indicator: {
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  labelActive:   { color: colors.gold },
  labelInactive: { color: 'rgba(244,239,230,0.28)' },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gold,
    marginTop: 2,
    opacity: 0.6,
  },
});
