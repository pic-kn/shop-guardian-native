import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

interface ListItemProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  rightText?: string;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  style?: ViewStyle;
}

export default function ListItem({
  icon: Icon, iconColor = colors.text, title, subtitle, rightText, rightComponent, onPress, showChevron = false, isLast = false, style
}: ListItemProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        {Icon && <Icon size={22} color={iconColor} strokeWidth={2} />}
      </View>
      
      <View style={[styles.contentContainer, !isLast && styles.borderBottom]}>
        <View style={styles.textContainer}>
          <Text style={typography.body}>{title}</Text>
          {subtitle && <Text style={[typography.caption, { marginTop: 2 }]}>{subtitle}</Text>}
        </View>
        
        {rightText && (
          <Text style={[typography.bodySecondary, { marginRight: 8 }]}>{rightText}</Text>
        )}

        {rightComponent}

        {showChevron && (
          <ChevronRight size={18} color={colors.border} />
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginRight: 4,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
