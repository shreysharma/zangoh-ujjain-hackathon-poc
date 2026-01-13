import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import HeaderBar from './HeaderBar';
import { Itinerary } from '../utils/itinerary';
import RNFS from 'react-native-fs';

type Props = {
  itinerary: Itinerary;
  onBack: () => void;
  onLogout?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  onOpenChat?: () => void;
  onOpenAudio?: () => void;
};

const ItineraryDetailScreen = ({
  itinerary,
  onBack,
  onLogout,
  isConnected,
  isConnecting,
  onOpenChat,
  onOpenAudio,
}: Props) => {
  const buildShareText = () => {
    const lines: string[] = [];
    lines.push(itinerary.title);
    if (itinerary.subtitle) lines.push(itinerary.subtitle);
    if (itinerary.description) lines.push(itinerary.description);
    lines.push('');
    itinerary.days.forEach(day => {
      lines.push(day.title);
      if (day.description) lines.push(day.description);
      day.activities.forEach(act => {
        const time = act.time ? `[${act.time}] ` : '';
        const loc = act.location ? ` @ ${act.location}` : '';
        lines.push(`- ${time}${act.title}${loc}`);
        if (act.description) lines.push(`  ${act.description}`);
      });
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleShareText = async () => {
    try {
      await Share.share({ message: buildShareText() });
    } catch (e: any) {
      console.log('[itinerary] share text error', e);
      Alert.alert('Share failed', 'Could not share the itinerary.');
    }
  };

  const handleDownloadText = async () => {
    try {
      const filenameSafe =
        itinerary.title?.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() ||
        'itinerary';
      const dir =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const path = `${dir}/${filenameSafe}-${Date.now()}.txt`;
      await RNFS.writeFile(path, buildShareText(), 'utf8');
      Alert.alert('Saved', `Itinerary saved to ${path}`);
    } catch (e: any) {
      console.log('[itinerary] download text error', e);
      Alert.alert('Save failed', 'Could not save the itinerary.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#E9842F" translucent={false} />
      <HeaderBar
        showChatView={false}
        onBackClick={onBack}
        isConnected={!!isConnected}
        isConnecting={!!isConnecting}
        onConnectionToggle={() => {}}
        onToggleChatView={onOpenAudio}
        onChatClick={onOpenChat}
        onLogout={onLogout}
        showBack
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
         

          <View style={styles.hero}>
            <View style={{width: '70%'}}>
               {itinerary.coverImage ? (
              <Image
                source={{ uri: itinerary.coverImage }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : null}
            <Text style={styles.title}>{itinerary.title}</Text>
            {itinerary.subtitle && itinerary.subtitle !== 'null' ? (
              <Text style={styles.subtitle}>{itinerary.subtitle}</Text>
            ) : null}
            {itinerary.description ? (
              <Text style={styles.description}>{itinerary.description}</Text>
            ) : null}
            </View>    
             <View style={styles.actionsRow}>
             <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDownloadText}
            >
              <ImageBackground
                source={require('../../assets/web-public/download-02.png')}
                style={styles.icon}
                imageStyle={styles.iconImage}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShareText}
            >
              <ImageBackground
                source={require('../../assets/web-public/share-07.png')}
                style={styles.icon}
                imageStyle={styles.iconImage}
              />
            </TouchableOpacity>
           
          </View>
          </View>
          {itinerary.days.map((day, idx) => (
            <View key={`${day.title}-${idx}`} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.title}</Text>
              </View>
              {day.description ? (
                <Text style={styles.dayDescription}>{day.description}</Text>
              ) : null}
              {day.activities.map((act, aIdx) => {
                const isLast = aIdx === day.activities.length - 1;
                return (
                  <View key={`${day.title}-${aIdx}`} style={styles.activityRow}>
                    <View style={styles.timelineCol}>
                      <View style={styles.timelineDot} />
                      {!isLast ? <View style={styles.timelineLine} /> : null}
                    </View>
                    <View style={styles.activityBody}>
                      <View style={styles.titleRow}>
                        {act.time ? (
                          <Text style={styles.timeText}>{act.time}</Text>
                        ) : null}
                        <View>
                          <Text style={styles.activityTitle}>{act.title}</Text>
                          {act.location ? (
                            <Text style={styles.activityMeta}>
                              {act.location}
                            </Text>
                          ) : null}
                          {act.description ? (
                            <Text style={styles.activityDescription}>
                              {act.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFAF4' },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9E8E8',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  iconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cover: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 8 },
  description: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9E8E8',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  dayPill: {
    backgroundColor: '#FFF1E0',
    color: '#E9842F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '700',
    fontSize: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: '700', color: '#E9842F' },
  dayDescription: { fontSize: 13, color: '#475569', marginBottom: 8 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E9842F',
    backgroundColor: '#fff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F3B07C',
  },
  activityBody: { flex: 1, paddingBottom: 6 },
  titleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  titleData: {
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  timeText: { fontSize: 12, fontWeight: '700', color: '#393939' },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#393939',
    flexShrink: 1,
    flexWrap: 'wrap',
    width: 190,
  },
  activityMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  activityDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    lineHeight: 18,
    flexWrap: 'wrap',
    flexShrink: 1,
    width: 190,
  },
});

export default ItineraryDetailScreen;
