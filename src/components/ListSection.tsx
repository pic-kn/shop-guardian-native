import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export default function ListSection({ children, style }: { children: React.ReactNode, style?: ViewStyle }) {
  return (
    <View style={[styles.section, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
