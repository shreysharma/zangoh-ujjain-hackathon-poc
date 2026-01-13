import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Itinerary } from '../utils/itinerary';
import Svg, { Path } from 'react-native-svg';

type Props = {
  itinerary: Itinerary;
  onPress?: () => void;
  showFull?: boolean;
  variant?: 'default' | 'compact';
};

const ItineraryCard = ({ itinerary, onPress, showFull, variant = 'default' }: Props) => {
  const cover: ImageSourcePropType | undefined = itinerary.coverImage
    ? { uri: itinerary.coverImage }
    : undefined;
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={isCompact ? 1 : 2}>
            {itinerary.title}
          </Text>
          {itinerary.subtitle && itinerary.subtitle !== 'null' ? (
            <Text style={styles.subtitle} numberOfLines={isCompact ? 1 : 2}>
              {itinerary.subtitle}
            </Text>
          ) : itinerary.description ? (
            <Text style={styles.subtitle} numberOfLines={isCompact ? 1 : 2}>
              {itinerary.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.chevronWrap}>
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M5 10H15M15 10L10 5M15 10L10 15"
              stroke="#FFFFFF"
              strokeWidth={1.67}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
      {cover && !isCompact ? (
        <Image source={cover} style={styles.cover} resizeMode="cover" />
      ) : null}
      {showFull && itinerary.plan_overview ? (
        <Text style={styles.activity} numberOfLines={isCompact ? 3 : 6}>
          {itinerary.plan_overview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E9E8E8',
    width: 250,
  },
  cardCompact: {
    width: 280,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  textBlock: { flex: 1, paddingRight: 12 },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9842F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#FFF3E8',
    color: '#E9842F',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
  },
  activity: {
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 10,
  },
  cover: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: '#f5f5f5',
  },
});

export default ItineraryCard;
