import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAnalytics } from '@/contexts/analytics';
import { useTheme } from '@/hooks/use-theme';

const steps = [
  {
    id: 'value-proposition',
    title: 'Step one',
    description: 'Tell people what your app does and why it is worth their time.',
  },
  {
    id: 'key-feature',
    title: 'Step two',
    description: 'Show the one feature that makes the difference, in a single sentence.',
  },
  {
    id: 'subscription-expectation',
    title: 'Step three',
    description: 'Set the expectation that the next screen asks for a subscription.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { capture } = useAnalytics();
  const listRef = useRef<FlatList<(typeof steps)[number]>>(null);
  const currentIndexRef = useRef(0);
  const viewedStepIdsRef = useRef(new Set<string>());
  const hasCompletedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const isLastStep = index === steps.length - 1;

  const trackStepView = useCallback(
    (nextIndex: number) => {
      const step = steps[nextIndex];

      if (!step || viewedStepIdsRef.current.has(step.id)) {
        return;
      }

      viewedStepIdsRef.current.add(step.id);
      capture('onboarding step viewed', {
        onboarding_step_id: step.id,
        onboarding_step_number: nextIndex + 1,
        onboarding_step_count: steps.length,
      });
    },
    [capture]
  );

  const setActiveStep = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= steps.length) {
        return;
      }

      currentIndexRef.current = nextIndex;
      setIndex(nextIndex);
      trackStepView(nextIndex);
    },
    [trackStepView]
  );

  useEffect(() => {
    capture('onboarding started', { onboarding_step_count: steps.length });
    trackStepView(0);
  }, [capture, trackStepView]);

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveStep(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  function handleAdvance() {
    const currentIndex = currentIndexRef.current;

    if (currentIndex === steps.length - 1) {
      if (hasCompletedRef.current) {
        return;
      }

      hasCompletedRef.current = true;
      capture('onboarding completed', { onboarding_step_count: steps.length });
      router.push('/paywall');
      return;
    }

    const nextIndex = currentIndex + 1;
    listRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
    setActiveStep(nextIndex);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={listRef}
          data={steps}
          keyExtractor={(step) => step.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => (
            <View style={[styles.page, { width }]}>
              <ThemedText type="subtitle" style={styles.pageText}>
                {item.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.pageText}>
                {item.description}
              </ThemedText>
            </View>
          )}
        />

        <View style={styles.dots}>
          {steps.map((step, dotIndex) => (
            <View
              key={step.id}
              style={[
                styles.dot,
                {
                  backgroundColor: dotIndex === index ? theme.primary : theme.backgroundSelected,
                },
              ]}
            />
          ))}
        </View>

        <ThemedButton
          title={isLastStep ? 'Get started' : 'Next'}
          onPress={handleAdvance}
          style={styles.button}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  pageText: {
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: Spacing.two,
    height: Spacing.two,
    borderRadius: Spacing.one,
  },
  button: {
    marginHorizontal: Spacing.four,
  },
});
