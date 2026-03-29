import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, useColorScheme } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  color: string;
};

const TabIcon = ({ name, label, focused, color }: TabIconProps) => (
  <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Ionicons name={name} size={24} color={color} />
    </View>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' || colorScheme === null; // Default to dark if null

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, {
          borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDark ? Colors.text.muted : 'rgba(0,0,0,0.5)',
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, {
            backgroundColor: isDark ? 'rgba(10,10,26,0.97)' : 'rgba(255,255,255,0.97)',
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "home" : "home-outline"} label="Home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "wallet" : "wallet-outline"} label="Spends" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: 'Investments',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "trending-up" : "trending-up-outline"} label="Invest" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} label="AI" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? "person" : "person-outline"} label="Profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: Platform.OS === 'ios' ? 88 : 70,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 4,
  },
  tabItemFocused: {
    // Optional container styling for active state
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: 12,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  tabLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
