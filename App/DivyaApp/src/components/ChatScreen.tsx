import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path, Rect } from 'react-native-svg';
import { wsService } from '../services/wsService';
import { env } from '../config/env';
import { sessionLogger } from '../services/sessionLogger';
import HeaderBar from './HeaderBar';
import ItineraryCard from './ItineraryCard';
import { Itinerary, parseBackendItinerary } from '../utils/itinerary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { textBuffer } from '../services/textBuffer';

type Message = {
  id: string;
  text: string;
  from: 'bot' | 'user';
  itinerary?: Itinerary;
  timestamp?: number;
  imageData?: string;
  fileName?: string;
};

type Props = {
  onBack: () => void;
  onOpenAudio: () => void;
  onOpenCamera?: () => void;
  token: string;
  onLogout?: () => void;
  onOpenItinerary?: (itinerary: Itinerary) => void;
};

const ChatScreen = ({
  onBack,
  onOpenAudio,
  onOpenCamera,
  onLogout,
  token,
  onOpenItinerary,
}: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);

  const streamingBotId = useRef<string | null>(null);
  const toolMsgId = useRef<string | null>(null);
  const pendingItineraryRef = useRef<Itinerary | null>(null);
  const introMessage =
    'नमस्ते! मैं दिव्या दर्शक। आपकी मदद के लिए तैयार हूँ। बोलकर बताइए।';

  const listRef = useRef<FlatList>(null);
  const useNativeTextBuffer = useRef(textBuffer.isSupported).current;

  useEffect(() => {
    if (!useNativeTextBuffer) return;
    return textBuffer.onUpdate(text => {
      setMessages(prev => {
        let updated = [...prev];
        if (!streamingBotId.current) {
          const id = `${Date.now()}-bot`;
          streamingBotId.current = id;
          updated.push({ id, text, from: 'bot', timestamp: Date.now() });
          return updated;
        }
        updated = updated.map(m =>
          m.id === streamingBotId.current ? { ...m, text } : m,
        );
        return updated;
      });
    });
  }, [useNativeTextBuffer]);

  // WebSocket handling
  useEffect(() => {
    if (!env.wsHost || !token) return;
    const unsubscribe = wsService.on(evt => {
      if (evt.type === 'unknown') {
        console.log('[chat] unknown event', JSON.stringify(evt));
      }
      switch (evt.type) {
        case 'connected':
        case 'setup_complete':
          setConnected(true);
          break;
        case 'text_sent':
          break;
        case 'text_chunk':
          // Skip text_chunk to reduce JS load; rely on output_transcription.
          break;
        case 'output_transcription': {
          const text = evt.text || '';
          if (!text) return;
          if (evt.type === 'output_transcription' && useNativeTextBuffer) {
            textBuffer.add(text);
            return;
          }
          if (useNativeTextBuffer) {
            return;
          }

          setMessages(prev => {
            let updated = [...prev];
            if (!streamingBotId.current) {
              const id = `${Date.now()}-bot`;
              streamingBotId.current = id;
              updated.push({ id, text, from: 'bot', timestamp: Date.now() });
            } else {
              updated = updated.map(m =>
                m.id === streamingBotId.current
                  ? { ...m, text: m.text + text }
                  : m,
              );
            }
            return updated;
          });
          break;
        }
        case 'turn_complete':
          if (useNativeTextBuffer) {
            textBuffer.reset();
          }
          if (streamingBotId.current) {
            setMessages(prev => {
              const msg = prev.find(m => m.id === streamingBotId.current);
              if (msg?.text) {
                sessionLogger.appendBot(msg.text);
              }
              return prev;
            });
          }
          if (pendingItineraryRef.current) {
            const itin = pendingItineraryRef.current;
            setMessages(prev => [
              ...prev,
              {
                id: `${Date.now()}-itin`,
                text: '',
                from: 'bot',
                timestamp: Date.now(),
                itinerary: itin,
              },
            ]);
            void sessionLogger.appendItinerary(itin);
            pendingItineraryRef.current = null;
          }
          streamingBotId.current = null;
          break;
        case 'interrupted':
          if (useNativeTextBuffer) {
            textBuffer.reset();
          }
          streamingBotId.current = null;
          setMessages(prev =>
            prev.filter(m => m.id && !m.id.startsWith('live-bot')),
          );
          break;
        case 'itinerary': {
          const parsed = parseBackendItinerary(evt.data);
          console.log('[chat] raw itinerary', evt.data, 'parsed', parsed);
          if (parsed) {
            pendingItineraryRef.current = parsed;
          }
          break;
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem('intro_seen_once')
      .then(val => {
        if (!isMounted || val === '1') return;
        setMessages(prev =>
          prev.length
            ? prev
            : [{ id: 'intro', text: introMessage, from: 'bot', timestamp: Date.now() }],
        );
        void AsyncStorage.setItem('intro_seen_once', '1').catch(() => {});
      })
      .catch(() => {
        if (!isMounted) return;
        setMessages(prev =>
          prev.length
            ? prev
            : [{ id: 'intro', text: introMessage, from: 'bot', timestamp: Date.now() }],
        );
        void AsyncStorage.setItem('intro_seen_once', '1').catch(() => {});
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      from: 'user',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    sessionLogger.appendUser(newMsg.text);
    setInput('');
    setInputHeight(44);
    wsService.sendText(newMsg.text);
  };

  const pickImage = async () => {
    const result: any = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    });

    if (!result?.didCancel && result?.assets?.length > 0) {
      const img = result.assets[0];
      if (!img?.base64 || !img?.type) return;
      const imgUrl = `data:${img.type};base64,${img.base64}`;
      const fileName = img.fileName ?? 'image.png';
      sessionLogger.appendImageFrame(imgUrl);
      sessionLogger.appendFile(imgUrl, fileName);
      // send over WS (strip data: prefix)
      wsService.sendImageBase64(img.base64);
      // show in chat as a user message with preview
      const msg: Message = {
        id: `img_${Date.now()}`,
        text: '',
        from: 'user',
        timestamp: Date.now(),
        imageData: imgUrl,
        fileName,
      };
      setMessages(prev => [...prev, msg]);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.from === 'user';
    const ts = item.timestamp ? new Date(item.timestamp) : new Date();
    const tsLabel = ts.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    if (item.itinerary) {
      return (
        <View style={[styles.messageWrap, { alignItems: 'flex-start' }]}>
          {/* If there's accompanying bot text, show it above the itinerary card */}
          {item.text ? (
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={[styles.bubbleText, styles.botText]}>{item.text}</Text>
            </View>
          ) : null}
          <ItineraryCard itinerary={item.itinerary} onPress={() => onOpenItinerary?.(item.itinerary!)} />
          <Text style={styles.timestamp}>{tsLabel}</Text>
        </View>
      );
    }
    return (
      <View
        style={[
          styles.messageWrap,
          { alignItems: isUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}
        >
          {item.imageData ? (
            <Image
              source={{ uri: item.imageData }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.userText : styles.botText,
              ]}
            >
              {item.text}
            </Text>
          )}
        </View>
        <Text style={styles.timestamp}>{tsLabel}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor="#E9842F" translucent={false} />

      <HeaderBar
        showChatView
        onBackClick={() => {
          void sessionLogger.upload(token);
          onBack();
        }}
        isConnected={connected}
        isConnecting={!connected}
        onToggleChatView={() => {
          void sessionLogger.upload(token);
          onOpenAudio();
        }}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        style={styles.listBg}
        onContentSizeChange={() => {
          listRef.current?.scrollToEnd({ animated: true });
        }}
      />

      <View style={styles.inputBar}>
        <View style={[styles.inputWrapper, { minHeight: 44, height: inputHeight }]}>
          <TextInput
            style={[styles.input, { minHeight: 44, height: inputHeight }]}
            placeholder="Ask me anything..."
            placeholderTextColor="#AAAAAA"
            value={input}
            onChangeText={setInput}
            multiline
            onContentSizeChange={
              e =>
                setInputHeight(Math.min(e.nativeEvent.contentSize.height, 150)) // max height 150
            }
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <SendIcon disabled={!input.trim()} />
          </TouchableOpacity>
        </View>

        {/* <TouchableOpacity style={styles.circleBtn} onPress={pickImage}>
          <AttachCircleIcon />
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => {
            if (onOpenCamera) onOpenCamera();
          }}
        >
          <VideoCircleIcon />
        </TouchableOpacity>
      </View>

      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  onLogout?.();
                }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const SendIcon = ({ disabled }: { disabled: boolean }) => (
  <Svg width="22" height="22" viewBox="0 0 20 20" fill="none">
    <Path
      d="M8.55648 9.99889H3.90023M3.82088 10.2722L1.63189 16.811C1.45993 17.3246 1.37394 17.5815 1.43564 17.7396C1.48922 17.877 1.60433 17.9811 1.74634 18.0207C1.90986 18.0664 2.15686 17.9552 2.65086 17.733L18.318 10.683C18.8 10.466 19.0411 10.3574 19.1156 10.2066C19.1804 10.0757 19.1804 9.92208 19.1156 9.79114C19.0411 9.64042 18.8 9.53193 18.318 9.31495L2.6454 2.26238C2.15289 2.04075 1.90664 1.92994 1.74326 1.9754C1.60139 2.01487 1.48631 2.11874 1.43254 2.25583C1.37063 2.4137 1.45569 2.67 1.6258 3.18258L3.82149 9.79783"
      stroke={disabled ? '#C8C8C8' : '#757575'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AttachCircleIcon = () => (
  <Svg width={35} height={34} viewBox="0 0 35 34" fill="none">
    <Rect
      x="0.78"
      y="0.41"
      width="33.19"
      height="33.19"
      rx="16.59"
      fill="white"
    />
    <Rect
      x="0.78"
      y="0.41"
      width="33.19"
      height="33.19"
      rx="16.59"
      stroke="#E9E8E8"
      strokeWidth="0.81"
    />
    <Path
      d="M24.9686 16.085L17.4841 23.5694C15.7821 25.2715 13.0225 25.2715 11.3205 23.5694C9.61843 21.8674 9.61843 19.1078 11.3205 17.4058L18.8049 9.92134C19.9396 8.78664 21.7793 8.78664 22.914 9.92134C24.0487 11.056 24.0487 12.8957 22.914 14.0304L15.7231 21.2214C15.1557 21.7887 14.2359 21.7887 13.6685 21.2214C13.1012 20.654 13.1012 19.7342 13.6685 19.1668L19.9789 12.8564"
      stroke="#757575"
      strokeWidth="1.66"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VideoCircleIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 38 38" fill="none">
    <Rect
      x="0.46"
      y="0.46"
      width="37.08"
      height="37.08"
      rx="18.54"
      fill="white"
    />
    <Rect
      x="0.46"
      y="0.46"
      width="37.08"
      height="37.08"
      rx="18.54"
      stroke="#E9E8E8"
      strokeWidth="0.92"
    />
    <Path
      d="M28.2071 16.1743C28.2071 15.6165 28.2071 15.3377 28.0968 15.2085C28.0011 15.0965 27.8575 15.037 27.7106 15.0486C27.5413 15.0619 27.3441 15.2591 26.9497 15.6535L23.6035 18.9996L26.9497 22.3458C27.3441 22.7402 27.5413 22.9374 27.7106 22.9507C27.8575 22.9623 28.0011 22.9028 28.0968 22.7907C28.2071 22.6616 28.2071 22.3827 28.2071 21.8249V16.1743Z"
      stroke="#757575"
      strokeWidth="1.84"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.793 16.9741C9.793 15.4271 9.793 14.6537 10.094 14.0628C10.3588 13.5431 10.7814 13.1206 11.3011 12.8557C11.892 12.5547 12.6654 12.5547 14.2124 12.5547H19.1842C20.7311 12.5547 21.5046 12.5547 22.0954 12.8557C22.6151 13.1206 23.0377 13.5431 23.3025 14.0628C23.6035 14.6537 23.6035 15.4271 23.6035 16.9741V21.0252C23.6035 22.5721 23.6035 23.3456 23.3025 23.9364C23.0377 24.4561 22.6151 24.8787 22.0954 25.1435C21.5046 25.4446 20.7311 25.4446 19.1842 25.4446H14.2124C12.6654 25.4446 11.892 25.4446 11.3011 25.1435C10.7814 24.8787 10.3588 24.4561 10.094 23.9364C9.79297 23.3456 9.79297 22.5721 9.79297 21.0252V16.9741Z"
      stroke="#757575"
      strokeWidth="1.84"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFAF4' },
  listBg: { flex: 1, backgroundColor: '#FFFAF4' },
  list: { paddingHorizontal: 16, paddingBottom: 80, paddingTop: 16 },

  messageWrap: { marginVertical: 6, width: '100%' },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 10,
    borderTopRightRadius: 6,
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: '#FFE1BE',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#1f2937',
  },
  userText: { color: '#0f172a' },
  botText: { color: '#1f2937' },
  imagePreview: {
    width: 180,
    height: 180,
    borderRadius: 12,
  },
  timestamp: {
    marginTop: 4,
    fontSize: 11,
    color: '#666',
    paddingHorizontal: 4,
  },
  /* Input bar styling to match web */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFAF4',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9E8E8',
    paddingLeft: 16,
    paddingRight: 6,
    gap: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    paddingVertical: 10,
    textAlignVertical: 'center', // ensures text starts correctly in Android
  },
  sendBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'flex-end',
  },
  circleBtn: {
    width: 35,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalText: { fontSize: 14, color: '#4b5563', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  modalBtnText: { color: '#111827', fontWeight: '600' },
  modalBtnDanger: { backgroundColor: '#fee2e2' },
  modalBtnDangerText: { color: '#b91c1c' },
});

export default ChatScreen;
