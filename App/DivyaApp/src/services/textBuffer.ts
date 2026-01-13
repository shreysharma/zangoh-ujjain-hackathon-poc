import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type TextBufferModule = {
  add: (text: string) => void;
  reset: () => void;
};

const NativeTextBuffer: TextBufferModule | undefined = NativeModules.TextBuffer;
const isSupported = Platform.OS !== 'web' && !!NativeTextBuffer;
const emitter = isSupported ? new NativeEventEmitter(NativeTextBuffer as any) : null;

export const textBuffer = {
  isSupported,
  add(text: string) {
    if (!isSupported || !text) return;
    NativeTextBuffer!.add(text);
  },
  reset() {
    if (!isSupported) return;
    NativeTextBuffer!.reset();
  },
  onUpdate(callback: (text: string) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('TextBufferUpdate', callback);
    return () => sub.remove();
  },
};
