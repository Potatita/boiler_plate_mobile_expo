import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
};

const VariantColors: Record<
  NonNullable<ThemedButtonProps['variant']>,
  { background: ThemeColor; label: ThemeColor }
> = {
  primary: { background: 'primary', label: 'textOnPrimary' },
  secondary: { background: 'backgroundElement', label: 'text' },
  danger: { background: 'danger', label: 'textOnDanger' },
};

export function ThemedButton({
  title,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: ThemedButtonProps) {
  const theme = useTheme();
  const { background, label } = VariantColors[variant];

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme[background] },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}>
      <ThemedText type="smallBold" themeColor={label} style={styles.label}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
