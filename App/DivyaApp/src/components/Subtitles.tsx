import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  userText?: string;
  botText?: string;
  isUserSpeaking?: boolean;
  isBotSpeaking?: boolean;
  isVideoMode?: boolean;
  style?: any;
};

const Subtitles = ({
  userText,
  botText,
  isUserSpeaking,
  isBotSpeaking,
  isVideoMode = false,
  style,
}: Props) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [userText, botText]);

  const showUser = !!userText && !isBotSpeaking;
  const showBot = !!botText;

  if (!showUser && !showBot) return null;

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        ref={scrollRef}
        style={[
          styles.container,
          isVideoMode ? styles.videoBg : styles.defaultBg,
        ]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showUser ? <Text style={styles.user}>{userText}</Text> : null}
        {showBot ? <Text style={styles.bot}>{botText}</Text> : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
  },
  container: {
    maxHeight: 160,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  content: {
    paddingVertical: 2,
  },
  user: {
    color: '#393939',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  bot: {
    color: '#393939',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default Subtitles;
