import { NativeModules, Platform } from 'react-native';
import { nativeLogger } from './nativeLogger';

type PcmPlayerNativeModule = {
  init: (sampleRate: number) => Promise<void> | void;
  writeBase64: (base64: string) => Promise<void> | void;
  stop: () => Promise<void> | void;
  release: () => Promise<void> | void;
  playTestTone?: () => Promise<void> | void;
};

const NativePcm: PcmPlayerNativeModule | undefined =
  (NativeModules as any).PcmPlayer;

export const pcmPlayer = {
  async init(sampleRate: number) {
    if (!NativePcm) return;
    await NativePcm.init(sampleRate);
  },
  async enqueue(base64: string) {
    if (!NativePcm || !base64) return;
    nativeLogger.log('PCM', { enqueue: base64.length });
    await NativePcm.writeBase64(base64);
  },
  async stop() {
    if (!NativePcm) return;
    await NativePcm.stop();
  },
  async release() {
    if (!NativePcm) return;
    await NativePcm.release();
  },
  async playTestTone() {
    if (!NativePcm?.playTestTone) return;
    await NativePcm.playTestTone();
  },
  isSupported: !!NativePcm,
  platform: Platform.OS,
};
