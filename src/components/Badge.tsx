import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  color?: string;
  outline?: boolean;
}

export default function Badge({ label, color = colors.primary, outline = false }: BadgeProps) {
  return (
    <View style={[
      styles.badge,
      outline ? { borderColor: color, borderWidth: 1 } : { backgroundColor: `${color}10`, borderColor: `${color}20`, borderWidth: 1 }
    ]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginRight: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
