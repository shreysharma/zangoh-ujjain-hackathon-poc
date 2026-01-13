import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, PermissionsAndroid } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { wsService } from '../services/wsService';
import { env } from '../config/env';
import { sessionLogger } from '../services/sessionLogger';
import { audioService } from '../services/audioService';
import { nativeLogger } from '../services/nativeLogger';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import ComprehensiveControls from './controls/ComprehensiveControls';
import { scalePcm16Base64 } from '../utils/pcm';
import { imageCompress } from '../services/imageCompress';

type Props = {
  onBack: () => void;
  token: string;
};

const CameraScreen = ({ onBack, token }: Props) => {
  const DEFAULT_PLAYBACK_SAMPLE_RATE = 24000;
  const PLAYBACK_GAIN = 1.5;
  const [hasCamPermission, setHasCamPermission] = useState(false);
  const [camStatus, setCamStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isSending, setIsSending] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [lastSendLog, setLastSendLog] = useState<string>('');
  const [streamingText, setStreamingText] = useState('');
  const [audioQueueCount, setAudioQueueCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicPausedForPlayback, setIsMicPausedForPlayback] = useState(false);
  const [micAllowed, setMicAllowed] = useState(true);
  const autoStartedRef = useRef(false);
  const newBotTurnRef = useRef(true);
  const chunkQueueRef = useRef<Buffer[]>([]);
  const isProcessingQueue = useRef(false);
  const pcmSampleRateRef = useRef(DEFAULT_PLAYBACK_SAMPLE_RATE);
  const cameraRef = useRef<Camera>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const device = useCameraDevice(facing);

  useEffect(() => {
    if (device) {
      nativeLogger.log('CAMERA', { deviceReady: { id: device.id, position: device.position } });
      setCamStatus('granted');
    } else {
      nativeLogger.log('CAMERA', { waitingForDevice: camStatus });
    }
  }, [device, camStatus]);

  // Auto-start streaming once device & permission are ready (only once per mount)
  useEffect(() => {
    if (device && hasCamPermission && !isSending && !autoStartedRef.current) {
      autoStartedRef.current = true;
      nativeLogger.log('CAMERA', 'auto-start streaming');
      toggleSend();
    }
  }, [device, hasCamPermission, isSending]);

  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Microphone Permission',
      message: 'Allow access to microphone for audio streaming.',
      buttonPositive: 'OK',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };
  const handleClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    audioService.stopRecording();
    setIsSending(false);
    onBack();
  }, [onBack]);

  useEffect(() => {
    Camera.requestCameraPermission()
      .then(status => {
        const ok = status === 'authorized' || status === 'granted';
        setHasCamPermission(ok);
        setCamStatus(ok ? 'granted' : 'denied');
        nativeLogger.log('CAMERA', { permissionStatus: status });
      })
      .catch(err => {
        nativeLogger.warn('CAMERA', { permissionRequestError: err });
        setHasCamPermission(false);
        setCamStatus('denied');
      });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      audioService.stopRecording();
    };
  }, []);

  useEffect(() => {
    if (!env.wsHost || !token) return;
    wsService.connect({
      host: env.wsHost,
      apiKey: env.wsApiKey,
      authToken: token,
      modality: ['AUDIO', 'TEXT'],
    });
    wsService.sendText('[camera_screen_open]');
    const unsub = wsService.on(evt => {
      if (evt.type === 'error') nativeLogger.warn('CAMERA', { wsError: evt.error });
      switch (evt.type) {
        case 'text_chunk':
        case 'output_transcription':
          if (evt.text) {
            setStreamingText(prev =>
              newBotTurnRef.current ? evt.text : prev + evt.text,
            );
            newBotTurnRef.current = false;
            sessionLogger.appendBot(evt.text);
          }
          break;
        case 'input_transcription':
          if (evt.text) sessionLogger.appendUser(evt.text);
          break;
        case 'audio_chunk':
          if (evt.audio_data) {
            sessionLogger.appendBotAudioChunk(evt.audio_data);
            enqueueAudioChunk(evt.audio_data, evt.mime_type).catch(err =>
              nativeLogger.warn('CAMERA', { enqueueError: err }),
            );
          }
          break;
        case 'turn_complete':
          sessionLogger.flushBotAudioTurn();
          // keep subtitles until audio queue drains
          newBotTurnRef.current = true;
          break;
      }
    });
    return () => unsub();
  }, [token, enqueueAudioChunk]);

  const toggleSend = () => {
    if (!wsService.isOpen()) {
      nativeLogger.warn('CAMERA', 'WS not connected, cannot start streaming');
      return;
    }
    if (!hasCamPermission) {
      Camera.requestCameraPermission()
        .then(status => {
          const ok = status === 'authorized' || status === 'granted';
          setHasCamPermission(ok);
          setCamStatus(ok ? 'granted' : 'denied');
          nativeLogger.log('CAMERA', { permissionStatusToggle: status });
        })
        .catch(err => {
          nativeLogger.warn('CAMERA', { permissionRequestToggleError: err });
          setHasCamPermission(false);
          setCamStatus('denied');
        });
      return;
    }
    if (!device) {
      nativeLogger.warn('CAMERA', 'no camera device available');
      return;
    }
    // mic permission for audio recording on Android (but still send frames if denied)
    requestMicPermission()
      .then(micOk => {
        if (!micOk) {
          nativeLogger.warn('CAMERA', 'microphone permission denied; sending frames without mic');
          setMicAllowed(false);
        } else {
          setMicAllowed(true);
        }
        continueSend();
      })
      .catch(err => {
        nativeLogger.warn('CAMERA', { microphonePermissionError: err });
        setMicAllowed(false);
        continueSend();
      });
    return;
  }

  const continueSend = () => {
    if (isSending) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (micAllowed) {
        audioService.stopRecording();
      }
      wsService.sendText('[camera_stop]');
      setIsSending(false);
      return;
    }
    setIsSending(true);
    if (micAllowed) {
      audioService.setAudioEnabled(true);
      nativeLogger.log('CAMERA', 'mic streaming start');
      audioService.startRecording();
    } else {
      audioService.setAudioEnabled(false);
    }
    wsService.sendText('[camera_start]');
    intervalRef.current = setInterval(async () => {
      if (!cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
          skipMetadata: true,
        });
        if (!photo?.path) return;
        const base64 = await RNFS.readFile(photo.path, 'base64');
        const compressed = await imageCompress.compressBase64(
          base64,
          70,
          1280,
          1280,
        );
        const preview = `${compressed.slice(0, 32)}...${compressed.slice(-32)}`;
        nativeLogger.log('CAMERA', { sendingFrame: { length: compressed.length, preview } });
        wsService.sendImageBase64(compressed, 'image/jpeg');
        setLastSendLog(`Sent frame at ${new Date().toLocaleTimeString()}`);
        sessionLogger.appendImageFrame(`data:image/jpeg;base64,${compressed}`);
        await RNFS.unlink(photo.path).catch(() => {});
      } catch (e) {
        nativeLogger.warn('CAMERA', { captureError: e });
      }
    }, 800);
  };

  const parseSampleRate = (mimeType?: string) => {
    if (!mimeType) return undefined;
    const match = mimeType.match(/rate=(\d+)/i);
    if (!match) return undefined;
    const rate = Number(match[1]);
    return Number.isFinite(rate) ? rate : undefined;
  };

  const enqueueAudioChunk = useCallback(
    async (base64: string, mimeType?: string) => {
      if (!base64) return;
      const boostedBase64 = scalePcm16Base64(base64, PLAYBACK_GAIN);
      const sampleRate =
        parseSampleRate(mimeType) ?? DEFAULT_PLAYBACK_SAMPLE_RATE;
      pcmSampleRateRef.current = sampleRate;
      const pcmBytes = Buffer.from(boostedBase64, 'base64');
      chunkQueueRef.current.push(pcmBytes);
      setAudioQueueCount(chunkQueueRef.current.length);
      processAudioQueue();
    },
    [processAudioQueue],
  );

  const processAudioQueue = useCallback(async () => {
    if (isProcessingQueue.current || chunkQueueRef.current.length === 0) return;
    isProcessingQueue.current = true;
    while (chunkQueueRef.current.length > 0) {
      const buffers = chunkQueueRef.current.splice(0, chunkQueueRef.current.length);
      setAudioQueueCount(chunkQueueRef.current.length);
      if (!buffers.length) continue;
      try {
        setIsPlaying(true);
        const combined = Buffer.concat(buffers);
        const wavBuffer = buildWav(
          combined,
          pcmSampleRateRef.current || DEFAULT_PLAYBACK_SAMPLE_RATE,
          1,
        );
        const filePath = `${RNFS.TemporaryDirectoryPath}/cam-chunk-${Date.now()}.wav`;
        await RNFS.writeFile(filePath, wavBuffer.toString('base64'), 'base64');
        await playSound(filePath);
        await RNFS.unlink(filePath).catch(() => {});
      } catch (e) {
        nativeLogger.warn('CAMERA', { playbackError: e });
      } finally {
        setIsPlaying(false);
      }
    }
    setStreamingText('');
    newBotTurnRef.current = true;
    isProcessingQueue.current = false;
  }, []);

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {/* <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Camera Preview</Text>
        <View style={{ width: 36 }} />
      </View> */}

      <View style={styles.preview}>
        {device && hasCamPermission ? (
          <Camera
            ref={cameraRef}
            style={styles.rtc}
            device={device}
            isActive={true}
            photo
          />
        ) : (
          <Text style={styles.info}>
            {!hasCamPermission || camStatus === 'denied'
              ? 'Camera permission required. Please grant access.'
              : 'Loading camera...'}
          </Text>
        )}
      </View>

      <ComprehensiveControls
        isListening={isSending}
        onVideoClick={handleClose}
        onCameraSwitch={() => {
          const next = facing === 'front' ? 'back' : 'front';
          setFacing(next);
          wsService.sendText(`[camera_switch:${next}]`);
        }}
        onMicToggle={toggleSend}
      />
      {/* {lastSendLog ? <Text style={styles.sendLog}>{lastSendLog}</Text> : null} */}
      {streamingText ? (
        <View style={styles.subtitleBox}>
          <Text style={styles.subtitle}>{streamingText}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 22 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  preview: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  rtc: { width: '100%', height: '100%' },
  info: { color: '#fff', textAlign: 'center', marginTop: 20 },
  sendLog: { color: '#fff', textAlign: 'center', marginBottom: 8, fontSize: 12 },
  subtitleBox: {
    position: 'absolute',
    top: 80, left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subtitle: { color: '#fff', textAlign: 'center' },
  queue: { color: '#f97316', textAlign: 'center', marginTop: 4, fontSize: 12 },
});

export default CameraScreen;
