import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  ImageBackground,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg';
import { wsService } from '../services/wsService';
import { env } from '../config/env';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import { audioService } from '../services/audioService';
import { sessionLogger } from '../services/sessionLogger';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderBar from './HeaderBar';
import SimpleControls from './controls/SimpleControls';
import Subtitles from './Subtitles';
import { Modal } from 'react-native';
import ItineraryCard from './ItineraryCard';
import { Itinerary, parseBackendItinerary } from '../utils/itinerary';
import { pcmPlayer } from '../services/pcmPlayer';
import { scalePcm16Base64 } from '../utils/pcm';
import { textBuffer } from '../services/textBuffer';
import { nativeLogger } from '../services/nativeLogger';
import { createJsBusyMonitor } from '../utils/jsBusy';

type Props = {
  onBack?: () => void;
  onOpenChat?: () => void;
  onOpenCamera?: () => void;
  onLogout?: () => void;
  onOpenItinerary?: (itinerary: Itinerary) => void;
  token: string;
};

const AudioScreen = ({
  onBack,
  onOpenChat,
  onOpenCamera,
  onLogout,
  onOpenItinerary,
  token,
}: Props) => {
  const DEFAULT_PLAYBACK_SAMPLE_RATE = 24000;
  const PLAYBACK_GAIN = 1.5;
  const [isListening, setIsListening] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [botStreamingText, setBotStreamingText] = useState('');
  const [userStreamingText, setUserStreamingText] = useState('');
  const [toolStatusText, setToolStatusText] = useState('');
  const [audioQueueCount, setAudioQueueCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMicPausedForPlayback, setIsMicPausedForPlayback] = useState(false);
  const [hasStoredBotMessages, setHasStoredBotMessages] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [isJsBusy, setIsJsBusy] = useState(false);
  const [hasPendingBotText, setHasPendingBotText] = useState(false);
  const currentBotTurnRef = useRef<{ text: string; audioStarted: boolean }>({
    text: '',
    audioStarted: false,
  });
  const isListeningRef = useRef(false);
  const outputTranscriptRef = useRef('');
  const usePcmPlayer = useRef(pcmPlayer.isSupported).current;
  const useNativeTextBuffer = useRef(textBuffer.isSupported).current;
  const needsPcmReinitRef = useRef(false);
  const textSeenThisTurnRef = useRef(false);
  const pendingAudioRef = useRef<
    { base64: string; mimeType?: string }[]
  >([]);
  const pendingAudioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pcmInitRef = useRef(false);
  const pcmPlaybackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pcmPlaybackRemainMsRef = useRef(0);
  const pcmSampleRateRef = useRef(DEFAULT_PLAYBACK_SAMPLE_RATE);
  const pendingMicStartRef = useRef(false);
  const playbackEndTimestampRef = useRef(0);
  const unmuteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const setSendSuppressedSafe = useCallback((suppressed: boolean) => {
    return;
  }, []);
  const handleMicToggle = useCallback(async () => {
    const ok = await requestMicPermission();
    if (!ok) return;
    setIsListening(prev => !prev);
    if (!isListening) {
      audioService.setAudioEnabled(true);
      if (wsService.isOpen()) {
        audioService.startRecording();
      } else {
        pendingMicStartRef.current = true;
      }
    } else {
      audioService.stopRecording();
      audioService.setAudioEnabled(false);
      setUserStreamingText('');
    }
  }, [isListening]);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const handleVideoToggle = useCallback(async () => {
    // Prefer dedicated camera screen if provided
    if (onOpenCamera) {
      onOpenCamera();
      return;
    }

    nativeLogger.log('AUDIO', { cameraTogglePressed: isVideoOpen });
    if (!isVideoOpen) {
      setVideoError(null);
      const ok = await requestCameraPermission();
      if (!ok) return;
      try {
        const stream = await mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        nativeLogger.log('AUDIO', 'camera stream started');
        setVideoStream(stream);
        setIsVideoLoaded(true);
        setIsVideoOpen(true);
      } catch (e) {
        nativeLogger.warn('AUDIO', { cameraError: e });
        setVideoError('Camera failed to start');
        setIsVideoOpen(false);
        setIsVideoLoaded(false);
        setVideoStream(null);
      }
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        nativeLogger.log('AUDIO', 'camera stream stopped');
        setVideoStream(null);
      }
      setIsVideoLoaded(false);
      setIsVideoOpen(false);
    }
  }, [isVideoOpen, videoStream, onOpenCamera]);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const handleBack = useCallback(() => {
    void sessionLogger.upload(token);
    onBack?.();
  }, [onBack, token]);
  const statusText = useMemo(() => {
    if (!connected) return 'Connecting...';
    if (isVideoOpen) return 'Camera Active';
    if (isListening) return 'Listening...';
    return 'Tap mic to start';
  }, [connected, isListening, isVideoOpen]);

  const playbackBuffersRef = useRef<Buffer[]>([]);
  const playbackBytesRef = useRef(0);
  const isProcessingQueue = useRef(false);
  const newBotTurnRef = useRef(true);
  const resetPlaybackForNewUserTurn = useCallback(() => {
    playbackBuffersRef.current = [];
    playbackBytesRef.current = 0;
    pendingAudioRef.current = [];
    playbackEndTimestampRef.current = 0;
    if (unmuteTimerRef.current) {
      clearTimeout(unmuteTimerRef.current);
      unmuteTimerRef.current = null;
    }
    if (pendingAudioTimerRef.current) {
      clearTimeout(pendingAudioTimerRef.current);
      pendingAudioTimerRef.current = null;
    }
    setAudioQueueCount(0);
    setIsPlaying(false);
    pcmPlayer.stop().catch(() => {});
  }, []);

  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'Allow access to microphone for voice assistant.',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // Show intro text only on the very first app run (per install)
  useEffect(() => {
    AsyncStorage.getItem('intro_seen_once')
      .then(val => {
        if (val === '1') {
          setIntroVisible(false);
          return;
        }
        setIntroVisible(true);
        // Hide after a short display and mark as seen
        setTimeout(() => setIntroVisible(false), 1200);
        void AsyncStorage.setItem('intro_seen_once', '1').catch(() => {});
      })
      .catch(() => setIntroVisible(true));
  }, []);

  // Hide intro as soon as real bot text starts streaming
  useEffect(() => {
    if (botStreamingText) {
      setIntroVisible(false);
    }
  }, [botStreamingText]);

  useEffect(() => {
    if (!hasPendingBotText) return;
    const timer = setInterval(() => {
      setBotStreamingText(outputTranscriptRef.current);
      setHasPendingBotText(false);
    }, 50);
    return () => clearInterval(timer);
  }, [hasPendingBotText]);

  useEffect(() => {
    const monitor = createJsBusyMonitor(setIsJsBusy);
    monitor.start();
    return () => monitor.stop();
  }, []);

  // Listen to shared WS events
  useEffect(() => {
    if (!env.wsHost || !token) return;
    const unsubscribe = wsService.on(evt => {
      switch (evt.type) {
        case 'connected':
        case 'setup_complete':
          setConnected(true);
          if (pendingMicStartRef.current && isListeningRef.current) {
            pendingMicStartRef.current = false;
            audioService.startRecording();
          }
          break;
        case 'text_chunk':
          // Skip text_chunk to reduce JS load; rely on output_transcription.
          break;
        case 'output_transcription':
          if (evt.text) {
            if (evt.text === 'null') break;
            setSendSuppressedSafe(true);
            if (toolStatusText) {
              setToolStatusText('');
            }
            if (evt.type === 'output_transcription') {
              if (useNativeTextBuffer) {
                textBuffer.add(evt.text);
              }
              outputTranscriptRef.current = outputTranscriptRef.current
                ? outputTranscriptRef.current + evt.text
                : evt.text;
              setHasPendingBotText(true);
              textSeenThisTurnRef.current = true;
              flushPendingAudio();
              break;
            }
          }
          break;
        case 'input_transcription':
          if (evt.text) {
            if (evt.text === 'null') break;
            if (isPlaying || audioQueueCount > 0) {
              resetPlaybackForNewUserTurn();
            }
            sessionLogger.appendUser(evt.text);
            setUserStreamingText(prev => {
              if (!prev) return evt.text;
              const needsSpace = !prev.endsWith(' ') && !evt.text.startsWith(' ');
              return needsSpace ? `${prev} ${evt.text}` : prev + evt.text;
            });
            setPickedImage(prev => {
              if (prev)
                nativeLogger.log('AUDIO', 'clearing picked image due to user text');
              return prev ? null : prev;
            });
          }
          break;
        case 'audio_chunk':
          if (evt.audio_data || evt.chunk_size) {
            const bytes =
              typeof evt.chunk_size === 'number' && evt.chunk_size > 0
                ? evt.chunk_size
                : Math.floor(((evt.audio_data || '').length * 3) / 4);
            try {
              if (evt.audio_data) {
                updatePlaybackGate(evt.audio_data, evt.mime_type);
              } else if (bytes > 0) {
                const sampleRate =
                  parseSampleRate(evt.mime_type) ?? DEFAULT_PLAYBACK_SAMPLE_RATE;
                const chunkDurationMs = (bytes / (sampleRate * 2)) * 1000;
                const now = Date.now();
                if (playbackEndTimestampRef.current < now) {
                  playbackEndTimestampRef.current = now + chunkDurationMs;
                } else {
                  playbackEndTimestampRef.current += chunkDurationMs;
                }
                setSendSuppressedSafe(true);
                scheduleUnmute();
              }
            } catch (err) {
              nativeLogger.warn('AUDIO_STREAM', {
                updatePlaybackGateError: err,
              });
            }
            if (evt.audio_data) {
              if (usePcmPlayer && needsPcmReinitRef.current) {
                const sampleRate =
                  parseSampleRate(evt.mime_type) ?? DEFAULT_PLAYBACK_SAMPLE_RATE;
                needsPcmReinitRef.current = false;
                pcmPlayer.init(sampleRate).catch(err =>
                  nativeLogger.warn('AUDIO', { pcmReinitError: err }),
                );
              }
              sessionLogger.appendBotAudioChunk(evt.audio_data);
              enqueueAudioChunk(evt.audio_data, evt.mime_type).catch(err =>
                nativeLogger.warn('AUDIO', { enqueueChunkError: err }),
              );
            }
          }
          break;
        case 'turn_complete':
          sessionLogger.flushBotAudioTurn();
          // Clear bot text on turn end.
          newBotTurnRef.current = true;
          currentBotTurnRef.current = { text: '', audioStarted: false };
          textSeenThisTurnRef.current = false;
          outputTranscriptRef.current = '';
          setBotStreamingText('');
          setToolStatusText('');
          if (useNativeTextBuffer) {
            textBuffer.reset();
          }
          setUserStreamingText('');
          if (!usePcmPlayer) {
            maybeStartPlayback(true, pcmSampleRateRef.current);
          }
          if (!isPlaying && audioQueueCount === 0) {
            setSendSuppressedSafe(false);
          }
          break;
        case 'interrupted':
          nativeLogger.warn('AUDIO_STREAM', 'turn interrupted');
          playbackBuffersRef.current = [];
          playbackBytesRef.current = 0;
          setAudioQueueCount(0);
          setIsPlaying(false);
          setBotStreamingText('');
          setItineraries([]);
          currentBotTurnRef.current = { text: '', audioStarted: false };
          newBotTurnRef.current = true;
          textSeenThisTurnRef.current = false;
          pendingAudioRef.current = [];
          playbackEndTimestampRef.current = 0;
          if (unmuteTimerRef.current) {
            clearTimeout(unmuteTimerRef.current);
            unmuteTimerRef.current = null;
          }
          setSendSuppressedSafe(false);
          pcmPlayer.stop().catch(() => {});
          needsPcmReinitRef.current = true;
          if (pendingAudioTimerRef.current) {
            clearTimeout(pendingAudioTimerRef.current);
            pendingAudioTimerRef.current = null;
          }
          if (useNativeTextBuffer) {
            textBuffer.reset();
          } else {
            outputTranscriptRef.current = '';
          }
          break;
        case 'tool_call_start': {
          setToolStatusText('Thinking...');
          setBotStreamingText('');
          outputTranscriptRef.current = '';
          textSeenThisTurnRef.current = false;
          if (useNativeTextBuffer) {
            textBuffer.reset();
          }
          break;
        }
        case 'tool_call_complete':
          setToolStatusText('Done');
          break;
        case 'tool_status': {
          const label = evt.label || evt.phase || evt.tool || 'Working...';
          setToolStatusText(label);
          break;
        }
        case 'tool_summary': {
          const summary = evt.summary || evt.tool || 'Done';
          setToolStatusText(summary);
          break;
        }
        case 'itinerary': {
          const parsed = parseBackendItinerary(evt.data);
          nativeLogger.log('AUDIO', { itinerary: evt.data, parsed });
          if (parsed) {
            setItineraries(prev => {
              const existing = prev.filter(i => i.id !== parsed.id);
              return [parsed, ...existing];
            });
            void sessionLogger.appendItinerary(parsed);
          }
          break;
        }
      }
    });
    return () => unsubscribe();
  }, [token, enqueueAudioChunk, isPlaying, audioQueueCount]);

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'Allow access to camera for live previews.',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoStream]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    sessionLogger
      .hasBotMessages()
      .then(setHasStoredBotMessages)
      .catch(() => setHasStoredBotMessages(false));
    unsub = sessionLogger.onCleared(() => setHasStoredBotMessages(false));
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
      nativeLogger.log('AUDIO', { pcmPlayerSupported: usePcmPlayer });
    if (!usePcmPlayer) return;
    pcmPlayer
      .init(DEFAULT_PLAYBACK_SAMPLE_RATE)
      .then(() => {
        pcmInitRef.current = true;
        pcmSampleRateRef.current = DEFAULT_PLAYBACK_SAMPLE_RATE;
      })
      .catch(err => nativeLogger.warn('AUDIO', { pcmInitError: err }));
    return () => {
      pcmInitRef.current = false;
      if (pcmPlaybackTimerRef.current) {
        clearTimeout(pcmPlaybackTimerRef.current);
        pcmPlaybackTimerRef.current = null;
      }
      pcmPlaybackRemainMsRef.current = 0;
      pcmPlayer.stop().catch(() => {});
      pcmPlayer.release().catch(() => {});
    };
  }, [usePcmPlayer]);

  useEffect(() => {
    if (!useNativeTextBuffer) return;
    return textBuffer.onUpdate(text => {
      setBotStreamingText(text);
    });
  }, [useNativeTextBuffer]);

  const STREAM_START_MS = 1000;
  const getStreamStartBytes = (sampleRate: number) =>
    Math.floor((sampleRate * 2 * STREAM_START_MS) / 1000);

  const parseSampleRate = (mimeType?: string) => {
    if (!mimeType) return undefined;
    const match = mimeType.match(/rate=(\d+)/i);
    if (!match) return undefined;
    const rate = Number(match[1]);
    return Number.isFinite(rate) ? rate : undefined;
  };

  const scheduleUnmute = useCallback(() => {
    if (unmuteTimerRef.current) {
      clearTimeout(unmuteTimerRef.current);
      unmuteTimerRef.current = null;
    }
    const remaining = playbackEndTimestampRef.current - Date.now();
    const delay = Math.max(0, remaining + 200);
    unmuteTimerRef.current = setTimeout(() => {
      setSendSuppressedSafe(false);
      unmuteTimerRef.current = null;
    }, delay);
  }, []);

  const updatePlaybackGate = useCallback(
    (base64: string, mimeType?: string) => {
      const sampleRate =
        parseSampleRate(mimeType) ?? DEFAULT_PLAYBACK_SAMPLE_RATE;
      const byteLength = (base64.length * 3) / 4;
      const chunkDurationMs = (byteLength / (sampleRate * 2)) * 1000;
      const now = Date.now();
      if (playbackEndTimestampRef.current < now) {
        playbackEndTimestampRef.current = now + chunkDurationMs;
      } else {
        playbackEndTimestampRef.current += chunkDurationMs;
      }
      setSendSuppressedSafe(true);
      scheduleUnmute();
    },
    [scheduleUnmute, setSendSuppressedSafe],
  );

  const maybeStartPlayback = useCallback(
    (force = false, sampleRate = DEFAULT_PLAYBACK_SAMPLE_RATE) => {
      if (isProcessingQueue.current) return;
      const hasEnough =
        playbackBytesRef.current >= getStreamStartBytes(sampleRate);
      if (force || hasEnough) {
        processAudioQueue();
      }
    },
    [processAudioQueue],
  );

  const enqueueAudioChunk = useCallback(
    async (base64: string, mimeType?: string) => {
      if (!base64) return;
      nativeLogger.log('AUDIO', {
        enqueueRequested: {
        bytes: Math.floor((base64.length * 3) / 4),
        mimeType,
        usePcmPlayer,
        },
      });
      if (!usePcmPlayer) {
        // Skip playback if native PCM player is unavailable.
        return;
      }
      const boostedBase64 = scalePcm16Base64(base64, PLAYBACK_GAIN);
      const sampleRate =
        parseSampleRate(mimeType) ?? DEFAULT_PLAYBACK_SAMPLE_RATE;
      if (usePcmPlayer) {
        if (!pcmInitRef.current) {
          nativeLogger.log('AUDIO', 'pcm player init on first chunk');
        }
        if (
          !pcmInitRef.current ||
          pcmSampleRateRef.current !== sampleRate
        ) {
          await pcmPlayer.init(sampleRate);
          pcmInitRef.current = true;
          pcmSampleRateRef.current = sampleRate;
        }
        nativeLogger.log('AUDIO', 'enqueue PCM (native streamer)');
        setIsPlaying(true);
        setAudioQueueCount(prev => prev + 1);
        try {
          const pcmBytes = Buffer.from(boostedBase64, 'base64');
          const durationMs =
            (pcmBytes.length / (sampleRate * 2)) * 1000;
          pcmPlaybackRemainMsRef.current += durationMs;
          if (pcmPlaybackTimerRef.current) {
            clearTimeout(pcmPlaybackTimerRef.current);
          }
          pcmPlaybackTimerRef.current = setTimeout(() => {
            pcmPlaybackRemainMsRef.current = 0;
            pcmPlaybackTimerRef.current = null;
            setIsPlaying(false);
            setBotStreamingText('');
            playbackEndTimestampRef.current = 0;
            setSendSuppressedSafe(false);
          }, pcmPlaybackRemainMsRef.current);
          await pcmPlayer.enqueue(boostedBase64);
        } finally {
          setAudioQueueCount(prev => Math.max(prev - 1, 0));
        }
        return;
      }
      nativeLogger.warn('AUDIO', 'enqueue PCM (fallback WAV path)');
      const pcmBytes = Buffer.from(boostedBase64, 'base64');
      playbackBuffersRef.current.push(pcmBytes);
      playbackBytesRef.current += pcmBytes.length;
      setAudioQueueCount(playbackBuffersRef.current.length);
      maybeStartPlayback(false, sampleRate);
    },
    [maybeStartPlayback, usePcmPlayer],
  );

  const flushPendingAudio = useCallback(() => {
    const pending = pendingAudioRef.current.splice(0);
    if (!pending.length) return;
    pending.forEach(({ base64, mimeType }) => {
      enqueueAudioChunk(base64, mimeType).catch(() => {});
    });
  }, [enqueueAudioChunk]);

  useEffect(() => {
    const isGlowing = isPlaying || audioQueueCount > 0;
    if (isGlowing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [isPlaying, audioQueueCount, glowAnim]);

  const processAudioQueue = React.useCallback(async () => {
    if (usePcmPlayer) return;
    if (isProcessingQueue.current || playbackBuffersRef.current.length === 0)
      return;
    isProcessingQueue.current = true;
    try {
      while (playbackBuffersRef.current.length > 0) {
        const buffers = playbackBuffersRef.current.splice(
          0,
          playbackBuffersRef.current.length,
        );
        playbackBytesRef.current = 0;
        setAudioQueueCount(playbackBuffersRef.current.length);
        const pcmBuffer =
          buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);
          if (!pcmBuffer) continue;
          try {
          if (
            !currentBotTurnRef.current.audioStarted &&
            currentBotTurnRef.current.text
          ) {
            setBotStreamingText(currentBotTurnRef.current.text);
            currentBotTurnRef.current.audioStarted = true;
          }
          setIsPlaying(true);
          const wavBuffer = buildWav(
            pcmBuffer,
            pcmSampleRateRef.current || DEFAULT_PLAYBACK_SAMPLE_RATE,
            1,
          );
          const filePath = `${
            RNFS.TemporaryDirectoryPath
          }/chunk-${Date.now()}.wav`;
          await RNFS.writeFile(filePath, wavBuffer.toString('base64'), 'base64');
          await playSound(filePath);
          await RNFS.unlink(filePath).catch(() => {});
        } catch (e) {
          nativeLogger.warn('AUDIO', { playbackError: e });
        }
      }
    } finally {
      setIsPlaying(false);
      setBotStreamingText('');
      currentBotTurnRef.current.audioStarted = false;
      newBotTurnRef.current = true;
      isProcessingQueue.current = false;
      setAudioQueueCount(playbackBuffersRef.current.length);
      if (playbackBuffersRef.current.length > 0) {
        processAudioQueue();
      }
    }
  }, [usePcmPlayer]);

  const playSound = (path: string) =>
    new Promise<void>((resolve, reject) => {
      const sound = new Sound(path, '', error => {
        if (error) {
          reject(error);
          return;
        }
        sound.play(success => {
          sound.release();
          if (success) resolve();
          else reject(new Error('Playback failed'));
        });
      });
    });

  const buildWav = (pcmBytes: Buffer, sampleRate: number, channels: number) => {
    const byteRate = sampleRate * channels * 2;
    const blockAlign = channels * 2;
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + pcmBytes.length, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(channels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBytes.length, 40);
    return Buffer.concat([wavHeader, pcmBytes]);
  };

  const isBotActive = isPlaying || audioQueueCount > 0 || !!botStreamingText;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#E9842F" translucent={false} />
      <HeaderBar
        showChatView={false}
        onBackClick={handleBack}
        isConnected={connected}
        isConnecting={!connected}
        onConnectionToggle={() => {}}
        onToggleChatView={() => {
          void sessionLogger.upload(token);
          onOpenChat?.();
        }}
        onChatClick={() => {
          void sessionLogger.upload(token);
          onOpenChat?.();
        }}
        onLogout={() => {
          setShowLogoutConfirm(true);
        }}
        isJsBusy={isJsBusy}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.circleWrap}>
            <View style={[styles.wave, isListening && styles.waveActive]} />
            <View
              style={[styles.waveInner, isListening && styles.waveInnerActive]}
            />
            <View style={styles.innerWave}>
              {isBotActive ? (
                <>
                  <ImageBackground
                    source={require('../../assets/web-public/botactive.gif')}
                    style={styles.circleBg}
                    imageStyle={styles.circleBgImage}
                  ></ImageBackground>
                </>
              ) : isListening ? (
                <ImageBackground
                  source={require('../../assets/web-public/useractive.gif')}
                  style={styles.circleBg}
                  imageStyle={styles.circleBgImage}
                ></ImageBackground>
              ) : <ImageBackground
                  source={require('../../assets/web-public/cameraimage.png')}
                  style={styles.circleBg}
                  imageStyle={styles.circleBgImage}
                ></ImageBackground>}
            </View>
          </View>

          <View style={styles.subtextBox}>
            <Subtitles
              botText={
                botStreamingText ||
                toolStatusText ||
                (introVisible
                  ? 'नमस्ते! मैं दिव्या दर्शक। आपकी मदद के लिए तैयार हूँ।'
                  : '')
              }
              userText={userStreamingText}
              isUserSpeaking={isListening && !!userStreamingText}
              isBotSpeaking={isBotActive}
              isVideoMode
            />
          </View>

          {pickedImage && (
            <View style={styles.previewWrap}>
              <View style={styles.previewCard}>
                <Image
                  source={{ uri: pickedImage.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {itineraries.length > 0 ? (
            <View style={styles.itinerarySection}>
              {itineraries.map(itinerary => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  onPress={() => onOpenItinerary?.(itinerary)}
                />
              ))}
            </View>
          ) : null}
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
                  <Text
                    style={[styles.modalBtnText, styles.modalBtnDangerText]}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <SimpleControls
          isVideoOpen={isVideoOpen}
          isListening={isListening}
          onVideoClick={handleVideoToggle}
          onMicToggle={handleMicToggle}
          onImagePicked={(uri, name) => setPickedImage({ uri, name })}
        />
        {isVideoOpen && videoStream && (
          <View style={styles.videoPreview}>
            {!isVideoLoaded && (
              <Text style={styles.videoLoading}>Loading camera...</Text>
            )}
            {videoError ? (
              <Text style={styles.videoLoading}>{videoError}</Text>
            ) : null}
            <RTCView
              streamURL={videoStream.toURL()}
              style={styles.rtcView}
              objectFit="cover"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFAF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFAF4',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  backText: {
    fontSize: 22,
    color: '#374151',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
  },
  content: {
    height: '90%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFAF4',
  },
  mainCard: {
    height: '100%',
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  switchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c2410c',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  wave: {
    position: 'absolute',
    top: -20,
    backgroundColor: 'rgba(252, 106, 2, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  circleWrap: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(252, 106, 2, 1)',
    zIndex: 0,
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -100,
  },
  innerWave: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    transform: [{ translateY: -100 }],
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 85,
    borderWidth: 10,
    borderColor: 'rgba(252, 106, 2, 0.9)',
    backgroundColor: 'transparent',
    shadowColor: '#f97316',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 0,
  },
  waveInner: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  circleBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 85,
  },
  sphereBg: {
    width: '80%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 85,
  },
  circleBgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
  },
   sphereBgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#324673',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  circleEmoji: {
    fontSize: 42,
    color: '#ffffff',
  },
  subtextBox: {
    marginTop: 12,
    padding: 0,
    maxHeight: 180,
    minHeight: 60,
  },
  subtextScroll: {
    maxHeight: 120,
  },
  subtext: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  previewWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  itinerarySection: {
    display: 'flex',
    alignItems: 'center',
    marginTop:0,
  },
  itineraryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  previewCard: {
    width: 300,
    maxHeight: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
  },
  previewLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  previewLabelText: {
    color: '#fff',
    fontSize: 12,
  },
  chatButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f97316',
    borderRadius: 12,
  },
  chatLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  controls: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  controlActive: {
    backgroundColor: '#305D8E',
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  quickItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  videoPreview: {
    marginTop: 20,
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rtcView: {
    width: '100%',
    height: '100%',
  },
  videoLoading: {
    position: 'absolute',
    top: 10,
    zIndex: 2,
    color: '#fff',
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

// Inline SVG icon components to avoid asset resolution issues
const MicIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10v1a7 7 0 01-14 0v-1"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 21h8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SwitchIcon = ({ size = 18, color = '#c2410c' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 7h13M4 7l3-3-3 3zm0 0l3 3-3-3zM17 17H4m16 0l-3-3 3 3zm0 0l-3 3 3-3z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VideoIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={6}
      width={11}
      height={12}
      rx={2}
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M15 10l5-3v10l-5-3v-4z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

const StopVideoIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={6}
      width={11}
      height={12}
      rx={2}
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M15 10l5-3v10l-5-3v-4z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Line
      x1={5}
      y1={5}
      x2={19}
      y2={19}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ChatIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 5h14v10H7l-2 2V5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 9h6M9 12h3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const BotIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={5}
      y={8}
      width={14}
      height={10}
      rx={3}
      stroke={color}
      strokeWidth={2}
    />
    <Circle cx={9} cy={13} r={1} fill={color} />
    <Circle cx={15} cy={13} r={1} fill={color} />
    <Path d="M12 5v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 5h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const WindowIcon = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={6}
      width={16}
      height={12}
      rx={2}
      stroke={color}
      strokeWidth={2}
    />
    <Line
      x1={4}
      y1={10}
      x2={20}
      y2={10}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx={8} cy={8} r={0.6} fill={color} />
    <Circle cx={11} cy={8} r={0.6} fill={color} />
    <Circle cx={14} cy={8} r={0.6} fill={color} />
  </Svg>
);
export default AudioScreen;
