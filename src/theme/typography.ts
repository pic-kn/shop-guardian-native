import { TextStyle } from 'react-native';

export const typography = {
  h1: { fontSize: 24, fontWeight: '900', color: '#1C1C1C', letterSpacing: 1 } as TextStyle,
  h2: { fontSize: 20, fontWeight: '800', color: '#1C1C1C', letterSpacing: 0.5 } as TextStyle,
  h3: { fontSize: 18, fontWeight: '700', color: '#1C1C1C' } as TextStyle,
  body: { fontSize: 16, color: '#1C1C1C', lineHeight: 24 } as TextStyle,
  bodySecondary: { fontSize: 14, color: '#6B6B6B', lineHeight: 20 } as TextStyle,
  caption: { fontSize: 12, color: '#9CA3AF', letterSpacing: 0.5 } as TextStyle,
  mono: { fontSize: 13, fontFamily: 'Courier', color: '#4B5563' } as TextStyle,
};
