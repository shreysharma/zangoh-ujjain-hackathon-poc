// Mic streaming via react-native-audio-record (Base64 PCM16 @16kHz).
// Guarded to avoid crashes when the native module is absent.
import { NativeModules, Platform } from 'react-native';
import { wsService } from './wsService';
import { sessionLogger } from './sessionLogger';
import { scalePcm16Base64 } from '../utils/pcm';
import { Buffer } from 'buffer';
import { nativeLogger } from './nativeLogger';

const MIC_GAIN = 1.5;
const VAD_RMS_THRESHOLD = 1200;
const VAD_ON_FRAMES = 3;
const VAD_OFF_FRAMES = 6;

class AudioService {
  private isAudioEnabled = false;
  private isRecording = false;
  private recorder: any | null = null;
  private useNativeMic = false;
  private dataHandler: ((data: string) => void) | null = null;
  private dataCount = 0;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private userTurnChunks: string[] = [];
  private vadActive = false;
  private vadAboveCount = 0;
  private vadBelowCount = 0;

  setAudioEnabled(enabled: boolean) {
    this.isAudioEnabled = enabled;
    if (!enabled) {
      this.stopRecording();
    }
  }

  setSendSuppressed(_suppressed: boolean) {
    return;
  }

  isAudioPlaybackEnabled() {
    return this.isAudioEnabled;
  }

  clearProcessedChunks(): void {}

  private ensureRecorder() {
    if (this.recorder) return true;
    try {
      const NativeMic = NativeModules.NativeMic;
      if (NativeMic?.start && NativeMic?.stop) {
        this.recorder = NativeMic;
        this.useNativeMic = true;
        nativeLogger.log('AUDIO', 'native mic ready');
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-audio-record');
      const AudioRecord = mod?.default || mod;
      if (!AudioRecord || !AudioRecord.init || !AudioRecord.on || !AudioRecord.start) {
        nativeLogger.warn('AUDIO', 'AudioRecord native module missing');
        return false;
      }
      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 7,
      });
      this.recorder = AudioRecord;
      this.useNativeMic = false;
      nativeLogger.log('AUDIO', 'recorder ready');
      return true;
    } catch (err) {
      nativeLogger.warn('AUDIO', { msg: 'failed to load recorder', err });
      return false;
    }
  }

  async startRecording() {
    if (!this.isAudioEnabled || this.isRecording) return;
    if (!this.ensureRecorder()) return;

    try {
      // Ask for mic permission if the module provides it (mostly iOS).
      if (this.recorder?.requestPermission) {
        const granted = await this.recorder.requestPermission();
        if (!granted) {
          nativeLogger.warn('AUDIO', 'microphone permission denied');
          return;
        }
      }

      this.dataCount = 0;
      this.userTurnChunks = [];
      if (this.useNativeMic) {
        this.isRecording = true;
        try {
          await this.recorder.start();
        } catch (err) {
          nativeLogger.warn('AUDIO', { msg: 'native recorder.start threw', err });
        }
        nativeLogger.log('AUDIO', 'recording started');
        return;
      }
      this.dataHandler = (data: string) => {
        if (!this.isAudioEnabled || !data) return;
        this.dataCount += 1;
        const boosted = scalePcm16Base64(data, MIC_GAIN);
        if (this.dataCount % 50 === 0) {
          nativeLogger.log('AUDIO_OUT', {
            sampleRate: 16000,
            payloadLen: boosted.length,
            frameType: 'base64_json',
          });
        }
        this.userTurnChunks.push(boosted);
        wsService.sendAudioBase64(boosted);
      };
      // react-native-audio-record supports a single listener; overwriting is fine
      this.recorder.on('data', this.dataHandler);
      this.isRecording = true;
      try {
        this.recorder.start();
      } catch (err) {
        nativeLogger.warn('AUDIO', { msg: 'recorder.start threw', err });
      }
      nativeLogger.log('AUDIO', 'recording started');

      // Watchdog: if no data after 2s, warn so we know the native module isn't emitting (common on simulator).
      if (this.watchdog) clearTimeout(this.watchdog);
      this.watchdog = setTimeout(() => {
        if (this.isRecording && this.dataCount === 0) {
          nativeLogger.warn(
            'AUDIO',
            'no mic chunks received (simulators often have no mic); try a real device',
          );
        }
      }, 2000);
    } catch (e) {
      nativeLogger.warn('AUDIO', { msg: 'failed to start recording', e });
      this.isRecording = false;
    }
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    try {
      if (this.useNativeMic) {
        this.recorder?.stop?.();
        nativeLogger.log('AUDIO', 'recording stopped');
        return;
      }
      if (this.userTurnChunks.length) {
        sessionLogger.appendUserAudioChunk(this.userTurnChunks.join(''));
        sessionLogger.flushUserAudioTurn();
        this.userTurnChunks = [];
      }
      if (this.recorder?.stop) {
        this.recorder.stop();
      }
      if (this.recorder?.removeAllListeners) {
        this.recorder.removeAllListeners('data');
      }
      this.dataHandler = null;
      nativeLogger.log('AUDIO', 'recording stopped');
    } catch (e) {
      nativeLogger.warn('AUDIO', { msg: 'failed to stop recorder', e });
    }
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
  }

  async sendAudio(pcm: Int16Array) {
    // Disable binary audio frames; backend expects JSON base64 PCM.
    return;
  }

  private computeRms(base64: string): number {
    try {
      const pcm = Buffer.from(base64, 'base64');
      const sampleCount = Math.floor(pcm.length / 2);
      if (sampleCount === 0) return 0;
      let sumSquares = 0;
      for (let i = 0; i < sampleCount; i += 1) {
        const lo = pcm[i * 2] & 0xff;
        const hi = pcm[i * 2 + 1];
        const sample = (hi << 8) | lo;
        const signed = sample & 0x8000 ? sample - 0x10000 : sample;
        sumSquares += signed * signed;
      }
      return Math.sqrt(sumSquares / sampleCount);
    } catch (err) {
      nativeLogger.warn('AUDIO', { msg: 'rms compute failed', err });
      return 0;
    }
  }
}

export const audioService = new AudioService();
