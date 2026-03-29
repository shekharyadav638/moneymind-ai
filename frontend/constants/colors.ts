import { Appearance } from 'react-native';

const colorScheme = Appearance.getColorScheme();
const isDark = colorScheme === 'dark' || colorScheme === null;

export const Colors = {
  primary: '#6C63FF',
  primaryDark: '#5A52E0',
  primaryLight: '#8B84FF',
  secondary: '#4ECDC4',
  
  background: isDark ? '#0A0A1A' : '#F2F2F7',
  surface: isDark ? '#12122A' : '#FFFFFF',
  card: isDark ? '#1A1A35' : '#FFFFFF',
  cardLight: isDark ? '#22224A' : '#F9F9FB',
  border: isDark ? 'rgba(108, 99, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
  
  success: '#00D4AA',
  error: '#FF6B6B',
  warning: '#FFB347',
  gold: '#FFD700',
  
  text: {
    primary: isDark ? '#FFFFFF' : '#1C1C1E',
    secondary: isDark ? '#B0B0C8' : '#3C3C43',
    muted: isDark ? '#6B6B8A' : '#8E8E93',
  },
  
  gradient: {
    primary: ['#6C63FF', '#4ECDC4'],
    dark: isDark ? ['#12122A', '#0A0A1A'] : ['#FFFFFF', '#F2F2F7'],
    card: isDark 
      ? ['rgba(108,99,255,0.15)', 'rgba(78,205,196,0.05)']
      : ['rgba(108,99,255,0.08)', 'rgba(78,205,196,0.02)'],
    gold: ['#FFD700', '#FF8C00'],
    success: ['#00D4AA', '#00B890'],
    error: ['#FF6B6B', '#FF4444'],
  },
  
  chart: {
    food: '#FF6B6B',
    travel: '#4ECDC4',
    shopping: '#FFB347',
    bills: '#6C63FF',
    rent: '#FF85A2',
    entertainment: '#85C1E9',
    health: '#82E0AA',
    education: '#F8C471',
    others: '#AEB6BF',
  },
  
  categoryColors: {
    Food: '#FF6B6B',
    Travel: '#4ECDC4',
    Shopping: '#FFB347',
    Bills: '#6C63FF',
    Rent: '#FF85A2',
    Entertainment: '#85C1E9',
    Health: '#82E0AA',
    Education: '#F8C471',
    Investment: '#00D4AA',
    Income: '#5DADE2',
    Others: '#AEB6BF',
  },
} as const;
