import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Divider, useTheme } from 'react-native-paper';

export const SmsSkeleton: React.FC = () => {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.itemContainer}>
        {/* Avatar circle skeleton */}
        <Animated.View
          style={[
            styles.avatarSkeleton,
            {
              backgroundColor: theme.colors.surfaceVariant,
              opacity: pulseAnim,
            },
          ]}
        />

        {/* Text rows skeleton */}
        <View style={styles.textContainer}>
          <Animated.View
            style={[
              styles.titleSkeleton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity: pulseAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bodySkeleton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity: pulseAnim,
              },
            ]}
          />
        </View>

        {/* Right metadata skeleton */}
        <View style={styles.rightContainer}>
          <Animated.View
            style={[
              styles.dateSkeleton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity: pulseAnim,
              },
            ]}
          />
        </View>
      </View>
      <Divider />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 72,
  },
  avatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  titleSkeleton: {
    width: '45%',
    height: 16,
    borderRadius: 4,
  },
  bodySkeleton: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateSkeleton: {
    width: 60,
    height: 10,
    borderRadius: 4,
  },
});
