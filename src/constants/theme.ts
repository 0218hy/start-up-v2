import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1e1b4b',            // Deep mystical indigo for readable text
    background: '#fcfaff',      // Calm lavender-tinted soft white background
    backgroundElement: '#f3e8ff', // Soft, dreamy pastel purple element backdrop
    backgroundSelected: '#e0e7ff', // Ethereal periwinkle for active selections
    textSecondary: '#6366f1',   // Calming, bright indigo-purple accent
    accent: '#34d399',          // Magic mint green highlight for positive actions
  },
  dark: {
    text: '#e0e7ff',            // Soft stardust white/blue text
    background: '#09090b',      // Midnight black backdrop
    backgroundElement: '#1e1b4b', // Deep celestial twilight indigo containers
    backgroundSelected: '#312e81', // Glowing aura purple for selections
    textSecondary: '#818cf8',   // Luminous pastel violet secondary text
    accent: '#a7f3d0',          // Soft glowing mint green highlight
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded', // Automatically defaults to Apple's clean rounded system typography
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;